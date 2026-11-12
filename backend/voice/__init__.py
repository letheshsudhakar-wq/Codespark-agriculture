"""Voice module for AGRIWISE backend.

Multilingual speech-to-speech support for Kannada (kn-IN), Tamil (ta-IN),
Hindi (hi-IN), and English (en-IN). Translates non-English questions to
English, runs the existing RAG + Gemini pipeline, and translates the
grounded answer back to the farmer's language.
"""

from .ask import voice_ask, DEFAULT_TOP_K
from .translate import is_supported, supported_languages, translate_text

__all__ = [
    "voice_ask",
    "DEFAULT_TOP_K",
    "is_supported",
    "supported_languages",
    "translate_text",
]
