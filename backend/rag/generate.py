

"""
AGRIWISE RAG Pipeline — Answer Generation (Gemini)
Generates an answer grounded strictly in retrieved passages.
Never invents agricultural advice, citations, or API results.
"""

import logging
import os
import requests
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from .config import BACKEND_DIR

# Load environment variables from backend/.env
load_dotenv(BACKEND_DIR / ".env")

log = logging.getLogger("agriwise.generate")

# Default model; overridable via GEMINI_MODEL env var.
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

# Active fallback model.
FALLBACK_MODELS = [
    "gemini-3.8-flash",
]

# Phrases indicating that the generated answer lacks sufficient evidence.
INSUFFICIENT_SIGNALS = [
    "specific instructions on how",
    "not mentioned",
    "not detailed",
    "only state that",
    "cannot answer",
    "can't answer",
    "unable to answer",
    "cannot provide",
    "no information",
    "not enough information",
    "not enough evidence",
    "insufficient",
    "do not have enough",
    "does not contain",
    "not covered",
    "no relevant",
    "no mention",
    "not addressed",
    "no specific instructions",
    "no specific guidance",
    "no details",
    "does not explain",
    "do not explain",
    "not explained",
    "not specified",
    "not described",
    "cannot be determined",
]


def _answer_indicates_insufficient(answer: str) -> bool:
    low = (answer or "").lower()
    return any(signal in low for signal in INSUFFICIENT_SIGNALS)


def _load_api_key() -> Optional[str]:
    """Read the OpenRouter API key."""
    return os.getenv("OPENROUTER_API_KEY", "").strip() or None


def _build_prompt(question: str, passages: list[dict]) -> str:
    """Build a grounding prompt that cites only provided passages."""
    numbered = []

    for idx, p in enumerate(passages, start=1):
        page = p.get("page")
        page_str = str(page) if page is not None else "n/a"
        source = p.get("source") or "unknown"

        numbered.append(
            f"[{idx}] {p.get('text', '')}\n"
            f"     (Source: {source}, page {page_str})"
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
    """Generate a grounded answer using OpenRouter."""

    if not _load_api_key():
        return {
            "answer": None,
            "model": None,
            "evidence_sufficient": False,
            "error": "OPENROUTER_API_KEY is not configured in backend/.env.",
        }

    if not passages:
        return {
            "answer": (
                "The available knowledge base does not contain any relevant "
                "passages for this question, so I cannot provide a grounded "
                "agricultural answer."
            ),
            "model": None,
            "evidence_sufficient": False,
            "error": None,
        }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {_load_api_key()}",
                "Content-Type": "application/json",
            },
            json={
                "model": "openrouter/free",
                "messages": [{
                    "role": "user",
                    "content": _build_prompt(question, passages)
                }],
                "temperature": 0.2,
                "max_tokens": 1200,
            },
            timeout=90,
        )
        response.raise_for_status()
        data = response.json()
        answer = data["choices"][0]["message"]["content"]

        if not answer or not answer.strip():
            raise RuntimeError("OpenRouter returned an empty answer.")

        answer = answer.strip()
        return {
            "answer": answer,
            "model": data.get("model", "openrouter/free"),
            "evidence_sufficient": not _answer_indicates_insufficient(answer),
            "error": None,
        }

    except Exception as exc:
        log.exception("OpenRouter generation failed")
        return {
            "answer": None,
            "model": None,
            "evidence_sufficient": False,
            "error": f"OpenRouter generation failed: {exc}",
        }
