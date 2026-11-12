"""Document ingestion for the RAG pipeline.

Future implementation will handle PDF ingestion and text
chunking into ChromaDB for vector search.
"""

from pathlib import Path

DOCUMENTS_PATH = Path(__file__).resolve().parents[2] / "data" / "documents"


def list_documents():
    """Return a list of document paths available for ingestion."""
    if not DOCUMENTS_PATH.exists():
        return []
    return sorted([p for p in DOCUMENTS_PATH.iterdir() if p.is_file()])
