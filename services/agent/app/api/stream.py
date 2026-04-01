# app/api/stream.py — Server-Sent Events streaming endpoint

import json
import httpx
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator
from app.config import OLLAMA_URL, OLLAMA_MODEL, LLM_TIMEOUT, get_logger
from app.core.intent_router import classify_intent
from app.core.rate_limiter import rate_limiter
from app.services.llm_service import extract_intent
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
router = APIRouter()


class StreamRequest(BaseModel):
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


def _perform_search(mode, source, destination, date):
    resolved_date = resolve_date(date)
    if mode == "train":
        return search_trains(source, destination, resolved_date), "train"
    elif mode == "bus":
        return search_buses(source, destination, resolved_date), "bus"
    else:
        return search_flights(source, destination, resolved_date), "flight"


async def _stream_ollama(prompt: str, temperature: float = 0.7):
    """Stream tokens from Ollama one at a time."""
    async with httpx.AsyncClient(timeout=float(LLM_TIMEOUT)) as client:
        async with client.stream(
            "POST",
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": True,
                "options": {"temperature": temperature}
            }
        ) as response:
            async for line in response.aiter_lines():
                if line.strip():
                    try:
                        data = json.loads(line)
                        token = data.get("response", "")
                        if token:
                            yield token
                        if data.get("done", False):
                            break
                    except json.JSONDecodeError:
                        continue


async def _generate_streaming_response(event_type: str, data: dict):
    """Format a Server-Sent Event."""
    return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"


@router.post("/chat/stream")
async def chat_stream(request: Request, stream_request: StreamRequest):
    user_id = stream_request.user_id
    message_text = stream_request.message

    async def event_generator():
        try:
            # Rate check
            if not rate_limiter.is_allowed(user_id):
                yield await _generate_streaming_response("error", {
                    "message": "You're sending messages too quickly. Please wait a moment."
                })
                return

            detected_lang = detect_language(message_text)
            message = await translate_to_english(message_text)

            add_message(user_id, "user", message_text)
            db_save_message(user_id, "user", message_text, detected_lang)
            history = get_history(user_id)

            # Cancel/reset
            if message.strip().lower() in ["cancel", "reset", "start over", "restart", "quit"]:
                clear_state(user_id)
                reply = "Conversation reset. How can I help you?"
                add_message(user_id, "assistant", reply)
                db_save_message(user_id, "assistant", reply)
                yield await _generate_streaming_response("complete", {"reply": reply})
                return

            existing_state = get_state(user_id)

            # Handle booking confirmation flow
            if existing_state and existing_state.get("intent") == "booking":
                if existing_state.get("awaiting_confirmation"):
                    if message.strip().lower() in ["yes", "y", "confirm", "proceed", "ok", "sure", "yep", "yeah", "haan", "ha"]:
                        slots = existing_state["slots"]
                        mode, source = slots["mode"], slots["source"]
                        destination, date = slots["destination"], slots["date"]

                        results, mode = _perform_search(mode, source, destination, date)
                        resolved_date = resolve_date(date)
                        booking_ref = create_booking(user_id, mode, source, destination, resolved_date, results, slots.get("time", ""))
                        clear_state(user_id)

                        reply = f"Here are the available {mode} options:"
                        add_message(user_id, "assistant", reply)
                        db_save_message(user_id, "assistant", reply)

                        yield await _generate_streaming_response("results", {
                            "reply": reply,
                            "data": {
                                "mode": mode, "source": source,
                                "destination": destination, "date": resolved_date,
                                "results": results, "booking_ref": booking_ref
                            }
                        })
                        return

                    elif message.strip().lower() in ["no", "n", "cancel", "nope", "nahi"]:
                        clear_state(user_id)
                        reply = "Booking cancelled. How else can I help you?"
                        add_message(user_id, "assistant", reply)
                        db_save_message(user_id, "assistant", reply)
                        yield await _generate_streaming_response("complete", {"reply": reply})
                        return
                    else:
                        reply = "Please confirm with 'yes' to proceed with the search, or 'no' to cancel."
                        add_message(user_id, "assistant", reply)
                        db_save_message(user_id, "assistant", reply)
                        yield await _generate_streaming_response("complete", {"reply": reply})
                        return

                intent = "booking"
            else:
                intent = await classify_intent(message, history)

            # --- BOOKING ---
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
                    reply = generate_missing_prompt(missing)
                    add_message(user_id, "assistant", reply)
                    db_save_message(user_id, "assistant", reply)
                    yield await _generate_streaming_response("complete", {"reply": reply})
                    return

                summary = format_booking_summary(slots)
                update_state(user_id, {"intent": "booking", "slots": slots, "awaiting_confirmation": True})
                reply = f"I'll search for {summary}. Shall I proceed? (yes/no)"
                add_message(user_id, "assistant", reply)
                db_save_message(user_id, "assistant", reply)
                yield await _generate_streaming_response("complete", {"reply": reply})
                return

            # --- RAG QUERY (streamed) ---
            if intent == "travel_query":
                rag = getattr(request.app.state, "rag", None)
                if rag and rag.vector_store.index is not None:
                    results = rag.vector_store.search(message, top_k=3)
                    if results:
                        context = "\n\n".join(results)
                        prompt = (
                            "You are a helpful Indian travel assistant. Answer the user's question "
                            "based ONLY on the context provided below. Be specific and cite relevant details.\n"
                            "If the context doesn't contain relevant information, say so honestly.\n"
                            "Keep your answer concise (2-4 sentences).\n\n"
                            f"Context:\n{context}\n\n"
                            f"Question: {message}\n\nAnswer:"
                        )
                        full_response = ""
                        async for token in _stream_ollama(prompt, temperature=0.3):
                            full_response += token
                            yield await _generate_streaming_response("token", {"token": token})

                        add_message(user_id, "assistant", full_response)
                        db_save_message(user_id, "assistant", full_response)
                        yield await _generate_streaming_response("done", {})
                        return

                reply = "I don't have specific information about that. Could you try rephrasing your question?"
                add_message(user_id, "assistant", reply)
                db_save_message(user_id, "assistant", reply)
                yield await _generate_streaming_response("complete", {"reply": reply})
                return

            # --- GENERAL CHAT / SUPPORT (streamed) ---
            history_context = ""
            if history:
                recent = history[-8:]
                lines = [f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content'][:200]}" for m in recent]
                history_context = "\n".join(lines)

            if intent == "support":
                system = (
                    "You are TravelAI's support assistant. Help with booking issues, cancellations, refunds. "
                    "Be empathetic and provide actionable steps. Keep responses to 2-4 sentences."
                )
            else:
                system = (
                    "You are TravelAI, a friendly Indian travel assistant. "
                    "Help users book flights/trains/buses and answer travel questions. "
                    "Keep responses to 2-3 sentences. Be warm and professional."
                )

            prompt = f"{system}\n\nConversation history:\n{history_context}\n\nUser: {message}\n\nAssistant:"

            full_response = ""
            async for token in _stream_ollama(prompt, temperature=0.7):
                full_response += token
                yield await _generate_streaming_response("token", {"token": token})

            add_message(user_id, "assistant", full_response)
            db_save_message(user_id, "assistant", full_response)
            yield await _generate_streaming_response("done", {})

        except Exception as e:
            log.error("Stream error for user=%s: %s", user_id, e, exc_info=True)
            yield await _generate_streaming_response("error", {
                "message": "Something went wrong. Please try again."
            })

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
