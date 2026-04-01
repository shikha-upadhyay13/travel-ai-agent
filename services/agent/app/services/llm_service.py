import asyncio
import httpx
import json
import re
from app.config import OLLAMA_URL, OLLAMA_MODEL, LLM_TIMEOUT, LLM_MAX_RETRIES, get_logger

log = get_logger(__name__)


def extract_json_from_text(text: str):
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return match.group()
    return None


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


async def extract_intent(message: str, history: list = None):
    history_context = ""
    if history and len(history) > 0:
        recent = history[-6:]
        history_lines = []
        for msg in recent:
            role = "User" if msg["role"] == "user" else "Assistant"
            history_lines.append(f"{role}: {msg['content'][:150]}")
        history_context = "\nConversation so far:\n" + "\n".join(history_lines) + "\n"

    prompt = (
        "You are an AI travel assistant. Extract structured booking information from the user's message.\n"
        f"{history_context}\n"
        "Return ONLY valid JSON in this exact format:\n\n"
        '{\n'
        '    "intent": "",\n'
        '    "mode": "",\n'
        '    "source": "",\n'
        '    "destination": "",\n'
        '    "date": "",\n'
        '    "time": ""\n'
        '}\n\n'
        "Rules:\n"
        '- "mode" must be one of: flight, train, bus (or empty if not mentioned)\n'
        '- "source" is the departure city name\n'
        '- "destination" is the arrival city name\n'
        '- "date" should be the travel date as mentioned (e.g., "tomorrow", "March 30", "2026-04-01")\n'
        '- "time" is preferred travel time if mentioned\n'
        '- Leave fields empty ("") if not mentioned in the message\n\n'
        f'User message: "{message}"'
    )

    for attempt in range(LLM_MAX_RETRIES):
        try:
            result = await _call_ollama(prompt)
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
            log.error("Ollama timed out (attempt %d/%d)", attempt + 1, LLM_MAX_RETRIES)
            if attempt < LLM_MAX_RETRIES - 1:
                await asyncio.sleep(1)
        except Exception as e:
            log.error("extract_intent failed (attempt %d/%d): %s", attempt + 1, LLM_MAX_RETRIES, e)
            if attempt < LLM_MAX_RETRIES - 1:
                await asyncio.sleep(1)

    return {"intent": "unknown"}


async def generate_chat_response(message: str, history: list = None, intent: str = "general_chat") -> str:
    """Generate a natural conversational response for general chat and support queries."""
    history_context = ""
    if history and len(history) > 0:
        recent = history[-8:]
        history_lines = []
        for msg in recent:
            role = "User" if msg["role"] == "user" else "Assistant"
            history_lines.append(f"{role}: {msg['content'][:200]}")
        history_context = "\n".join(history_lines)

    if intent == "support":
        system_context = (
            "You are TravelAI's support assistant. You help users with:\n"
            "- Existing booking issues (cancellation, modification, refunds)\n"
            "- Payment problems\n"
            "- Complaint resolution\n"
            "- General troubleshooting\n\n"
            "Be empathetic, professional, and provide actionable steps. "
            "If you can't resolve it directly, suggest contacting the relevant service "
            "(IRCTC, airline, bus operator). Keep responses to 2-4 sentences."
        )
    else:
        system_context = (
            "You are TravelAI, a friendly Indian travel assistant chatbot. "
            "You help users book flights, trains, and buses across India, "
            "and answer travel-related questions.\n\n"
            "Your personality:\n"
            "- Warm, professional, and concise\n"
            "- Knowledgeable about Indian travel (IRCTC, airlines, bus operators)\n"
            "- You can help with: booking tickets (flights/trains/buses), "
            "travel queries, baggage rules, cancellation policies\n"
            "- Keep responses to 2-3 sentences\n"
            "- If the user greets you, greet back and briefly mention what you can help with\n"
            "- If they thank you, respond graciously\n"
            "- If they ask something outside travel, politely redirect to travel topics"
        )

    prompt = (
        f"{system_context}\n\n"
        f"Conversation history:\n{history_context}\n\n"
        f"User: {message}\n\n"
        "Assistant:"
    )

    try:
        result = await _call_ollama(prompt, temperature=0.7)
        response = result.get("response", "").strip()
        if response:
            return response
    except Exception as e:
        log.error("generate_chat_response failed: %s", e)

    if intent == "support":
        return "I'm sorry you're facing this issue. Could you describe the problem in more detail? I'll do my best to help, or guide you to the right support channel."
    return "Hello! I'm TravelAI, your travel assistant. I can help you book flights, trains, and buses, or answer travel-related questions. How can I help you today?"
