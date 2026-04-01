# app/core/intent_router.py

import asyncio
import httpx
from app.config import OLLAMA_URL, OLLAMA_MODEL, LLM_TIMEOUT, LLM_MAX_RETRIES, get_logger

log = get_logger(__name__)

ALLOWED_INTENTS = {"booking", "travel_query", "general_chat", "support", "unknown"}


async def _call_ollama(prompt: str, temperature: float = 0) -> dict:
    async with httpx.AsyncClient(timeout=float(LLM_TIMEOUT)) as client:
        response = await client.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": temperature}
            }
        )
    return response.json()


async def classify_intent(message: str, history: list = None) -> str:
    history_context = ""
    if history and len(history) > 0:
        recent = history[-6:]  # Last 3 exchanges
        history_lines = []
        for msg in recent:
            role = "User" if msg["role"] == "user" else "Assistant"
            history_lines.append(f"{role}: {msg['content'][:100]}")
        history_context = f"\nRecent conversation:\n" + "\n".join(history_lines) + "\n"

    prompt = f"""You are an AI intent classifier for a travel booking assistant.
{history_context}
Classify the user's LATEST message into exactly ONE category:

- booking: User wants to book/search for flights, trains, or buses, or is providing details for a booking (cities, dates, travel mode)
- travel_query: User is asking a question about travel (baggage rules, IRCTC help, visa info, cancellation policy, etc.)
- general_chat: Greetings, small talk, thanks, or general conversation
- support: User needs help with an existing booking, has a complaint, or needs customer support
- unknown: Cannot determine intent

Return ONLY the category name, nothing else.

User message: "{message}"
"""

    for attempt in range(LLM_MAX_RETRIES):
        try:
            result = await _call_ollama(prompt)
            raw = result.get("response", "").strip().lower()

            for intent in ALLOWED_INTENTS:
                if intent in raw:
                    return intent

            log.warning("Unrecognized intent from LLM: '%s'", raw)
            return "unknown"

        except httpx.TimeoutException:
            log.error("Ollama timed out (attempt %d/%d)", attempt + 1, LLM_MAX_RETRIES)
            if attempt < LLM_MAX_RETRIES - 1:
                await asyncio.sleep(1)
        except Exception as e:
            log.error("classify_intent failed (attempt %d/%d): %s", attempt + 1, LLM_MAX_RETRIES, e)
            if attempt < LLM_MAX_RETRIES - 1:
                await asyncio.sleep(1)

    return "unknown"
