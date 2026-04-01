# LLM service — uses Groq as primary, Ollama as fallback

import asyncio
import httpx
import json
import re
from app.config import OLLAMA_URL, OLLAMA_MODEL, LLM_TIMEOUT, LLM_MAX_RETRIES, get_logger
from app.services.groq_service import is_groq_configured, groq_chat

log = get_logger(__name__)


def extract_json_from_text(text: str):
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
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


async def _generate(
    system: str,
    user_content: str,
    temperature: float = 0,
    max_tokens: int = 500,
) -> str:
    """Generate using Groq (primary) or Ollama (fallback)."""
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user_content},
    ]

    # Try Groq first
    if is_groq_configured():
        try:
            return await groq_chat(messages, temperature=temperature, max_tokens=max_tokens)
        except Exception as e:
            log.warning("Groq failed, falling back to Ollama: %s", e)

    # Fallback to Ollama
    prompt = f"{system}\n\n{user_content}"
    for attempt in range(LLM_MAX_RETRIES):
        try:
            result = await _call_ollama(prompt, temperature)
            return result.get("response", "").strip()
        except httpx.TimeoutException:
            log.error("Ollama timed out (attempt %d/%d)", attempt + 1, LLM_MAX_RETRIES)
            if attempt < LLM_MAX_RETRIES - 1:
                await asyncio.sleep(1)
        except Exception as e:
            log.error("Ollama failed (attempt %d/%d): %s", attempt + 1, LLM_MAX_RETRIES, e)
            if attempt < LLM_MAX_RETRIES - 1:
                await asyncio.sleep(1)

    return ""


async def extract_intent(message: str, history: list = None) -> dict:
    """Extract structured booking data from user message."""
    history_context = ""
    if history and len(history) > 0:
        recent = history[-6:]
        lines = [f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content'][:150]}" for m in recent]
        history_context = f"\nConversation so far:\n" + "\n".join(lines) + "\n"

    system = (
        "You are a travel booking assistant. Extract structured booking information from the user's message. "
        "Return ONLY valid JSON, nothing else."
    )

    user_content = (
        f"{history_context}\n"
        f'User message: "{message}"\n\n'
        "Extract and return JSON:\n"
        '{"intent":"","mode":"","source":"","destination":"","date":"","time":""}\n\n'
        "Rules:\n"
        '- "mode": flight, train, or bus (empty if not mentioned)\n'
        '- "source": departure city\n'
        '- "destination": arrival city\n'
        '- "date": travel date as mentioned (e.g. "tomorrow", "March 30", "2026-04-01")\n'
        '- "time": preferred time if mentioned\n'
        "- Leave empty if not mentioned"
    )

    raw = await _generate(system, user_content, temperature=0, max_tokens=300)
    parsed = extract_json_from_text(raw)
    if parsed:
        return parsed
    log.warning("Could not parse intent JSON from: %s", raw[:200])
    return {"intent": "unknown"}


async def generate_chat_response(message: str, history: list = None, intent: str = "general_chat") -> str:
    """Generate a natural conversational response."""
    history_context = ""
    if history and len(history) > 0:
        recent = history[-8:]
        lines = [f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content'][:200]}" for m in recent]
        history_context = "\n".join(lines)

    if intent == "support":
        system = (
            "You are YatraAI's support assistant. Help with booking issues, cancellations, refunds, "
            "payment problems. Be empathetic and provide actionable steps. Keep responses to 2-4 sentences."
        )
    else:
        system = (
            "You are YatraAI, a friendly Indian travel assistant. You help book flights, trains, buses "
            "and answer travel questions. Be warm, concise (2-3 sentences), and knowledgeable about Indian travel."
        )

    user_content = f"Conversation:\n{history_context}\n\nUser: {message}\n\nAssistant:"

    result = await _generate(system, user_content, temperature=0.7)
    if result:
        return result

    if intent == "support":
        return "I'm sorry you're facing this issue. Could you describe the problem in more detail?"
    return "Hello! I'm YatraAI. I can help you book flights, trains, and buses. How can I help?"
