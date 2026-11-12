from flask import Flask, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

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
        return jsonify(
            {
                "status": "ok",
                "service": "AGRIWISE Backend",
            }
        )

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
