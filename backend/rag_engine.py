"""
rag_engine.py
Motor RAG: carga el catálogo CSV, genera embeddings con sentence-transformers,
construye índice FAISS con LlamaIndex y responde consultas via OpenRouter.
"""

import os
import logging
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv

from llama_index.core import (
    VectorStoreIndex,
    Document,
    Settings,
    StorageContext,
    load_index_from_storage,
)
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.openai_like import OpenAILike
from llama_index.core.vector_stores import SimpleVectorStore

load_dotenv(override=True)  # Carga variables de entorno desde .env
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ── Configuración global ──────────────────────────────────────────────────────

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "meta-llama/llama-3.1-8b-instruct:free")
CATALOG_PATH       = os.getenv("CATALOG_PATH", "data/catalogo_vehiculos.csv")
INDEX_PATH         = os.getenv("INDEX_PATH", "embeddings/faiss_index")

# Embedding multilingüe (funciona bien en español)
EMBED_MODEL_NAME = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"

# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_document_text(row: pd.Series) -> str:
    """Convierte una fila del CSV en texto enriquecido para el índice."""
    return f"""
VEHÍCULO: {row['marca']} {row['modelo']} {row['año']}
Tipo: {row['tipo']}
Precio (COP): ${int(row['precio_cop']):,}
Precio (USD): ${int(row['precio_usd']):,}

MOTOR Y RENDIMIENTO:
- Motor: {row['motor']}
- Potencia: {row['potencia_hp']} HP
- Torque: {row['torque_nm']} Nm
- Autonomía: {row['autonomia_km']} km (WLTP)
- Batería: {row['bateria_kwh']} kWh
- Carga rápida DC (10%→80%): {row['carga_rapida_min']} minutos
- Velocidad máxima: {row['velocidad_max_kmh']} km/h
- Aceleración 0-100 km/h: {row['aceleracion_0_100']} segundos
- Tracción: {row['traccion']}

EQUIPAMIENTO:
- Pasajeros: {row['pasajeros']}
- Maletero: {row['maletero_litros']} litros
- Colores disponibles: {row['color_disponibles']}
- Garantía vehículo: {row['garantia_años']} años
- Garantía batería: {row['garantia_bateria_años']} años
- Sistema conducción asistida: {row['tecnologia_conduccion']}
- Pantalla central: {row['pantalla_pulgadas']} pulgadas
- Cámara 360°: {row['camara_360']}
- Techo panorámico: {row['techo_panoramico']}
- Asientos eléctricos: {row['asientos_electricos']}

DESCRIPCIÓN:
{row['descripcion']}
""".strip()
def _load_llm() -> OpenAILike:
    """Instancia el LLM de OpenRouter compatible con la API de OpenAI."""
    if not OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY no está configurada en el archivo .env")

    logger.info(f"🤖 Usando modelo LLM: '{LLM_MODEL}'")
    logger.info(f"🔑 API Key (primeros 10 chars): '{OPENROUTER_API_KEY[:10]}'")

    return OpenAILike(
        model=LLM_MODEL,
        api_base="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY,
        is_chat_model=True,
        max_tokens=1024,
        temperature=0.3,
        default_headers={
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Catalogo RAG Vehiculos",
        },
    )

def _load_embed_model() -> HuggingFaceEmbedding:
    """Carga el modelo de embeddings multilingüe."""
    logger.info(f"Cargando modelo de embeddings: {EMBED_MODEL_NAME}")
    return HuggingFaceEmbedding(model_name=EMBED_MODEL_NAME)


# ── Clase principal ───────────────────────────────────────────────────────────

class RAGEngine:
    """
    Motor de recuperación y generación aumentada (RAG) para el catálogo de vehículos.
    
    Flujo:
        CSV → Documents → Chunks → Embeddings → FAISS Index
        Query → Embedding → Similitud → Top-K Chunks → LLM → Respuesta
    """

    def __init__(self):
        self.index: VectorStoreIndex | None = None
        self.query_engine = None
        self._initialized = False

    def initialize(self):
        """Inicializa embeddings, LLM y carga/crea el índice FAISS."""
        logger.info("═══ Inicializando RAG Engine ═══")

        # 1. Configurar modelos globales en LlamaIndex
        Settings.embed_model = _load_embed_model()
        Settings.llm = _load_llm()
        Settings.chunk_size = 512
        Settings.chunk_overlap = 64

        # 2. Intentar cargar índice existente o crear uno nuevo
        index_dir = Path(INDEX_PATH)
        if index_dir.exists() and any(index_dir.iterdir()):
            logger.info("Cargando índice FAISS existente...")
            storage_context = StorageContext.from_defaults(persist_dir=str(index_dir))
            self.index = load_index_from_storage(storage_context)
        else:
            logger.info("Creando nuevo índice FAISS desde el catálogo CSV...")
            self.index = self._build_index_from_csv()
            index_dir.mkdir(parents=True, exist_ok=True)
            self.index.storage_context.persist(persist_dir=str(index_dir))
            logger.info(f"Índice guardado en: {index_dir}")

        # 3. Crear query engine con prompt en español
        self.query_engine = self.index.as_query_engine(
            similarity_top_k=4,
            response_mode="compact",
        )

        self._initialized = True
        logger.info("═══ RAG Engine listo ═══")

    def _build_index_from_csv(self) -> VectorStoreIndex:
        """Lee el CSV y construye el índice de vectores."""
        catalog_path = Path(CATALOG_PATH)
        if not catalog_path.exists():
            raise FileNotFoundError(f"Catálogo no encontrado: {catalog_path.resolve()}")

        df = pd.read_csv(catalog_path)
        logger.info(f"Catálogo cargado: {len(df)} vehículos")

        # Crear un Document de LlamaIndex por cada vehículo
        documents = []
        for _, row in df.iterrows():
            text = _build_document_text(row)
            doc = Document(
                text=text,
                metadata={
                    "id": str(row["id"]),
                    "marca": row["marca"],
                    "modelo": row["modelo"],
                    "año": str(row["año"]),
                    "tipo": row["tipo"],
                    "precio_cop": int(row["precio_cop"]),
                    "precio_usd": int(row["precio_usd"]),
                },
            )
            documents.append(doc)

        logger.info(f"{len(documents)} documentos creados — generando embeddings...")

        # Splitter por oraciones para respetar contexto semántico
        splitter = SentenceSplitter(chunk_size=512, chunk_overlap=64)

        return VectorStoreIndex.from_documents(
            documents,
            transformations=[splitter],
            show_progress=True,
        )

    def query(self, user_question: str) -> dict:
        """
        Recibe una pregunta en lenguaje natural y retorna:
        {
            "answer": str,          # Respuesta generada por el LLM
            "sources": list[dict],  # Vehículos recuperados del índice
            "question": str         # Pregunta original
        }
        """
        if not self._initialized:
            raise RuntimeError("RAGEngine no inicializado. Llama a initialize() primero.")

        logger.info(f"Query: {user_question}")

        # Prompt enriquecido en español para el LLM
        full_prompt = f"""Eres un asesor experto en vehículos eléctricos de una concesionaria premium.
Responde ÚNICAMENTE basándote en la información del catálogo proporcionado.
Si la respuesta no está en el catálogo, dilo claramente: "Esta información no está en nuestro catálogo actual."
Responde siempre en español, de forma clara, amable y profesional.
Cuando menciones precios, usa el formato colombiano (ej: $139.900.000 COP).
Cuando compares vehículos, usa tablas o listas estructuradas.

PREGUNTA DEL CLIENTE: {user_question}"""

        response = self.query_engine.query(full_prompt)

        # Extraer fuentes recuperadas del índice
        sources = []
        if hasattr(response, "source_nodes"):
            for node in response.source_nodes:
                meta = node.node.metadata
                sources.append({
                    "marca": meta.get("marca", ""),
                    "modelo": meta.get("modelo", ""),
                    "año": meta.get("año", ""),
                    "tipo": meta.get("tipo", ""),
                    "precio_cop": meta.get("precio_cop", 0),
                    "relevancia": round(float(node.score or 0), 4),
                    "fragmento": node.node.text[:300] + "...",
                })

        return {
            "question": user_question,
            "answer": str(response),
            "sources": sources,
        }

    def query_no_rag(self, user_question: str) -> dict:
        """
        Consulta directa al LLM SIN recuperación del catálogo.
        Usado para demostrar la ventaja del grounding (comparativa).
        """
        if not self._initialized:
            raise RuntimeError("RAGEngine no inicializado.")

        llm = Settings.llm
        prompt = f"""Eres un asesor de vehículos eléctricos.
Responde la siguiente pregunta con tu conocimiento general.
Responde en español.

PREGUNTA: {user_question}"""

        response = llm.complete(prompt)
        return {
            "question": user_question,
            "answer": str(response),
            "sources": [],
            "warning": "⚠️ Esta respuesta fue generada SIN acceso al catálogo real. Puede contener información inventada.",
        }


# Instancia global (singleton)
rag_engine = RAGEngine()
