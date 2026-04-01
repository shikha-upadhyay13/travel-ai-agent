# /agent/chat — Unified agent endpoint returning structured JSON for Next.js frontend

from fastapi import APIRouter, Request
from pydantic import BaseModel, field_validator
from app.config import get_logger
from app.core.agent_state import (
    AgentState, MessageType,
    make_text_message, make_card_message, make_chips_message, make_agent_response,
)
from app.core.intent_router import classify_intent
from app.core.rate_limiter import rate_limiter
from app.services.llm_service import extract_intent, generate_chat_response
from app.services.translation_service import translate_to_english, detect_language
from app.core.state_manager import get_state, update_state, clear_state, add_message, get_history
from app.core.slot_manager import (
    initialize_slots, merge_slots, check_missing_slots,
    generate_missing_prompt, resolve_date, format_booking_summary,
)
from app.services.flight_service import search_flights
from app.services.train_service import search_trains
from app.services.bus_service import search_buses
from app.db.database import save_message as db_save_message, create_booking

log = get_logger(__name__)
router = APIRouter(prefix="/agent")


class AgentChatRequest(BaseModel):
    user_id: str
    message: str
    session_id: str = ""

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Message cannot be empty")
        return v.strip()

    @field_validator("user_id")
    @classmethod
    def user_id_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("User ID cannot be empty")
        return v.strip()


def _save_reply(user_id: str, reply: str):
    add_message(user_id, "assistant", reply)
    db_save_message(user_id, "assistant", reply)


def _format_results_as_cards(mode: str, results: list) -> list[dict]:
    """Convert raw search results to card-ready format."""
    cards = []
    for i, item in enumerate(results):
        if mode == "train":
            cards.append({
                "name": item.get("train_name", "Unknown"),
                "number": item.get("train_id", ""),
                "departure": item.get("departure_time", ""),
                "arrival": item.get("arrival_time", ""),
                "duration": item.get("duration", ""),
                "price": item.get("price", 0),
                "class": item.get("class", "Sleeper"),
                "seats": item.get("available_seats", 20),
                "recommended": i == 0,
            })
        elif mode == "bus":
            cards.append({
                "name": item.get("operator", "Unknown"),
                "number": item.get("bus_id", ""),
                "departure": item.get("departure_time", ""),
                "arrival": item.get("arrival_time", ""),
                "duration": item.get("duration", ""),
                "price": item.get("price", 0),
                "class": item.get("bus_type", "AC"),
                "seats": item.get("available_seats", 15),
                "recommended": i == 0,
            })
        else:  # flight
            cards.append({
                "name": item.get("airline", "Unknown"),
                "number": item.get("flight_id", ""),
                "departure": item.get("departure_time", ""),
                "arrival": item.get("arrival_time", ""),
                "duration": item.get("duration", ""),
                "price": item.get("price", 0),
                "class": item.get("class", "Economy"),
                "seats": item.get("available_seats", 10),
                "recommended": i == 0,
            })
    return cards


def _perform_search(mode: str, source: str, destination: str, date: str):
    resolved_date = resolve_date(date)
    if mode == "train":
        return search_trains(source, destination, resolved_date), "train"
    elif mode == "bus":
        return search_buses(source, destination, resolved_date), "bus"
    else:
        return search_flights(source, destination, resolved_date), "flight"


STAY_SUGGESTIONS = [
    {"name": "Gurudwara Bangla Sahib", "type": "Dharamshala", "price": "Free", "distance": "2.1 km from station", "rating": 4},
    {"name": "Railway Retiring Room", "type": "Retiring Room", "price": "\u20b9350/night", "distance": "Platform 1", "rating": 3},
    {"name": "OYO Near Station", "type": "Hotel", "price": "\u20b9899/night", "distance": "3.5 km \u00b7 AC", "rating": 4},
]


@router.post("/chat")
async def agent_chat(request: Request, req: AgentChatRequest):
    user_id = req.user_id
    log.info("Agent chat: user=%s message='%s'", user_id, req.message[:100])

    if not rate_limiter.is_allowed(user_id):
        return make_agent_response(
            AgentState.ERROR,
            [make_text_message("You're sending messages too quickly. Please wait a moment.")],
        )

    try:
        detected_lang = detect_language(req.message)
        message = await translate_to_english(req.message)

        add_message(user_id, "user", req.message)
        db_save_message(user_id, "user", req.message, detected_lang)
        history = get_history(user_id)

        # Cancel / reset
        if message.strip().lower() in ["cancel", "reset", "start over", "restart", "quit"]:
            clear_state(user_id)
            reply = "Conversation reset. How can I help you?"
            _save_reply(user_id, reply)
            return make_agent_response(
                AgentState.IDLE,
                [make_text_message(reply)],
            )

        existing_state = get_state(user_id)

        # ── ACTIVE BOOKING FLOW ──
        if existing_state and existing_state.get("intent") == "booking":

            # User confirming search
            if existing_state.get("awaiting_confirmation"):
                lower = message.strip().lower()

                if lower in ["yes", "y", "confirm", "proceed", "ok", "sure", "yep", "yeah", "haan", "ha",
                             "\u2705 book ap express", "book ap express", "book this", "select"]:
                    slots = existing_state["slots"]
                    mode = slots["mode"]
                    source = slots["source"]
                    destination = slots["destination"]
                    date = slots["date"]

                    results, mode = _perform_search(mode, source, destination, date)
                    resolved_date = resolve_date(date)
                    booking_ref = create_booking(user_id, mode, source, destination, resolved_date, results, slots.get("time", ""))

                    cards = _format_results_as_cards(mode, results)
                    clear_state(user_id)

                    messages = [
                        make_text_message(f"Found {len(results)} {mode} options from {source} to {destination}:"),
                        make_card_message(f"{mode}_results", {"results": cards, "booking_ref": booking_ref}),
                        make_text_message(f"\u2b50 {cards[0]['name']} is recommended. Select one to proceed with booking."),
                        make_chips_message([
                            f"\u2705 Book {cards[0]['name']}",
                            "Show other options",
                            "\u270f\ufe0f Change date",
                            "\u274c Cancel",
                        ]),
                    ]

                    return make_agent_response(
                        AgentState.PRESENTING,
                        messages,
                        {"slots": slots, "intent": "booking", "booking_ref": booking_ref},
                    )

                elif lower in ["no", "n", "cancel", "nope", "nahi", "\u274c cancel"]:
                    clear_state(user_id)
                    return make_agent_response(
                        AgentState.IDLE,
                        [
                            make_text_message("No worries! Booking cancelled."),
                            make_chips_message(["\U0001f686 Book a train", "\U0001f68c Find a bus", "\u2708\ufe0f Search flights"]),
                        ],
                    )

                else:
                    return make_agent_response(
                        AgentState.CONFIRMING,
                        [make_text_message("Please confirm with 'yes' to search, or 'no' to cancel.")],
                        {"slots": existing_state.get("slots"), "intent": "booking"},
                    )

            # Continue slot filling
            intent = "booking"
        else:
            intent = await classify_intent(message, history)

        log.info("Intent: %s", intent)

        # ── BOOKING ──
        if intent == "booking":
            structured = await extract_intent(message, history)
            new_slots = initialize_slots(structured)

            if existing_state and "slots" in existing_state:
                slots = merge_slots(existing_state["slots"], new_slots)
            else:
                slots = new_slots

            missing = check_missing_slots(slots)

            update_state(user_id, {"intent": "booking", "slots": slots})

            if missing:
                prompt = generate_missing_prompt(missing)
                _save_reply(user_id, prompt)
                return make_agent_response(
                    AgentState.THINKING,
                    [make_text_message(prompt)],
                    {"slots": slots, "intent": "booking", "missing": missing},
                )

            # All slots filled — confirm
            summary = format_booking_summary(slots)
            update_state(user_id, {"intent": "booking", "slots": slots, "awaiting_confirmation": True})

            reply = f"I'll search for {summary}. Shall I proceed?"
            _save_reply(user_id, reply)

            return make_agent_response(
                AgentState.CONFIRMING,
                [
                    make_text_message(reply),
                    make_chips_message(["\u2705 Yes, search", "\u270f\ufe0f Change details", "\u274c Cancel"]),
                ],
                {"slots": slots, "intent": "booking"},
            )

        # ── TRAVEL QUERY (RAG) ──
        elif intent == "travel_query":
            rag = getattr(request.app.state, "rag", None)
            if rag:
                reply = await rag.answer_query(message)
            else:
                reply = "Knowledge base is not available right now."
            _save_reply(user_id, reply)
            return make_agent_response(AgentState.IDLE, [make_text_message(reply)])

        # ── GENERAL CHAT / SUPPORT ──
        elif intent in ("general_chat", "support"):
            reply = await generate_chat_response(message, history, intent=intent)
            _save_reply(user_id, reply)
            return make_agent_response(
                AgentState.IDLE,
                [
                    make_text_message(reply),
                    make_chips_message(["\U0001f686 Book a train", "\U0001f68c Find a bus", "\u2708\ufe0f Search flights", "\U0001f3e8 Need a hotel"]),
                ],
            )

        # ── UNKNOWN ──
        else:
            reply = await generate_chat_response(message, history, intent="general_chat")
            _save_reply(user_id, reply)
            return make_agent_response(AgentState.IDLE, [make_text_message(reply)])

    except Exception as e:
        log.error("Agent chat error: user=%s: %s", user_id, e, exc_info=True)
        return make_agent_response(
            AgentState.ERROR,
            [make_text_message("I'm having trouble right now. Please try again in a moment.")],
        )
