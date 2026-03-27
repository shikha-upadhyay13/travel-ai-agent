# app/api/chat.py

from fastapi import APIRouter, Request
from pydantic import BaseModel, field_validator
from app.config import get_logger
from app.core.intent_router import classify_intent
from app.core.rate_limiter import rate_limiter
from app.services.llm_service import extract_intent
from app.services.translation_service import translate_to_english
from app.core.state_manager import get_state, update_state, clear_state, add_message
from app.core.slot_manager import (
    initialize_slots,
    merge_slots,
    check_missing_slots,
    generate_missing_prompt
)
from app.services.flight_service import search_flights
from app.services.train_service import search_trains
from app.services.bus_service import search_buses

log = get_logger(__name__)
router = APIRouter()


class ChatRequest(BaseModel):
    user_id: str
    message: str

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


def format_results(mode: str, results: list) -> str:
    if not results:
        return "No results found."

    lines = [f"Here are the available {mode} options:\n"]
    for i, item in enumerate(results, 1):
        if mode == "flight":
            lines.append(
                f"{i}. {item['airline']} ({item['flight_id']}) | "
                f"{item['departure_time']} -> {item['arrival_time']} | "
                f"Rs.{item['price']}"
            )
        elif mode == "train":
            lines.append(
                f"{i}. {item['train_name']} ({item['train_id']}) | "
                f"{item['departure_time']} -> {item['arrival_time']} | "
                f"{item['class']} | Rs.{item['price']}"
            )
        elif mode == "bus":
            lines.append(
                f"{i}. {item['operator']} ({item['bus_id']}) | "
                f"{item['departure_time']} -> {item['arrival_time']} | "
                f"{item['bus_type']} | Rs.{item['price']}"
            )

    return "\n".join(lines)


@router.post("/chat")
async def chat(request: Request, chat_request: ChatRequest):
    user_id = chat_request.user_id
    log.info("Chat request from user=%s message='%s'", user_id, chat_request.message[:100])

    # Rate limiting
    if not rate_limiter.is_allowed(user_id):
        return {"reply": "You're sending messages too quickly. Please wait a moment and try again."}

    try:
        # Translate non-English input to English
        message = await translate_to_english(chat_request.message)

        # Track conversation history
        add_message(user_id, "user", chat_request.message)

        # Check for cancel/reset commands
        if message.strip().lower() in ["cancel", "reset", "start over", "restart", "quit"]:
            clear_state(user_id)
            reply = "Conversation reset. How can I help you?"
            add_message(user_id, "assistant", reply)
            return {"reply": reply}

        # Check if user already in booking flow
        existing_state = get_state(user_id)

        if existing_state and existing_state.get("intent") == "booking":
            # Check if user is confirming the search
            if existing_state.get("awaiting_confirmation"):
                if message.strip().lower() in ["yes", "y", "confirm", "proceed", "ok", "sure", "yep", "yeah", "haan", "ha"]:
                    slots = existing_state["slots"]
                    mode = slots["mode"]
                    source = slots["source"]
                    destination = slots["destination"]
                    date = slots["date"]

                    log.info("Confirmed search %s: %s -> %s on %s", mode, source, destination, date)

                    if mode == "train":
                        results = search_trains(source, destination, date)
                    elif mode == "bus":
                        results = search_buses(source, destination, date)
                    else:
                        results = search_flights(source, destination, date)
                        mode = "flight"

                    clear_state(user_id)

                    reply = format_results(mode, results)
                    add_message(user_id, "assistant", reply)

                    return {
                        "reply": reply,
                        "data": {
                            "mode": mode,
                            "source": source,
                            "destination": destination,
                            "date": date,
                            "results": results
                        }
                    }
                elif message.strip().lower() in ["no", "n", "cancel", "nope", "nahi"]:
                    clear_state(user_id)
                    reply = "Booking cancelled. How else can I help you?"
                    add_message(user_id, "assistant", reply)
                    return {"reply": reply}

            intent = "booking"
        else:
            intent = await classify_intent(message)

        log.info("Intent classified as: %s", intent)

        # -------- BOOKING MODE --------
        if intent == "booking":
            structured = await extract_intent(message)
            new_slots = initialize_slots(structured)

            if existing_state and "slots" in existing_state:
                slots = merge_slots(existing_state["slots"], new_slots)
            else:
                slots = new_slots

            missing_fields = check_missing_slots(slots)

            update_state(user_id, {
                "intent": "booking",
                "slots": slots
            })

            if missing_fields:
                reply = generate_missing_prompt(missing_fields)
                add_message(user_id, "assistant", reply)
                return {"reply": reply}

            # All slots filled — ask for confirmation
            mode = slots["mode"]
            source = slots["source"]
            destination = slots["destination"]
            date = slots["date"]

            update_state(user_id, {
                "intent": "booking",
                "slots": slots,
                "awaiting_confirmation": True
            })

            reply = f"I'll search for {mode}s from {source} to {destination} on {date}. Shall I proceed? (yes/no)"
            add_message(user_id, "assistant", reply)
            return {"reply": reply}

        # -------- TRAVEL QUERY MODE (RAG) --------
        elif intent == "travel_query":
            rag = getattr(request.app.state, "rag", None)
            if rag:
                reply = await rag.answer_query(message)
            else:
                reply = "Knowledge base is not available right now. Please try again later."
            add_message(user_id, "assistant", reply)
            return {"reply": reply}

        # -------- GENERAL CHAT MODE --------
        elif intent == "general_chat":
            reply = "Hello! I'm your travel assistant. I can help you book flights, trains, and buses, or answer travel-related questions. How can I help you today?"
            add_message(user_id, "assistant", reply)
            return {"reply": reply}

        # -------- SUPPORT --------
        elif intent == "support":
            reply = "I'm sorry to hear you're having trouble. Please describe the issue you're facing with your booking and I'll do my best to help."
            add_message(user_id, "assistant", reply)
            return {"reply": reply}

        reply = "I'm not sure how to help with that. I specialize in travel assistance - try asking me to book a ticket or answer a travel question!"
        add_message(user_id, "assistant", reply)
        return {"reply": reply}

    except Exception as e:
        log.error("Chat endpoint error for user=%s: %s", user_id, e, exc_info=True)
        return {
            "reply": "I'm having trouble processing your request right now. Please make sure the AI service is running and try again."
        }
