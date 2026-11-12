"""
AGRIWISE Voice Pipeline — Translation (Gemini)
Translates between farmer languages and English using the existing
Gemini API key and model configuration. Never invents or translates
citations or source references.
"""
import logging
import re
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


def _gemini_client():
    """Return (genai.Client, api_key) or (None, None) if not configured."""
    from google import genai
    api_key = _load_api_key()
    if api_key is None:
        return None, None
    return genai.Client(api_key=api_key), api_key


def translate_text(text: str, source_lang: str, target_lang: str) -> dict:
    """
    Translate text from source_lang to target_lang using Gemini.

    Returns {"text": <translated>, "error": None} on success,
    or {"text": None, "error": <msg>} on failure.
    """
    if not text or not text.strip():
        return {"text": "", "error": None}
    if source_lang == target_lang:
        return {"text": text, "error": None}

    client, _ = _gemini_client()
    if client is None:
        return {"text": None, "error": "GEMINI_API_KEY is not configured."}

    source_name = LANGUAGE_NAMES.get(source_lang, source_lang)
    target_name = LANGUAGE_NAMES.get(target_lang, target_lang)

    # Protect citation markers so they survive translation unchanged.
    tokens: dict[str, str] = {}

    def repl(m):
        key = f"__CITE{len(tokens)}__"
        tokens[key] = m.group(0)
        return key

    protected = CITATION_RE.sub(repl, text)

    prompt = (
        f"You are a professional translator. Translate the following text "
        f"from {source_name} to {target_name}.\n\n"
        "Rules:\n"
        "- Output ONLY the translated text, no introductions or explanations.\n"
        "- Do not translate citation markers like __CITE0__ or any filenames.\n"
        "- Do not add, remove, or invent factual content, citations, or sources.\n"
        "- Preserve numbers, units, and bracketed citation tokens exactly.\n\n"
        f"Text:\n{protected}\n\nTranslation:"
    )

    last_error = None
    # Only the configured model is confirmed available for this API key;
    # the fallbacks (gemini-1.5-flash, gemini-2.0-flash) return 404.
    try:
        response = client.models.generate_content(model=DEFAULT_MODEL, contents=prompt)
        translated = getattr(response, "text", None) or ""
        for key, val in tokens.items():
            translated = translated.replace(key, val)
        if not translated.strip():
            translated = text
        return {"text": translated.strip(), "error": None}
    except Exception as exc:
        last_error = exc
        log.warning("Translation model %s failed: %s", DEFAULT_MODEL, exc)

    return {"text": None, "error": f"Translation failed: {last_error}"}
