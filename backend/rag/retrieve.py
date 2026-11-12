"""
AGRIWISE RAG Pipeline — Semantic Retrieval (TF-IDF backend)
Accepts a text query, transforms it with the persisted TF-IDF vectorizer,
searches ChromaDB, returns ranked passages.
"""
import logging
from typing import Optional

from .config import (
    CHROMA_DB_PATH,
    CHROMA_COLLECTION,
    DEFAULT_TOP_K,
)

log = logging.getLogger("agriwise.retrieve")


def _get_collection():
    """Return the ChromaDB collection (read-only)."""
    import chromadb
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    collection = client.get_or_create_collection(
        name=CHROMA_COLLECTION,
        metadata={"hnsw:space": "cosine"},
    )
    return collection


def _embed_query(query: str) -> list[float]:
    """Transform the query string using the persisted TF-IDF vectorizer."""
    from .ingest import embed_texts
    vectors = embed_texts([query])
    return vectors[0]


def retrieve(query: str, top_k: int = DEFAULT_TOP_K) -> list[dict]:
    """
    Semantic retrieval of the most relevant agricultural knowledge passages.

    Args:
        query:  Farmer's agricultural question (plain text, any language).
        top_k:  Number of top results to return (default 5).

    Returns:
        List of result dicts, each with:
          - text        : retrieved passage text
          - source      : original filename
          - page        : page number (int) or None
          - source_url  : URL if available, else None
          - distance    : cosine distance (lower = more similar)

    Raises:
        Nothing — returns [] with a warning on any failure.
    """
    if not query or not query.strip():
        log.warning("Empty query received — returning no results.")
        return []

    try:
        collection = _get_collection()
    except Exception as exc:
        log.error("Could not connect to ChromaDB: %s", exc)
        return []

    # Check if the knowledge base has any documents at all
    try:
        count = collection.count()
    except Exception:
        count = 0

    if count == 0:
        log.warning(
            "ChromaDB collection is empty. Run `python -m rag.ingest` to index documents."
        )
        return []

    # Embed the query
    try:
        query_embedding = _embed_query(query)
    except Exception as exc:
        log.error("Failed to embed query: %s", exc)
        return []

    # Query ChromaDB
    try:
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, count),
            include=["documents", "metadatas", "distances"],
        )
    except Exception as exc:
        log.error("ChromaDB query failed: %s", exc)
        return []

    # Parse results
    passages = []
    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    dists = results.get("distances", [[]])[0]

    for doc, meta, dist in zip(docs, metas, dists):
        page = meta.get("page", -1)
        passages.append({
            "text": doc,
            "source": meta.get("source", "unknown"),
            "page": page if page != -1 else None,
            "source_url": meta.get("source_url") or None,
            "distance": round(float(dist), 4),
        })

    return passages
