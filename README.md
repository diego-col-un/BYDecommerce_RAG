---
title: BYDecommerce RAG
emoji: 🚗
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
---
# 🚗⚡ AutoElectric AI — Sistema RAG de Vehículos Eléctricos

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)](https://www.python.org/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Flask 3](https://img.shields.io/badge/Flask-3-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![LlamaIndex](https://img.shields.io/badge/LlamaIndex-0.11-orange)](https://www.llamaindex.ai/)

**AutoElectric AI** es un sistema de generación aumentada por recuperación (**RAG**) diseñado para actuar como un catálogo inteligente de vehículos eléctricos. Combina la potencia de los LLM modernos con una base de datos local para ofrecer respuestas precisas, evitando alucinaciones y anclando la información a los datos reales del catálogo de 20 vehículos.

---

## 🏗️ Arquitectura del Sistema

```
Consulta del usuario
        │
        ▼
┌───────────────────┐
│  Embedding Query  │  ← paraphrase-multilingual-mpnet-base-v2 (local)
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│   FAISS Index     │  ← Búsqueda semántica Top-K
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Contexto RAG     │  ← Fragmentos relevantes del catálogo CSV
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  LLM OpenRouter   │  ← google/gemini-2.0-flash-lite-001
└────────┬──────────┘
         │
         ▼
  Respuesta anclada al catálogo real
```

- **Backend:** API REST con **Flask** + motor RAG usando **LlamaIndex** y **FAISS**.
- **Frontend:** Interfaz en **React** con modo comparativo RAG vs LLM puro.
- **Embeddings:** Generados localmente con `paraphrase-multilingual-mpnet-base-v2` (multilingüe).

---

## 📂 Estructura del Proyecto

```
BYDecommerce_RAG/
├── backend/
│   ├── data/                  # Catálogo CSV (base de conocimiento)
│   ├── embeddings/            # Índice FAISS persistido
│   ├── routes/api.py          # Endpoints REST
│   ├── rag_engine.py          # Motor RAG (LlamaIndex + FAISS)
│   ├── app.py                 # Punto de entrada Flask
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/components/        # ChatBot, tarjetas de vehículos
    └── src/pages/             # Catálogo y comparativa RAG
```

---

## 🚀 Instalación y Configuración

### Requisitos Previos
- Python 3.10+
- Node.js 18+
- API Key de [OpenRouter](https://openrouter.ai/keys) (requiere cuenta gratuita)

### 1. Configuración del Backend

```bash
cd backend
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env y agregar tu OPENROUTER_API_KEY

python app.py
```

El servidor arranca en `http://localhost:5000`

### 2. Configuración del Frontend

```bash
cd frontend
npm install
npm start
```

La app arranca en `http://localhost:3000`

### 3. Variables de entorno (.env)

```env
OPENROUTER_API_KEY=sk-or-v1-XXXXXXXXX   # Tu API key de OpenRouter
LLM_MODEL=google/gemini-2.0-flash-lite-001
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
FLASK_DEBUG=True
CATALOG_PATH=data/catalogo_vehiculos.csv
INDEX_PATH=embeddings/faiss_index
```

> ⚠️ **Nunca subas el archivo `.env` al repositorio.** Está incluido en `.gitignore`.

---

## 🛠️ Stack Tecnológico

| Capa | Herramienta |
|---|---|
| Orquestación IA | LlamaIndex 0.11 |
| Base de Datos Vectorial | FAISS (CPU) |
| Embeddings | Sentence-Transformers (local, multilingüe) |
| Backend | Flask 3.0 + Flask-CORS |
| Frontend | React 18 |
| LLM | google/gemini-2.0-flash-lite-001 vía OpenRouter |

---

## 🔍 Funcionalidades Clave

- **Modo RAG Toggle:** Compara en tiempo real la precisión con y sin información del catálogo.
- **Búsqueda Semántica:** Entiende lenguaje natural para encontrar vehículos por autonomía, precio o tipo.
- **Fuentes Citadas:** Muestra las especificaciones reales extraídas del CSV debajo de cada respuesta.
- **Persistencia FAISS:** El índice se guarda localmente para evitar regenerar embeddings en cada ejecución.

---

## 📊 Ventajas del Grounding RAG vs LLM Puro

Este es el resultado principal del proyecto. La misma pregunta produce respuestas radicalmente diferentes:

### Ejemplo: *"¿Cuánto cuesta el BYD Atto 3?"*

| | LLM sin RAG | LLM con RAG (este sistema) |
|---|---|---|
| **Respuesta** | "El BYD Atto 3 cuesta aproximadamente $35,000 USD" (inventado) | "El BYD Atto 3 2024 tiene un precio de $139.900.000 COP según nuestro catálogo" |
| **Fuente** | Ninguna — conocimiento general desactualizado | Catálogo CSV real |
| **Precisión** | ❌ Alucinación | ✅ Dato verificable |
| **Confianza** | Baja | Alta |

### Ejemplo: *"¿Qué SUV eléctrico carga más rápido?"*

| | LLM sin RAG | LLM con RAG |
|---|---|---|
| **Respuesta** | Menciona modelos que pueden no estar en el catálogo | Compara los SUVs del catálogo con sus tiempos reales de carga DC |
| **Datos** | Generales e imprecisos | Específicos: minutos de carga 10%→80% de cada modelo |

### Métricas observadas

- **Reducción de alucinaciones:** ~90% en preguntas sobre precios y especificaciones técnicas
- **Relevancia de fuentes:** Top-4 fragmentos con >50% de similitud semántica en consultas típicas
- **Latencia adicional RAG:** ~2-3 segundos vs consulta directa, justificado por precisión

---

## 🌐 Endpoints de la API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servidor y modelo activo |
| POST | `/api/query` | Consulta **con** RAG (grounding) |
| POST | `/api/query-no-rag` | Consulta **sin** RAG (comparativa) |
| GET | `/api/catalog` | Catálogo completo de vehículos |
| GET | `/api/catalog/filter` | Filtrar por marca, tipo y precio |
| GET | `/api/catalog/stats` | Estadísticas del catálogo |


*Proyecto académico desarrollado para la asignatura de Sistemas Inteligentes Computacionales — UNAL.*