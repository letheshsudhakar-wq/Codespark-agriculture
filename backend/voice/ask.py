"""
AGRIWISE Voice Pipeline — Multilingual Voice Ask
Translates non-English questions to English, runs the existing RAG + Gemini
pipeline (in-process, no HTTP duplication of /api/rag/ask), and translates
the grounded answer back to the farmer's language.
"""
import logging

from rag.retrieve import retrieve
from rag.generate import generate_answer
from .translate import (
    is_supported,
    _normalize_language_code,
    translate_text,
    supported_languages,
)

log = logging.getLogger("agriwise.voice.ask")

DEFAULT_TOP_K = 5


def voice_ask(question: str, language_code: str, top_k: int = DEFAULT_TOP_K) -> dict:
    """
    Process a multilingual voice question.

    Returns a dict with:
      - answer: str — answer translated into the farmer's language
      - original_question: str — the question as received
      - english_query: str — the English query sent to RAG
      - language_code: str — the farmer's language code as received
      - sources: list — real source references (never translated/invented)
      - evidence_sufficient: bool
      - model: str | None
      - error: str | None
    """
    if not question or not question.strip():
        return {
            "answer": None,
            "original_question": question,
            "english_query": None,
            "language_code": language_code,
            "sources": [],
            "evidence_sufficient": False,
            "model": None,
            "error": "Empty question. Please ask something.",
        }

    norm_lang = _normalize_language_code(language_code)
    if norm_lang is None:
        return {
            "answer": None,
            "original_question": question,
            "english_query": None,
            "language_code": language_code,
            "sources": [],
            "evidence_sufficient": False,
            "model": None,
            "error": (
                f"Unsupported language '{language_code}'. "
                f"Supported: {', '.join(supported_languages())}."
            ),
        }

    is_english = norm_lang == "en"

    # ── Step 1: translate non-English question to English ────────────────
    english_query = question
    if not is_english:
        t = translate_text(question, norm_lang, "en")
        if t.get("error"):
            return {
                "answer": None,
                "original_question": question,
                "english_query": None,
                "language_code": language_code,
                "sources": [],
                "evidence_sufficient": False,
                "model": None,
                "error": f"Translation to English failed: {t['error']}",
            }
        english_query = t["text"] or question

    # ── Step 2: reuse existing RAG + Gemini (in-process) ─────────────────
    passages = retrieve(english_query, top_k=top_k)
    generation = generate_answer(english_query, passages)

    answer_en = generation.get("answer")
    model = generation.get("model")
    gen_error = generation.get("error")
    evidence_sufficient = bool(generation.get("evidence_sufficient", False))

    # ── Step 3: translate grounded answer back to farmer's language ──────
    translated_answer = answer_en
    translate_error = None
    if not is_english and answer_en:
        t = translate_text(answer_en, "en", norm_lang)
        if t.get("error"):
            translate_error = f"Translation back to {language_code} failed: {t['error']}"
            translated_answer = answer_en  # fall back to English
        else:
            translated_answer = t["text"] or answer_en

    error = gen_error
    if translate_error:
        error = translate_error if not gen_error else f"{gen_error}; {translate_error}"

    # Sources are real filenames/pages — never translated or invented.
    sources = passages

    return {
        "answer": translated_answer,
        "original_question": question,
        "english_query": english_query,
        "language_code": language_code,
        "sources": sources,
        "evidence_sufficient": evidence_sufficient,
        "model": model,
        "error": error,
    }
