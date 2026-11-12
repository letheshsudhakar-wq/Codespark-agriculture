# AGRIWISE Backend — Step 1: RAG Backend Setup

A clean, working Python Flask backend for the AGRIWISE multilingual
agricultural advisory RAG system.

## Project structure

```
backend/
├── app.py                  # Flask application factory and health endpoint
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable placeholders
├── .gitignore              # Git ignore rules
├── README.md               # This file
├── rag/                    # RAG module (prepared for future steps)
│   ├── __init__.py
│   ├── ingest.py           # Document ingestion (stub)
│   └── retrieve.py         # Document retrieval (stub)
├── voice/                  # Voice module (prepared for future steps)
│   └── __init__.py
├── data/
│   └── documents/          # Source documents for RAG
└── tests/                  # Test suite
```

## Dependencies

- Flask
- flask-cors
- python-dotenv
- PyMuPDF
- sentence-transformers
- chromadb

## Getting started

1. Create a virtual environment (Python 3.11 or 3.12 recommended):

   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. Install dependencies:

   ```powershell
   pip install -r requirements.txt
   ```

3. Configure environment (copy the example):

   ```powershell
   copy .env.example .env
   ```

   Edit `.env` as needed. `GEMINI_API_KEY` is not required for Step 1.

4. Start the backend:

   ```powershell
   python app.py
   ```

   The server runs on port 5000 by default.

5. Test the health endpoint:

   ```powershell
   curl http://localhost:5000/api/health
   ```

   Expected response:

   ```json
   {
     "status": "ok",
     "service": "AGRIWISE Backend"
   }
   ```

## CORS

The Flask app allows requests from `FRONTEND_ORIGIN` (default
`http://localhost:5173`, the Vite dev server). Unrestricted CORS
is not enabled.

## Frontend preservation

No frontend files were modified. All work lives inside `backend/`.
