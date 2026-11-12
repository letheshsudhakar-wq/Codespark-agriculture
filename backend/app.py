from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Make the project root accessible so backend can import pipeline/
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from pipeline.inference_gate import advise

load_dotenv()


def create_app():
    app = Flask(__name__)

    frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    CORS(
        app,
        resources={r"/api/*": {"origins": [frontend_origin]}},
        supports_credentials=False,
    )

    @app.get("/api/health")
    def health():
        return jsonify({
            "status": "ok",
            "service": "AGRIWISE Backend",
        })

    @app.post("/api/advisory")
    def advisory():
        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return jsonify({
                "error": "Request body must be a JSON object."
            }), 400

        try:
            result = advise(data)
            return jsonify(result), 200
        except (ValueError, TypeError) as exc:
            return jsonify({"error": str(exc)}), 400
        except Exception:
            app.logger.exception("Advisory processing failed")
            return jsonify({
                "error": "Unable to process advisory request."
            }), 500

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
