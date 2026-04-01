# app/services/groq_service.py — Groq API fallback when Ollama is unavailable

import httpx
import json
from app.config import GROQ_API_KEY, GROQ_MODEL, get_logger

log = get_logger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


def is_groq_configured() -> bool:
    """Check if Groq API key is set."""
    return bool(GROQ_API_KEY)


async def groq_generate(prompt: str, temperature: float = 0, max_tokens: int = 500) -> str:
    """Generate a response using Groq API as fallback."""
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not configured")

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(GROQ_API_URL, headers=headers, json=payload)
            response.raise_for_status()

        result = response.json()
        content = result["choices"][0]["message"]["content"]
        log.info("Groq fallback response generated (%d chars)", len(content))
        return content.strip()

    except httpx.HTTPStatusError as e:
        log.error("Groq API error %d: %s", e.response.status_code, e.response.text[:200])
        raise
    except Exception as e:
        log.error("Groq API call failed: %s", e)
        raise


async def groq_generate_stream(prompt: str, temperature: float = 0.7, max_tokens: int = 500):
    """Stream response tokens from Groq API."""
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not configured")

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": True,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        async with client.stream("POST", GROQ_API_URL, headers=headers, json=payload) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str.strip() == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        delta = data["choices"][0].get("delta", {})
                        token = delta.get("content", "")
                        if token:
                            yield token
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue
