import httpx
from app.config import OLLAMA_URL, OLLAMA_MODEL, get_logger

log = get_logger(__name__)


def _is_likely_english(text: str) -> bool:
    ascii_count = sum(1 for c in text if ord(c) < 128)
    return (ascii_count / max(len(text), 1)) > 0.9


async def translate_to_english(text: str) -> str:
    if _is_likely_english(text):
        return text

    log.info("Translating non-English input: %s", text[:100])

    prompt = f"""Translate the following text to English. Return ONLY the English translation, nothing else.

Text: {text}

English translation:"""

    try:
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
        result = response.json()
        translated = result.get("response", "").strip()
        if translated:
            log.info("Translated to: %s", translated[:100])
            return translated
        return text
    except Exception as e:
        log.error("Translation failed: %s", e)
        return text
