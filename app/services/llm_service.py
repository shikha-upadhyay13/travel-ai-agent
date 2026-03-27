import asyncio
import httpx
import json
import re
from app.config import OLLAMA_URL, OLLAMA_MODEL, get_logger

log = get_logger(__name__)

MAX_RETRIES = 2


def extract_json_from_text(text: str):
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return match.group()
    return None


async def extract_intent(message: str):
    prompt = f"""
You are an AI travel assistant.

Extract structured JSON from the user's message.

Return ONLY valid JSON in this format:

{{
    "intent": "",
    "mode": "",
    "source": "",
    "destination": "",
    "date": "",
    "time": ""
}}

Possible intents:
- book_travel
- travel_query
- cancel_booking
- modify_booking
- greeting
- unknown

User message: "{message}"
"""

    for attempt in range(MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    OLLAMA_URL,
                    json={
                        "model": OLLAMA_MODEL,
                        "prompt": prompt,
                        "stream": False
                    }
                )

            result = response.json()
            raw_text = result.get("response", "")

            json_text = extract_json_from_text(raw_text)

            if json_text:
                try:
                    return json.loads(json_text)
                except (json.JSONDecodeError, ValueError) as e:
                    log.warning("Failed to parse JSON from LLM response: %s", e)

            log.info("LLM returned non-JSON response: %s", raw_text[:200])
            return {"intent": "unknown", "raw_output": raw_text}

        except httpx.TimeoutException:
            log.error("Ollama timed out (attempt %d/%d)", attempt + 1, MAX_RETRIES)
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(1)
        except Exception as e:
            log.error("extract_intent failed (attempt %d/%d): %s", attempt + 1, MAX_RETRIES, e)
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(1)

    return {"intent": "unknown"}
