import asyncio
import httpx
from app.config import OLLAMA_URL, OLLAMA_MODEL, LLM_TIMEOUT, LLM_MAX_RETRIES, get_logger

log = get_logger(__name__)

SUPPORTED_LANGUAGES = {
    "hi": "Hindi",
    "te": "Telugu",
    "mr": "Marathi",
    "ta": "Tamil",
    "bn": "Bengali",
    "kn": "Kannada",
    "gu": "Gujarati",
}


def _is_likely_english(text: str) -> bool:
    ascii_count = sum(1 for c in text if ord(c) < 128)
    return (ascii_count / max(len(text), 1)) > 0.9


def detect_language(text: str) -> str:
    """Returns 'en' for English, or a best-guess language code for non-English."""
    if _is_likely_english(text):
        return "en"
    # Simple heuristic based on Unicode ranges
    for char in text:
        cp = ord(char)
        if 0x0900 <= cp <= 0x097F:
            return "hi"  # Devanagari (Hindi/Marathi)
        if 0x0C00 <= cp <= 0x0C7F:
            return "te"  # Telugu
        if 0x0B80 <= cp <= 0x0BFF:
            return "ta"  # Tamil
        if 0x0980 <= cp <= 0x09FF:
            return "bn"  # Bengali
        if 0x0C80 <= cp <= 0x0CFF:
            return "kn"  # Kannada
        if 0x0A80 <= cp <= 0x0AFF:
            return "gu"  # Gujarati
    return "unknown"


async def translate_to_english(text: str) -> str:
    if _is_likely_english(text):
        return text

    detected = detect_language(text)
    lang_name = SUPPORTED_LANGUAGES.get(detected, "the source language")
    log.info("Detected %s input, translating: %s", lang_name, text[:100])

    prompt = f"""Translate the following {lang_name} text to English. Return ONLY the English translation, nothing else.

Text: {text}

English translation:"""

    for attempt in range(LLM_MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=float(LLM_TIMEOUT)) as client:
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
        except httpx.TimeoutException:
            log.error("Translation timed out (attempt %d/%d)", attempt + 1, LLM_MAX_RETRIES)
            if attempt < LLM_MAX_RETRIES - 1:
                await asyncio.sleep(1)
        except Exception as e:
            log.error("Translation failed (attempt %d/%d): %s", attempt + 1, LLM_MAX_RETRIES, e)
            if attempt < LLM_MAX_RETRIES - 1:
                await asyncio.sleep(1)

    return text


async def translate_from_english(text: str, target_lang: str) -> str:
    """Translate English text to the target language for responding in user's language."""
    if target_lang == "en":
        return text

    lang_name = SUPPORTED_LANGUAGES.get(target_lang, "")
    if not lang_name:
        return text

    prompt = f"""Translate the following English text to {lang_name}. Return ONLY the {lang_name} translation, nothing else.

Text: {text}

{lang_name} translation:"""

    try:
        async with httpx.AsyncClient(timeout=float(LLM_TIMEOUT)) as client:
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
        return translated if translated else text
    except Exception as e:
        log.error("Reverse translation failed: %s", e)
        return text
