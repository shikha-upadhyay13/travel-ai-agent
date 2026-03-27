# app/core/intent_router.py

import asyncio
import httpx
from app.config import OLLAMA_URL, OLLAMA_MODEL, get_logger

log = get_logger(__name__)

ALLOWED_INTENTS = {"booking", "travel_query", "general_chat", "support", "unknown"}
MAX_RETRIES = 2


async def _call_ollama(prompt: str) -> dict:
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0}
            }
        )
    return response.json()


async def classify_intent(message: str) -> str:
    prompt = f"""
You are an AI intent classifier for a travel assistant.

Classify the user message into ONE of the following categories:

- booking
- travel_query
- general_chat
- support
- unknown

Return ONLY the category name, nothing else.

User message: "{message}"
"""

    for attempt in range(MAX_RETRIES):
        try:
            result = await _call_ollama(prompt)
            raw = result.get("response", "").strip().lower()

            for intent in ALLOWED_INTENTS:
                if intent in raw:
                    return intent

            log.warning("Unrecognized intent from LLM: '%s'", raw)
            return "unknown"

        except httpx.TimeoutException:
            log.error("Ollama timed out (attempt %d/%d)", attempt + 1, MAX_RETRIES)
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(1)
        except Exception as e:
            log.error("classify_intent failed (attempt %d/%d): %s", attempt + 1, MAX_RETRIES, e)
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(1)

    return "unknown"
