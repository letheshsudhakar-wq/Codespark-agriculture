"""
AGRIWISE Voice Pipeline — Translation (Gemini)
Translates between farmer languages and English using the existing
Gemini API key and model configuration. Never invents or translates
citations or source references.
"""
import logging
import re
import requests
from typing import Optional

from rag.generate import _load_api_key, DEFAULT_MODEL

log = logging.getLogger("agriwise.voice.translate")

# Farmer-facing language codes (with region) -> Gemini language codes.
SUPPORTED_LANGUAGES = {
    "en-IN": "en",
    "kn-IN": "kn",
    "ta-IN": "ta",
    "hi-IN": "hi",
}

LANGUAGE_NAMES = {
    "en": "English",
    "kn": "Kannada",
    "ta": "Tamil",
    "hi": "Hindi",
}

# Citation markers [N] must survive translation unchanged.
CITATION_RE = re.compile(r"\[\d+\]")


def _normalize_language_code(language_code: str) -> Optional[str]:
    """Return the Gemini language code for a farmer-facing code, else None."""
    if not language_code:
        return None
    code = language_code.strip()
    if code in SUPPORTED_LANGUAGES:
        return SUPPORTED_LANGUAGES[code]
    base = code.split("-")[0].lower()
    if base in LANGUAGE_NAMES:
        return base
    return None


def is_supported(language_code: str) -> bool:
    return _normalize_language_code(language_code) is not None


def supported_languages() -> dict:
    return dict(SUPPORTED_LANGUAGES)


def translate_text(text: str, source_lang: str, target_lang: str) -> dict:
    """Translate text using OpenRouter while preserving citations."""

    if not text or not text.strip():
        return {"text": "", "error": None}
    if source_lang == target_lang:
        return {"text": text, "error": None}

    api_key = _load_api_key()
    if not api_key:
        return {"text": None, "error": "OPENROUTER_API_KEY is not configured."}

    source_name = LANGUAGE_NAMES.get(source_lang, source_lang)
    target_name = LANGUAGE_NAMES.get(target_lang, target_lang)

    tokens = {}

    def repl(match):
        key = f"__CITE{len(tokens)}__"
        tokens[key] = match.group(0)
        return key

    protected = CITATION_RE.sub(repl, text)

    prompt = (
        f"Translate the following text from {source_name} to {target_name}. "
        "Output only the translation. Preserve all numbers, units, filenames "
        "and citation tokens exactly. Do not add or remove factual content.\n\n"
        f"{protected}"
    )

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "openrouter/free",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 1200,
            },
            timeout=90,
        )
        response.raise_for_status()
        translated = response.json()["choices"][0]["message"]["content"]

        for key, value in tokens.items():
            translated = translated.replace(key, value)

        if not translated.strip():
            raise RuntimeError("OpenRouter returned an empty translation.")

        return {"text": translated.strip(), "error": None}

    except Exception as exc:
        log.exception("OpenRouter translation failed")
        return {"text": None, "error": f"Translation failed: {exc}"}
