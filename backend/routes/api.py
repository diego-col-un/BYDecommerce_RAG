"""
routes/api.py
Rutas REST de la API Flask para el catálogo RAG de vehículos.
"""

import pandas as pd
from flask import Blueprint, jsonify, request
from rag_engine import rag_engine

api_bp = Blueprint("api", __name__, url_prefix="/api")

CATALOG_PATH = "data/catalogo_vehiculos.csv"


# ── Endpoint: estado del servidor ─────────────────────────────────────────────

@api_bp.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "rag_initialized": rag_engine._initialized,
        "model": "google/gemini-2.0-flash-lite-001",
        "embedding": "paraphrase-multilingual-mpnet-base-v2",
    })


# ── Endpoint: consulta CON RAG (grounding) ────────────────────────────────────

@api_bp.route("/query", methods=["POST"])
def query_with_rag():
    """
    Consulta principal: usa RAG para anclar la respuesta al catálogo real.
    Body JSON: { "question": "¿Cuál es el BYD más económico?" }
    """
    data = request.get_json(silent=True)
    if not data or not data.get("question"):
        return jsonify({"error": "Se requiere el campo 'question'"}), 400

    question = data["question"].strip()
    if len(question) < 3:
        return jsonify({"error": "La pregunta es demasiado corta"}), 400

    try:
        result = rag_engine.query(question)
        return jsonify({
            "mode": "RAG (con grounding)",
            **result
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Endpoint: consulta SIN RAG (para comparativa) ────────────────────────────

@api_bp.route("/query-no-rag", methods=["POST"])
def query_without_rag():
    """
    Consulta directa al LLM sin acceso al catálogo.
    Permite demostrar la diferencia con/sin grounding.
    Body JSON: { "question": "¿Cuál es el precio del BYD Atto 3?" }
    """
    data = request.get_json(silent=True)
    if not data or not data.get("question"):
        return jsonify({"error": "Se requiere el campo 'question'"}), 400

    question = data["question"].strip()

    try:
        result = rag_engine.query_no_rag(question)
        return jsonify({
            "mode": "Directo (sin grounding)",
            **result
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Endpoint: listar catálogo completo ────────────────────────────────────────

@api_bp.route("/catalog", methods=["GET"])
def get_catalog():
    """Retorna el catálogo completo de vehículos en formato JSON."""
    try:
        df = pd.read_csv(CATALOG_PATH)
        # Convertir a lista de dicts limpiando NaN
        vehicles = df.fillna("").to_dict(orient="records")
        return jsonify({
            "total": len(vehicles),
            "vehicles": vehicles
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Endpoint: filtros del catálogo ────────────────────────────────────────────

@api_bp.route("/catalog/filter", methods=["GET"])
def filter_catalog():
    """
    Filtra el catálogo por parámetros query string.
    Ej: /api/catalog/filter?marca=BYD&precio_max=200000000
    """
    try:
        df = pd.read_csv(CATALOG_PATH)

        marca      = request.args.get("marca", "").strip().lower()
        tipo       = request.args.get("tipo", "").strip().lower()
        precio_min = request.args.get("precio_min", type=int, default=0)
        precio_max = request.args.get("precio_max", type=int, default=10_000_000_000)

        if marca:
            df = df[df["marca"].str.lower() == marca]
        if tipo:
            df = df[df["tipo"].str.lower().str.contains(tipo)]

        df = df[(df["precio_cop"] >= precio_min) & (df["precio_cop"] <= precio_max)]

        vehicles = df.fillna("").to_dict(orient="records")
        return jsonify({
            "total": len(vehicles),
            "filters_applied": {
                "marca": marca or "todas",
                "tipo": tipo or "todos",
                "precio_min": precio_min,
                "precio_max": precio_max,
            },
            "vehicles": vehicles
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Endpoint: estadísticas del catálogo ──────────────────────────────────────

@api_bp.route("/catalog/stats", methods=["GET"])
def catalog_stats():
    """Estadísticas generales del catálogo para el dashboard."""
    try:
        df = pd.read_csv(CATALOG_PATH)
        stats = {
            "total_vehiculos": len(df),
            "marcas": sorted(df["marca"].unique().tolist()),
            "tipos": sorted(df["tipo"].unique().tolist()),
            "precio_minimo_cop": int(df["precio_cop"].min()),
            "precio_maximo_cop": int(df["precio_cop"].max()),
            "precio_promedio_cop": int(df["precio_cop"].mean()),
            "autonomia_promedio_km": round(df["autonomia_km"].mean(), 1),
            "autonomia_maxima_km": int(df["autonomia_km"].max()),
            "por_marca": df["marca"].value_counts().to_dict(),
            "por_tipo": df["tipo"].value_counts().to_dict(),
        }
        return jsonify(stats)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
