from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = Path(__file__).resolve().parent

sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(BACKEND_DIR))

load_dotenv(BACKEND_DIR / ".env")

from pipeline.inference_gate import advise
from rag.retrieve import retrieve, _get_collection
from rag.generate import generate_answer
from voice.ask import voice_ask

def create_app():
    app = Flask(__name__)

    frontend_origin = os.getenv(
        "FRONTEND_ORIGIN", "http://localhost:5173"
    )

    CORS(
        app,
        resources={r"/api/*": {"origins": [frontend_origin]}},
        supports_credentials=False,
    )

    def get_json_body():
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return None
        return data

    @app.get("/api/health")
    def health():
        return jsonify({
            "status": "ok",
            "service": "AGRIWISE Backend"
        })

    @app.post("/api/advisory")
    def advisory():
        data = get_json_body()
        if data is None:
            return jsonify({"error": "Request body must be a JSON object."}), 400

        try:
            return jsonify(advise(data)), 200
        except (ValueError, TypeError) as exc:
            return jsonify({"error": str(exc)}), 400
        except Exception:
            app.logger.exception("Advisory processing failed")
            return jsonify({"error": "Unable to process advisory request."}), 500

    @app.get("/api/rag/status")
    def rag_status():
        try:
            collection = _get_collection()
            count = collection.count()
            return jsonify({
                "status": "ok",
                "documents": count,
                "available": count > 0
            }), 200
        except Exception:
            app.logger.exception("RAG status check failed")
            return jsonify({
                "status": "error",
                "available": False,
                "error": "Knowledge base status unavailable."
            }), 500

    @app.post("/api/rag/search")
    def rag_search():
        data = get_json_body()
        if data is None:
            return jsonify({"error": "Request body must be a JSON object."}), 400

        question = str(data.get("question", "")).strip()
        if not question:
            return jsonify({"error": "Question is required."}), 400

        try:
            top_k = max(1, min(int(data.get("top_k", 5)), 20))
            sources = retrieve(question, top_k=top_k)
            return jsonify({
                "question": question,
                "sources": sources,
                "results": sources
            }), 200
        except (ValueError, TypeError) as exc:
            return jsonify({"error": str(exc)}), 400
        except Exception:
            app.logger.exception("RAG search failed")
            return jsonify({"error": "Knowledge search failed."}), 500

    @app.post("/api/rag/ask")
    def rag_ask():
        data = get_json_body()
        if data is None:
            return jsonify({"error": "Request body must be a JSON object."}), 400

        question = str(data.get("question", "")).strip()
        if not question:
            return jsonify({"error": "Question is required."}), 400

        try:
            top_k = max(1, min(int(data.get("top_k", 5)), 20))
            sources = retrieve(question, top_k=top_k)
            generation = generate_answer(question, sources)

            return jsonify({
                "answer": generation.get("answer"),
                "sources": sources,
                "model": generation.get("model"),
                "evidence_sufficient": generation.get("evidence_sufficient", False),
                "error": generation.get("error")
            }), 200
        except (ValueError, TypeError) as exc:
            return jsonify({"error": str(exc)}), 400
        except Exception:
            app.logger.exception("RAG answer failed")
            return jsonify({"error": "Unable to generate an answer."}), 500

    @app.post("/api/voice/ask")
    def voice_ask_route():
        data = get_json_body()
        if data is None:
            return jsonify({"error": "Request body must be a JSON object."}), 400

        question = str(data.get("question", "")).strip()
        language_code = str(data.get("language_code", "en-IN")).strip()

        if not question:
            return jsonify({"error": "Question is required."}), 400

        try:
            top_k = max(1, min(int(data.get("top_k", 5)), 20))
            result = voice_ask(
                question,
                language_code,
                top_k=top_k
            )
            return jsonify(result), 200
        except (ValueError, TypeError) as exc:
            return jsonify({"error": str(exc)}), 400
        except Exception:
            app.logger.exception("Voice question failed")
            return jsonify({"error": "Voice service failed."}), 500

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "False").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
