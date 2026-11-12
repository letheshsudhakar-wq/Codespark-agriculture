"""
AGRIWISE RAG Pipeline — Configuration
All paths and tunable constants in one place.
"""
import os
from pathlib import Path

# ── Root paths ─────────────────────────────────────────────────────────────
BACKEND_DIR = Path(__file__).resolve().parent.parent         # backend/
RAG_DIR = Path(__file__).resolve().parent                    # backend/rag/

# ── Knowledge-base document directories ─────────────────────────────────────
# Primary directory (team PDFs live here)
PRIMARY_DOCS_DIR = BACKEND_DIR / "data" / "documents"

# Extra directories added via env-var (comma-separated absolute paths)
_extra_dirs_env = os.getenv("EXTRA_DOCS_DIRS", "")
EXTRA_DOCS_DIRS: list[Path] = [
    Path(p.strip()) for p in _extra_dirs_env.split(",") if p.strip()
]

# All document directories (primary + extras)
ALL_DOCS_DIRS: list[Path] = [PRIMARY_DOCS_DIR] + EXTRA_DOCS_DIRS

# ── Supported file extensions for ingestion ─────────────────────────────────
SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".md"}

# ── ChromaDB ────────────────────────────────────────────────────────────────
CHROMA_DB_PATH = str(BACKEND_DIR / os.getenv("CHROMA_DB_PATH", "chroma_db").lstrip("./"))
CHROMA_COLLECTION = "agriwise_knowledge"

# ── Embedding model ─────────────────────────────────────────────────────────
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_BATCH_SIZE = 32

# ── Chunking ────────────────────────────────────────────────────────────────
CHUNK_SIZE = 650       # target characters per chunk
CHUNK_OVERLAP = 100    # overlap characters between consecutive chunks

# ── Retrieval ───────────────────────────────────────────────────────────────
DEFAULT_TOP_K = 5

# ── Manifest file (tracks doc hashes to avoid re-indexing) ──────────────────
MANIFEST_PATH = BACKEND_DIR / "chroma_db" / "manifest.json"

