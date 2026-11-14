"""Atomic active-index state management for AGRIWISE RAG."""
import json
import os
import tempfile
from pathlib import Path

from .config import CHROMA_DB_PATH, CHROMA_COLLECTION

INDEX_DIR = Path(CHROMA_DB_PATH) / "indexes"
ACTIVE_INDEX_PATH = Path(CHROMA_DB_PATH) / "active_index.json"


def get_active_index() -> dict:
    """Return active index metadata, falling back to the legacy index."""
    if ACTIVE_INDEX_PATH.exists():
        with ACTIVE_INDEX_PATH.open("r", encoding="utf-8") as file:
            state = json.load(file)

        collection = state.get("collection")
        vectorizer = state.get("vectorizer")
        if not collection or not vectorizer:
            raise ValueError("Active index state is incomplete.")
        return state

    return {
        "collection": CHROMA_COLLECTION,
        "vectorizer": str(Path(CHROMA_DB_PATH) / "tfidf_vectorizer.pkl"),
        "version": "legacy",
    }


def activate_index(collection: str, vectorizer_path: str, version: str) -> None:
    """Atomically switch retrieval to a verified collection/vectorizer pair."""
    ACTIVE_INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)

    state = {
        "collection": collection,
        "vectorizer": str(Path(vectorizer_path).resolve()),
        "version": version,
    }

    fd, temp_name = tempfile.mkstemp(
        prefix="active_index_",
        suffix=".tmp",
        dir=str(ACTIVE_INDEX_PATH.parent),
    )

    try:
        with os.fdopen(fd, "w", encoding="utf-8") as file:
            json.dump(state, file, indent=2)
            file.flush()
            os.fsync(file.fileno())

        os.replace(temp_name, ACTIVE_INDEX_PATH)
    except Exception:
        if os.path.exists(temp_name):
            os.unlink(temp_name)
        raise
