"""
AGRIWISE RAG Pipeline — Document Ingestion
Handles: PDF (via PyMuPDF), TXT, Markdown
Embeddings: TF-IDF via scikit-learn (lightweight, no model downloads)
Stored persistently in ChromaDB; vectorizer pickled alongside.
"""
import hashlib
import json
import logging
import pickle
import sys
from pathlib import Path

import fitz  # PyMuPDF
from sklearn.feature_extraction.text import TfidfVectorizer

from .config import (
    ALL_DOCS_DIRS,
    SUPPORTED_EXTENSIONS,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    MANIFEST_PATH,
    CHROMA_DB_PATH,
    CHROMA_COLLECTION,
    EMBEDDING_BATCH_SIZE,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("agriwise.ingest")

# TF-IDF vectorizer persistence path (next to ChromaDB)
VECTORIZER_PATH = Path(CHROMA_DB_PATH) / "tfidf_vectorizer.pkl"


# ── Document Discovery ───────────────────────────────────────────────────────

def discover_documents() -> list[Path]:
    """Return every supported file across all configured knowledge directories."""
    found: list[Path] = []
    for doc_dir in ALL_DOCS_DIRS:
        if not doc_dir.exists():
            log.warning("Document directory does not exist: %s", doc_dir)
            continue
        for path in sorted(doc_dir.iterdir()):
            if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS:
                found.append(path)
    return found


def file_hash(path: Path) -> str:
    """SHA-256 hash of file contents — used for change detection."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


# ── Manifest (tracks indexed files by hash) ─────────────────────────────────

def load_manifest() -> dict:
    """Load the indexing manifest (filename → {hash, chunks, pages})."""
    if MANIFEST_PATH.exists():
        with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_manifest(manifest: dict) -> None:
    """Persist the indexing manifest."""
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)


# ── Vectorizer persistence ──────────────────────────────────────────────────

def save_vectorizer(vectorizer) -> None:
    """Persist the fitted TF-IDF vectorizer so queries can be transformed identically."""
    VECTORIZER_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(VECTORIZER_PATH, "wb") as f:
        pickle.dump(vectorizer, f)


def load_vectorizer():
    """Load the persisted TF-IDF vectorizer, or None if not yet fitted."""
    if not VECTORIZER_PATH.exists():
        return None
    with open(VECTORIZER_PATH, "rb") as f:
        return pickle.load(f)


def vectorizer_exists() -> bool:
    return VECTORIZER_PATH.exists()


# ── Text Extraction ──────────────────────────────────────────────────────────

def extract_pdf(path: Path) -> list[dict]:
    """
    Extract text from a PDF file using PyMuPDF.
    Returns a list of page dicts: {page, text}.
    Reports clearly when pages are scanned-only (no extractable text).
    """
    pages = []
    try:
        doc = fitz.open(str(path))
    except Exception as exc:
        log.error("Cannot open PDF %s: %s", path.name, exc)
        return []

    scanned_pages = 0
    for page_num, page in enumerate(doc, start=1):
        text = page.get_text("text") or ""
        text = text.strip()
        if not text:
            scanned_pages += 1
            continue
        pages.append({"page": page_num, "text": text})

    doc.close()

    if scanned_pages:
        log.warning(
            "%s: %d page(s) had no extractable text — likely scanned. OCR needed for those pages.",
            path.name, scanned_pages,
        )
    return pages


def extract_txt(path: Path) -> list[dict]:
    """Extract text from a plain-text or Markdown file."""
    try:
        text = path.read_text(encoding="utf-8", errors="replace").strip()
    except Exception as exc:
        log.error("Cannot read %s: %s", path.name, exc)
        return []
    if not text:
        return []
    return [{"page": None, "text": text}]


def extract_document(path: Path) -> list[dict]:
    """Dispatch extraction based on file extension."""
    ext = path.suffix.lower()
    if ext == ".pdf":
        return extract_pdf(path)
    elif ext in (".txt", ".md"):
        return extract_txt(path)
    else:
        log.warning("Unsupported file type skipped: %s", path.name)
        return []


# ── Text Chunking ────────────────────────────────────────────────────────────

def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """
    Split text into overlapping character-level chunks.
    Attempts to break on sentence boundaries ('. ') when practical.
    """
    if not text:
        return []

    chunks: list[str] = []
    start = 0
    length = len(text)

    while start < length:
        end = min(start + chunk_size, length)

        # Try to break on a sentence boundary within the last 150 chars of the window
        if end < length:
            boundary = text.rfind(". ", start + chunk_size - 150, end)
            if boundary != -1:
                end = boundary + 1  # include the period

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        # Move forward by chunk_size minus overlap
        start = max(start + 1, end - overlap)

    return chunks


def build_chunks(path: Path, pages: list[dict]) -> list[dict]:
    """
    Convert extracted page-level text into indexed chunk records.
    Each record carries full provenance metadata.
    """
    doc_id = path.stem  # filename without extension
    chunks: list[dict] = []

    for page_data in pages:
        page_num = page_data["page"]
        text = page_data["text"]

        for idx, chunk_text_str in enumerate(chunk_text(text)):
            chunk_id = f"{doc_id}__p{page_num or 0}__c{idx}"
            chunks.append({
                "id": chunk_id,
                "text": chunk_text_str,
                "source": path.name,
                "doc_id": doc_id,
                "page": page_num,
                "source_url": None,  # Will be populated from metadata when available
            })

    return chunks


# ── Chunk selection (balanced, ag-prioritized) ───────────────────────────────

FRONT_MATTER_PATTERNS = [
    "foreword", "table of contents", "acknowledgment", "acknowledgement",
    "designations employed", "presentation of material", "isbn", "preface",
    "executive summary", "abbreviations and acronyms",
]

AGRI_KEYWORDS = [
    "soil", "fertil", "crop", "nutrient", "nitrogen", "phosphorus", "potassium",
    "irrigation", "pest", "yield", "farming", "agriculture", "cultivation",
    "manure", "organic", "ph ", "foliar", "dap", "urea", "npk", "lime", "compost",
]


def _is_front_matter(text: str) -> bool:
    low = text.lower()
    return any(pat in low for pat in FRONT_MATTER_PATTERNS)


def _agri_score(text: str) -> int:
    low = text.lower()
    return sum(1 for kw in AGRI_KEYWORDS if kw in low)


def select_balanced_chunks(chunks: list[dict], target_total: int = 800) -> list[dict]:
    """Select a balanced subset of chunks across all source documents.

    Excludes empty/near-empty and front-matter/boilerplate chunks,
    prioritizes agricultural content, and distributes the budget roughly
    evenly across documents so no single document dominates the index.
    """
    good = []
    for c in chunks:
        t = c.get("text", "") or ""
        if len(t.strip()) < 40:
            continue
        if _is_front_matter(t):
            continue
        c2 = dict(c)
        c2["_agri_score"] = _agri_score(t)
        good.append(c2)

    by_source: dict[str, list[dict]] = {}
    for c in good:
        by_source.setdefault(c["source"], []).append(c)

    if not by_source:
        return []

    sources = list(by_source.keys())
    per_doc = max(1, target_total // len(sources))

    selected: list[dict] = []
    for src in sources:
        group = by_source[src]
        group.sort(key=lambda c: c["_agri_score"], reverse=True)
        take = group[:per_doc]
        for c in take:
            c.pop("_agri_score", None)
        selected.extend(take)

    return selected[:target_total]


# ── Embedding (TF-IDF) ───────────────────────────────────────────────────────

_vectorizer_cache = None


def get_vectorizer(texts: list[str] | None = None, fit: bool = False):
    """
    Return the TF-IDF vectorizer. If fit=True and texts provided, fit on texts
    (and persist) before returning.
    """
    global _vectorizer_cache
    if _vectorizer_cache is not None and not fit:
        return _vectorizer_cache

    if fit:
        if texts is None:
            raise ValueError("texts are required when fit=True")
        vectorizer = TfidfVectorizer()
        vectorizer.fit(texts)
        _vectorizer_cache = vectorizer
        save_vectorizer(vectorizer)
        log.info("TF-IDF vectorizer fitted on %d texts and persisted.", len(texts))
        return vectorizer

    # Load from disk
    vectorizer = load_vectorizer()
    if vectorizer is not None:
        _vectorizer_cache = vectorizer
    return vectorizer


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Transform texts into dense TF-IDF vectors using the persisted vectorizer."""
    vectorizer = get_vectorizer()
    if vectorizer is None:
        raise RuntimeError(
            "TF-IDF vectorizer not fitted. Run indexing first: python -m rag.ingest"
        )
    matrix = vectorizer.transform(texts)
    return matrix.toarray().tolist()


# ── ChromaDB ─────────────────────────────────────────────────────────────────

def get_chroma_collection():
    """Return (or create) the persistent ChromaDB collection."""
    import chromadb
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    collection = client.get_or_create_collection(
        name=CHROMA_COLLECTION,
        metadata={"hnsw:space": "cosine"},
    )
    return client, collection


def clear_collection(collection) -> None:
    """Remove all existing vectors from the collection (full re-index safety)."""
    try:
        existing = collection.get()
        ids = existing.get("ids", []) if existing else []
        if ids:
            collection.delete(ids=ids)
            log.info("Cleared %d existing vectors from ChromaDB.", len(ids))
    except Exception as exc:
        log.warning("Could not clear ChromaDB collection: %s", exc)


def upsert_chunks(collection, chunks: list[dict], embeddings: list[list[float]]) -> None:
    """Upsert chunks and embeddings into ChromaDB (idempotent)."""
    ids = [c["id"] for c in chunks]
    documents = [c["text"] for c in chunks]
    metadatas = [
        {
            "source": c["source"],
            "doc_id": c["doc_id"],
            "page": c["page"] if c["page"] is not None else -1,
            "source_url": c["source_url"] or "",
        }
        for c in chunks
    ]
    batch_size = 500
    for i in range(0, len(ids), batch_size):
        collection.upsert(
            ids=ids[i:i + batch_size],
            documents=documents[i:i + batch_size],
            embeddings=embeddings[i:i + batch_size],
            metadatas=metadatas[i:i + batch_size],
        )


def delete_doc_chunks(collection, doc_id: str) -> None:
    """Remove all chunks from ChromaDB that belong to a given doc_id."""
    try:
        result = collection.get(where={"doc_id": {"$eq": doc_id}})
        if result and result["ids"]:
            collection.delete(ids=result["ids"])
            log.info("  Removed %d stale chunks for doc_id='%s'", len(result["ids"]), doc_id)
    except Exception as exc:
        log.warning("Could not delete stale chunks for %s: %s", doc_id, exc)


# ── Dataset Classification / Inventory ───────────────────────────────────────

def classify_document(path: Path) -> dict:
    """
    Classify a file for the dataset inventory report.
    Returns a dict suitable for printing/JSON output.
    """
    ext = path.suffix.lower()
    size_kb = round(path.stat().st_size / 1024, 1)

    name_lower = path.stem.lower()

    agri_keywords = [
        "soil", "fertilizer", "crop", "agriculture", "farming", "nutrient",
        "tnau", "fao", "icar", "manure", "irrigation", "pest", "yield",
        "organic", "nitrogen", "phosphorus", "potassium", "ph", "fertility",
        "cultivation", "paddy", "wheat", "cotton", "sugarcane", "vegetable",
    ]
    ml_keywords = ["dataset", "train", "label", "npk_data", "measurements", "observations"]

    agri_score = sum(1 for kw in agri_keywords if kw in name_lower)
    ml_score = sum(1 for kw in ml_keywords if kw in name_lower)

    if ext in (".pdf", ".txt", ".md") and agri_score >= 1:
        category = "A — RAG Knowledge Document"
        rag_suitable = True
        reason = "Agricultural knowledge document in supported format."
    elif ext in (".csv", ".json", ".xlsx", ".xls") and ml_score >= 1:
        category = "B — Structured ML Dataset"
        rag_suitable = False
        reason = "Numerical/structured training data — not suitable as RAG text chunks."
    elif ext in (".csv", ".json", ".xlsx", ".xls") and agri_score >= 1:
        category = "B — Structured ML Dataset"
        rag_suitable = False
        reason = "Tabular agricultural data. Inspect manually — may contain textual notes usable for RAG."
    else:
        category = "C — Unsupported or Unverified"
        rag_suitable = ext in SUPPORTED_EXTENSIONS
        reason = "Unclear agricultural relevance or unsupported format."

    return {
        "filename": path.name,
        "type": ext,
        "location": str(path.parent),
        "size_kb": size_kb,
        "category": category,
        "rag_suitable": rag_suitable,
        "source_info": "Source: filename convention — verify provenance before production use",
        "reason": reason,
    }


# ── Main Ingestion Pipeline ──────────────────────────────────────────────────

def run_ingestion(force: bool = False) -> dict:
    """Build a verified versioned index and atomically activate it."""
    import os
    import uuid
    import tempfile
    import chromadb
    from .index_state import get_active_index, activate_index

    documents = discover_documents()
    manifest = load_manifest()

    summary = {
        "total_found": len(documents),
        "indexed_new": [],
        "indexed_updated": [],
        "skipped_unchanged": [],
        "skipped_unreadable": [],
        "removed_stale": [],
        "total_chunks_added": 0,
    }

    if not documents:
        log.warning("No documents found. Existing index remains untouched.")
        return summary

    hashes = {p.name: file_hash(p) for p in documents}
    current_names = set(hashes)
    old_names = set(manifest)
    summary["removed_stale"] = sorted(old_names - current_names)

    changed = [
        p for p in documents
        if force or (
            (manifest.get(p.name, {}).get("hash")
             if isinstance(manifest.get(p.name), dict)
             else manifest.get(p.name)) != hashes[p.name]
        )
    ]

    summary["skipped_unchanged"] = [
        p.name for p in documents if p not in changed
    ]

    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)

    if not changed and not summary["removed_stale"]:
        try:
            active = get_active_index()
            collection = client.get_collection(name=active["collection"])
            if Path(active["vectorizer"]).is_file() and collection.count() > 0:
                log.info("All documents unchanged. Existing index preserved.")
                return summary
        except Exception as exc:
            log.warning("Existing index is unavailable; rebuilding: %s", exc)

    # Always rebuild the complete corpus: TF-IDF must use one vocabulary.
    all_chunks = []
    pages_by_source = {}

    for doc_path in documents:
        pages = extract_document(doc_path)
        if not pages:
            summary["skipped_unreadable"].append(doc_path.name)
            continue

        chunks = build_chunks(doc_path, pages)
        if not chunks:
            summary["skipped_unreadable"].append(doc_path.name)
            continue

        pages_by_source[doc_path.name] = len(pages)
        all_chunks.extend(chunks)

    # Never activate a partial index if any source failed extraction.
    if summary["skipped_unreadable"]:
        log.error("Index build aborted: unreadable documents detected. Old index preserved.")
        return summary

    if not all_chunks:
        log.error("No chunks extracted. Old index preserved.")
        return summary

    selected_chunks = select_balanced_chunks(all_chunks, target_total=800)
    if not selected_chunks:
        log.error("No usable chunks selected. Old index preserved.")
        return summary

    texts = [chunk["text"] for chunk in selected_chunks]
    vectorizer = TfidfVectorizer()
    vectorizer.fit(texts)
    embeddings = vectorizer.transform(texts).toarray().tolist()

    # Stage everything under a unique version; never modify the active index.
    version = uuid.uuid4().hex
    collection_name = f"{CHROMA_COLLECTION}_{version}"
    index_dir = Path(CHROMA_DB_PATH) / "indexes"
    index_dir.mkdir(parents=True, exist_ok=True)
    vectorizer_path = index_dir / f"{version}_tfidf.pkl"

    collection = client.create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )

    upsert_chunks(collection, selected_chunks, embeddings)

    if collection.count() != len(selected_chunks):
        raise RuntimeError("Staged collection count verification failed.")

    # Persist the matching vectorizer atomically.
    fd, temp_name = tempfile.mkstemp(
        prefix="vectorizer_", suffix=".tmp", dir=str(index_dir)
    )
    try:
        with os.fdopen(fd, "wb") as file:
            pickle.dump(vectorizer, file)
            file.flush()
            os.fsync(file.fileno())
        os.replace(temp_name, vectorizer_path)
    except Exception:
        if os.path.exists(temp_name):
            os.unlink(temp_name)
        raise

    # Verify the persisted vectorizer before switching the active pointer.
    with vectorizer_path.open("rb") as file:
        verified_vectorizer = pickle.load(file)

    if verified_vectorizer.transform([texts[0]]).shape[1] != len(embeddings[0]):
        raise RuntimeError("Vectorizer dimension verification failed.")

    # This is the only operation that changes what retrieval uses.
    activate_index(
        collection=collection_name,
        vectorizer_path=str(vectorizer_path),
        version=version,
    )

    indexed_per_source = {}
    for chunk in selected_chunks:
        name = chunk["source"]
        indexed_per_source[name] = indexed_per_source.get(name, 0) + 1

    new_manifest = {}
    for doc_path in documents:
        new_manifest[doc_path.name] = {
            "hash": hashes[doc_path.name],
            "chunks": indexed_per_source.get(doc_path.name, 0),
            "pages": pages_by_source[doc_path.name],
        }

        if doc_path in changed:
            entry = {
                "file": doc_path.name,
                "chunks": indexed_per_source.get(doc_path.name, 0),
            }
            if doc_path.name in manifest:
                summary["indexed_updated"].append(entry)
            else:
                summary["indexed_new"].append(entry)

    # Manifest update happens after activation; failure here cannot damage retrieval.
    save_manifest(new_manifest)

    summary["total_chunks_added"] = len(selected_chunks)
    log.info(
        "Activated index %s with %d verified chunks.",
        version, len(selected_chunks),
    )
    return summary

if __name__ == "__main__":
    force_flag = "--force" in sys.argv

    log.info("=" * 60)
    log.info("AGRIWISE RAG Ingestion Pipeline (TF-IDF backend)")
    log.info("=" * 60)

    # Print dataset inventory first
    log.info("\n--- Dataset Inventory ---")
    all_files = discover_documents()
    if not all_files:
        log.warning("No documents found in configured directories.")
        sys.exit(0)

    for doc_path in all_files:
        info = classify_document(doc_path)
        log.info(
            "[%s] %s (%.1f KB) | RAG: %s | %s",
            info["category"][0],  # 'A', 'B', or 'C'
            info["filename"],
            info["size_kb"],
            "YES" if info["rag_suitable"] else "NO",
            info["reason"],
        )

    log.info("\n--- Starting Ingestion ---")
    result = run_ingestion(force=force_flag)

    log.info("\n--- Ingestion Summary ---")
    log.info("Documents found:          %d", result["total_found"])
    log.info("Newly indexed:            %d", len(result["indexed_new"]))
    log.info("Updated (re-indexed):     %d", len(result["indexed_updated"]))
    log.info("Skipped (unchanged):      %d", len(result["skipped_unchanged"]))
    log.info("Skipped (unreadable):     %d", len(result["skipped_unreadable"]))
    log.info("Stale docs removed:       %d", len(result["removed_stale"]))
    log.info("Total chunks indexed:     %d", result["total_chunks_added"])
    log.info("=" * 60)
