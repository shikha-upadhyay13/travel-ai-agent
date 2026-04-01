# Groq API service — primary LLM for YatraAI agent

import httpx
import json
from app.config import GROQ_API_KEY, GROQ_MODEL, get_logger

log = get_logger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


def is_groq_configured() -> bool:
    return bool(GROQ_API_KEY)


async def groq_chat(
    messages: list[dict],
    temperature: float = 0,
    max_tokens: int = 500,
    response_format: dict = None,
) -> str:
    """Send a chat completion request to Groq. Supports system/user/assistant messages."""
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not configured")

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    if response_format:
        payload["response_format"] = response_format

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(GROQ_API_URL, headers=headers, json=payload)
            response.raise_for_status()

        result = response.json()
        content = result["choices"][0]["message"]["content"]
        log.info("Groq response generated (%d chars)", len(content))
        return content.strip()

    except httpx.HTTPStatusError as e:
        log.error("Groq API error %d: %s", e.response.status_code, e.response.text[:200])
        raise
    except Exception as e:
        log.error("Groq API call failed: %s", e)
        raise


async def groq_generate(prompt: str, temperature: float = 0, max_tokens: int = 500) -> str:
    """Simple prompt-in, text-out. Backwards compatible."""
    return await groq_chat(
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        max_tokens=max_tokens,
    )


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


async def groq_chat_stream(
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 500,
):
    """Stream response tokens from Groq with full message history."""
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not configured")

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
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
