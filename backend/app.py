"""
app.py
Punto de entrada de la API Flask.
Inicializa el RAG Engine al arrancar y registra las rutas.
"""

import os
import logging
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


def create_app() -> Flask:
    app = Flask(__name__)

    CORS(app, resources={r"/api/*": {"origins": [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://diego-col-un-bydecommerce-rag.hf.space",
        "https://by-decommerce-rag.vercel.app",
        "https://by-decommerce-rfq1rr3hg-diego-aristizabals-projects.vercel.app",
    ]}})

    from routes.api import api_bp
    app.register_blueprint(api_bp)

    from rag_engine import rag_engine
    with app.app_context():
        logger.info("Inicializando RAG Engine (esto puede tomar 1-2 min la primera vez)...")
        try:
            rag_engine.initialize()
            logger.info("✅ RAG Engine inicializado correctamente")
        except Exception as e:
            logger.error(f"❌ Error inicializando RAG Engine: {e}")
            raise

    return app


if __name__ == "__main__":
    host  = os.getenv("FLASK_HOST", "0.0.0.0")
    port  = int(os.getenv("FLASK_PORT", 7860))
    debug = os.getenv("FLASK_DEBUG", "False").lower() == "true"

    app = create_app()

    logger.info(f"🚀 Servidor Flask corriendo en http://{host}:{port}")
    logger.info(f"📋 Endpoints disponibles:")
    logger.info(f"   GET  /api/health")
    logger.info(f"   POST /api/query          (con RAG)")
    logger.info(f"   POST /api/query-no-rag   (sin RAG - comparativa)")
    logger.info(f"   GET  /api/catalog")
    logger.info(f"   GET  /api/catalog/filter?marca=BYD&precio_max=200000000")
    logger.info(f"   GET  /api/catalog/stats")

    app.run(host=host, port=port, debug=debug)