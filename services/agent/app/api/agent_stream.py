# /agent/chat/stream — SSE streaming endpoint with agent state transitions

import json
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator
from app.config import get_logger
from app.core.agent_state import AgentState
from app.services.groq_service import is_groq_configured, groq_chat_stream
from app.services.translation_service import translate_to_english, detect_language
from app.core.intent_router import classify_intent
from app.services.llm_service import extract_intent, generate_chat_response
from app.core.state_manager import get_state, update_state, clear_state, add_message, get_history
from app.core.slot_manager import (
    initialize_slots, merge_slots, check_missing_slots,
    generate_missing_prompt, resolve_date, format_booking_summary,
)
from app.services.flight_service import search_flights
from app.services.train_service import search_trains
from app.services.bus_service import search_buses
from app.db.database import save_message as db_save_message, create_booking
from app.api.agent import _format_results_as_cards, STAY_SUGGESTIONS

log = get_logger(__name__)
router = APIRouter(prefix="/agent")


class StreamRequest(BaseModel):
    user_id: str
    message: str
    session_id: str = ""

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Message cannot be empty")
        return v.strip()


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _perform_search(mode, source, destination, date):
    resolved = resolve_date(date)
    if mode == "train":
        return search_trains(source, destination, resolved), "train"
    elif mode == "bus":
        return search_buses(source, destination, resolved), "bus"
    return search_flights(source, destination, resolved), "flight"


@router.post("/chat/stream")
async def agent_chat_stream(request: Request, req: StreamRequest):

    async def event_generator():
        user_id = req.user_id

        try:
            # State: THINKING
            yield _sse("state", {"agent_state": AgentState.THINKING.value, "label": "Understanding your request..."})

            detected_lang = detect_language(req.message)
            message = await translate_to_english(req.message)

            add_message(user_id, "user", req.message)
            db_save_message(user_id, "user", req.message, detected_lang)
            history = get_history(user_id)

            # Cancel
            if message.strip().lower() in ["cancel", "reset", "start over", "restart", "quit"]:
                clear_state(user_id)
                yield _sse("message", {"role": "assistant", "content": "Conversation reset. How can I help?", "message_type": "text"})
                yield _sse("state", {"agent_state": AgentState.IDLE.value})
                yield _sse("done", {})
                return

            existing_state = get_state(user_id)

            # Active booking flow — confirmation
            if existing_state and existing_state.get("intent") == "booking" and existing_state.get("awaiting_confirmation"):
                lower = message.strip().lower()

                if lower in ["yes", "y", "confirm", "proceed", "ok", "sure", "yep", "yeah", "haan", "ha"]:
                    slots = existing_state["slots"]
                    mode, source, destination, date = slots["mode"], slots["source"], slots["destination"], slots["date"]

                    yield _sse("state", {"agent_state": AgentState.SEARCHING.value, "label": f"Searching {mode}s from {source} to {destination}..."})

                    results, mode = _perform_search(mode, source, destination, date)
                    resolved_date = resolve_date(date)
                    booking_ref = create_booking(user_id, mode, source, destination, resolved_date, results, slots.get("time", ""))
                    cards = _format_results_as_cards(mode, results)
                    clear_state(user_id)

                    yield _sse("state", {"agent_state": AgentState.PRESENTING.value})
                    yield _sse("message", {"role": "assistant", "content": f"Found {len(results)} {mode} options:", "message_type": "text"})
                    yield _sse("message", {"role": "assistant", "content": None, "message_type": f"{mode}_results", "metadata": {"results": cards, "booking_ref": booking_ref}})
                    yield _sse("message", {"role": "assistant", "content": None, "message_type": "chips", "metadata": {"chips": [f"\u2705 Book {cards[0]['name']}", "Show more", "\u274c Cancel"]}})
                    yield _sse("done", {"session": {"booking_ref": booking_ref}})
                    return

                elif lower in ["no", "n", "cancel", "nope", "nahi"]:
                    clear_state(user_id)
                    yield _sse("message", {"role": "assistant", "content": "Booking cancelled. How else can I help?", "message_type": "text"})
                    yield _sse("state", {"agent_state": AgentState.IDLE.value})
                    yield _sse("done", {})
                    return

            # Classify intent
            if existing_state and existing_state.get("intent") == "booking":
                intent = "booking"
            else:
                intent = await classify_intent(message, history)

            log.info("Stream intent: %s", intent)

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
                    add_message(user_id, "assistant", prompt)
                    yield _sse("message", {"role": "assistant", "content": prompt, "message_type": "text"})
                    yield _sse("state", {"agent_state": AgentState.THINKING.value})
                    yield _sse("done", {"session": {"slots": slots, "missing": missing}})
                    return

                # All slots filled
                summary = format_booking_summary(slots)
                update_state(user_id, {"intent": "booking", "slots": slots, "awaiting_confirmation": True})

                reply = f"I'll search for {summary}. Shall I proceed?"
                add_message(user_id, "assistant", reply)

                yield _sse("state", {"agent_state": AgentState.CONFIRMING.value})
                yield _sse("message", {"role": "assistant", "content": reply, "message_type": "text"})
                yield _sse("message", {"role": "assistant", "content": None, "message_type": "chips", "metadata": {"chips": ["\u2705 Yes, search", "\u274c Cancel"]}})
                yield _sse("done", {"session": {"slots": slots}})
                return

            # ── GENERAL / SUPPORT — stream tokens ──
            if is_groq_configured():
                if intent == "support":
                    system = "You are YatraAI's support assistant. Be empathetic, concise (2-4 sentences)."
                else:
                    system = "You are YatraAI, a friendly Indian travel assistant. Be warm and concise (2-3 sentences)."

                history_lines = ""
                if history:
                    recent = history[-8:]
                    history_lines = "\n".join(
                        f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content'][:200]}" for m in recent
                    )

                msgs = [
                    {"role": "system", "content": system},
                    {"role": "user", "content": f"Conversation:\n{history_lines}\n\nUser: {message}\n\nAssistant:"},
                ]

                full_response = ""
                async for token in groq_chat_stream(msgs, temperature=0.7):
                    full_response += token
                    yield _sse("token", {"content": token})

                add_message(user_id, "assistant", full_response)
                db_save_message(user_id, "assistant", full_response)
                yield _sse("message", {"role": "assistant", "content": None, "message_type": "chips", "metadata": {"chips": ["\U0001f686 Book a train", "\U0001f68c Find a bus", "\u2708\ufe0f Search flights"]}})
            else:
                # Non-streaming fallback
                reply = await generate_chat_response(message, history, intent=intent)
                add_message(user_id, "assistant", reply)
                db_save_message(user_id, "assistant", reply)
                yield _sse("message", {"role": "assistant", "content": reply, "message_type": "text"})

            yield _sse("state", {"agent_state": AgentState.IDLE.value})
            yield _sse("done", {})

        except Exception as e:
            log.error("Stream error: %s", e, exc_info=True)
            yield _sse("error", {"content": "Something went wrong. Please try again."})
            yield _sse("done", {})

    return StreamingResponse(event_generator(), media_type="text/event-stream")
