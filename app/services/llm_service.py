import httpx
import json
import re

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3"

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

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
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
        except:
            pass

    return {
        "intent": "unknown",
        "raw_output": raw_text
    }