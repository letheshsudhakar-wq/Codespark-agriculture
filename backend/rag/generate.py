"""
AGRIWISE RAG Pipeline — Answer Generation (Gemini)
Generates an answer grounded strictly in retrieved passages.
Never invents agricultural advice, citations, or API results.
"""
import logging
import os
from typing import Optional

from .config import BACKEND_DIR

log = logging.getLogger("agriwise.generate")

# Default model; overridable via GEMINI_MODEL env var.
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

# Ordered fallbacks tried when the configured model is unavailable to the key.
FALLBACK_MODELS = ["gemini-3.5-flash-lite", "gemini-1.5-flash", "gemini-2.0-flash"]

# Phrases that indicate the model could not ground an answer in the passages.
INSUFFICIENT_SIGNALS = [
    "cannot answer", "can't answer", "unable to answer",
    "no information", "not enough information", "insufficient",
    "do not have enough", "does not contain", "not covered",
    "no relevant", "no mention", "not addressed",
]


def _answer_indicates_insufficient(answer: str) -> bool:
    low = (answer or "").lower()
    return any(sig in low for sig in INSUFFICIENT_SIGNALS)


def _load_api_key() -> Optional[str]:
    """Read GEMINI_API_KEY from the environment (loaded from backend/.env)."""
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key or key == "your_gemini_api_key_here":
        return None
    return key


def _build_prompt(question: str, passages: list[dict]) -> str:
    """Build a grounding prompt that cites only the provided passages."""
    numbered = []
    for idx, p in enumerate(passages, start=1):
        page = p.get("page")
        page_str = str(page) if page is not None else "n/a"
        source = p.get("source") or "unknown"
        numbered.append(
            f"[{idx}] {p.get('text', '')}\n     (Source: {source}, page {page_str})"
        )
    passages_block = "\n\n".join(numbered)

    return (
        "You are AGRIWISE, an agricultural assistant. Answer the farmer's question "
        "using ONLY the provided knowledge-base passages. Do not invent advice, "
        "citations, or facts.\n\n"
        f"Question: {question}\n\n"
        "Relevant passages:\n"
        f"{passages_block}\n\n"
        "Instructions:\n"
        "- Base your answer entirely on the passages above.\n"
        "- Cite sources using bracketed numbers [1], [2], etc. matching the passages.\n"
        "- If the passages do not contain enough information to answer the question, "
        "state that clearly and do not provide agricultural advice.\n"
        "- Keep the answer concise and practical.\n\n"
        "Answer:"
    )


def generate_answer(question: str, passages: list[dict]) -> dict:
    """
    Generate a grounded answer using Gemini.

    Returns a dict with:
      - answer: str — the generated answer (or an explanatory message).
      - model: str | None — the model used, or None if generation was skipped.
      - evidence_sufficient: bool — whether passages were available to ground the answer.
      - error: str | None — a human-readable error if generation could not run.
    """
    api_key = _load_api_key()
    if api_key is None:
        return {
            "answer": None,
            "model": None,
            "evidence_sufficient": bool(passages),
            "error": (
                "GEMINI_API_KEY is not configured in backend/.env. "
                "Set a real Google Generative AI API key to enable answer generation."
            ),
        }

    if not passages:
        return {
            "answer": (
                "The available knowledge base does not contain any relevant passages "
                "for this question, so I cannot provide a grounded agricultural answer."
            ),
            "model": None,
            "evidence_sufficient": False,
            "error": None,
        }

    try:
        from google import genai
    except ImportError as exc:
        log.error("google-genai SDK not installed: %s", exc)
        return {
            "answer": None,
            "model": None,
            "evidence_sufficient": True,
            "error": "google-genai SDK is not installed.",
        }

    prompt = _build_prompt(question, passages)

    # Try the configured model, then fallbacks, so the endpoint works with whatever
    # model the configured API key has access to.
    last_error = None
    models_to_try = [DEFAULT_MODEL] + [m for m in FALLBACK_MODELS if m != DEFAULT_MODEL]
    for model in models_to_try:
        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(model=model, contents=prompt)
            answer = getattr(response, "text", None) or ""
            if not answer.strip():
                answer = "The model returned an empty answer."
            return {
                "answer": answer.strip(),
                "model": model,
                "evidence_sufficient": not _answer_indicates_insufficient(answer),
                "error": None,
            }
        except Exception as exc:
            last_error = exc
            log.warning("Gemini model %s failed: %s", model, exc)
            continue

    return {
        "answer": None,
        "model": None,
        "evidence_sufficient": True,
        "error": f"Gemini generation failed for all attempted models: {last_error}",
    }
