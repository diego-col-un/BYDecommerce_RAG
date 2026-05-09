# 🚗⚡ AutoElectric AI — Guía de Instalación

Sistema RAG (Retrieval-Augmented Generation) para catálogo inteligente de vehículos eléctricos.

---

## Estructura del Proyecto

```
ecommerce-rag/
├── backend/
│   ├── app.py                  # Servidor Flask principal
│   ├── rag_engine.py           # Motor RAG (LlamaIndex + FAISS)
│   ├── requirements.txt        # Dependencias Python
│   ├── .env.example            # Variables de entorno (copiar a .env)
│   ├── data/
│   │   └── catalogo_vehiculos.csv   # Catálogo de 20 vehículos
│   ├── embeddings/             # Índice FAISS (se genera automáticamente)
│   └── routes/
│       └── api.py              # Endpoints REST
└── frontend/
    ├── package.json
    ├── public/index.html
    └── src/
        ├── App.jsx             # Layout y navegación
        ├── index.js / index.css
        ├── components/
        │   ├── ChatBot.jsx     # Interfaz de chat con modo RAG
        │   └── VehicleCard.jsx # Tarjeta de vehículo
        ├── pages/
        │   ├── CatalogPage.jsx # Catálogo con filtros
        │   └── ComparePage.jsx # Comparativa RAG vs LLM
        └── services/
            └── api.js          # Llamadas al backend
```

---

## Requisitos Previos

| Herramienta | Versión mínima | Verificar con |
|-------------|---------------|---------------|
| Python      | 3.10+         | `python --version` |
| Node.js     | 18+           | `node --version` |
| npm         | 9+            | `npm --version` |
| Git         | cualquiera    | `git --version` |

---

## Paso 1 — Obtener API Key de OpenRouter

1. Ir a [https://openrouter.ai](https://openrouter.ai) y crear cuenta gratuita
2. En el dashboard → **Keys** → **Create Key**
3. Copiar la key (formato: `sk-or-v1-xxxxxxxxxxxx`)
4. El modelo `meta-llama/llama-3.1-8b-instruct:free` es **100% gratuito**

---

## Paso 2 — Configurar el Backend (Flask)

```bash
# Clonar o descomprimir el proyecto
cd ecommerce-rag/backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En macOS/Linux:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

> ⚠️ La instalación puede tomar 3-5 minutos. El modelo de embeddings
> (`paraphrase-multilingual-mpnet-base-v2`, ~420 MB) se descarga automáticamente
> la primera vez que se ejecuta el servidor.

### Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tu editor favorito
nano .env   # o code .env, o notepad .env en Windows
```

Editar el archivo `.env`:
```env
OPENROUTER_API_KEY=sk-or-v1-TU_KEY_AQUI     # ← pegar tu key aquí
LLM_MODEL=meta-llama/llama-3.1-8b-instruct:free
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
FLASK_DEBUG=True
CATALOG_PATH=data/catalogo_vehiculos.csv
INDEX_PATH=embeddings/faiss_index
```

### Ejecutar el backend

```bash
python app.py
```

**Primera ejecución (esperado):**
```
[INFO] Inicializando RAG Engine
[INFO] Cargando modelo de embeddings: paraphrase-multilingual-mpnet-base-v2
# ← Aquí descarga el modelo (~1-2 min)
[INFO] Catálogo cargado: 20 vehículos
[INFO] 20 documentos creados — generando embeddings...
[INFO] Índice guardado en: embeddings/faiss_index
[INFO] RAG Engine listo
[INFO] Servidor Flask corriendo en http://0.0.0.0:5000
```

**Ejecuciones siguientes (rápido):**
```
[INFO] Cargando índice FAISS existente...
[INFO] RAG Engine listo  ← ~10 segundos
```

### Verificar que el backend funciona

```bash
# En otra terminal (con el venv activado)
curl http://localhost:5000/api/health
```

Respuesta esperada:
```json
{"status": "ok", "rag_initialized": true, ...}
```

---

## Paso 3 — Configurar el Frontend (React)

```bash
# En otra terminal (NO cerrar el backend)
cd ecommerce-rag/frontend

# Instalar dependencias de Node.js
npm install

# Iniciar el servidor de desarrollo
npm start
```

El navegador abrirá automáticamente `http://localhost:3000`

---

## Paso 4 — Usar la Aplicación

### Pestaña: Asistente IA (💬)
- Escribir preguntas en lenguaje natural sobre vehículos
- **Toggle RAG**: activar/desactivar el grounding para ver la diferencia
- Las fuentes recuperadas del catálogo aparecen debajo de cada respuesta

**Preguntas de ejemplo:**
```
¿Cuál es el BYD más económico?
Compara el Tesla Model 3 vs el BYD Han
¿Qué vehículo tiene mayor autonomía?
¿Cuál SUV eléctrico tiene 7 plazas y cuesta menos de $300 millones?
¿El IONIQ 6 tiene carga de 800V?
Recomiéndame un eléctrico deportivo con menos de 4 segundos de 0 a 100
```

### Pestaña: Catálogo (🚗)
- Visualizar los 20 vehículos del catálogo
- Filtrar por marca (BYD, Tesla, Hyundai, etc.)
- Filtrar por tipo (SUV, Sedán, Hatchback)
- Buscar texto libre
- Expandir cada tarjeta para ver especificaciones completas

### Pestaña: Comparativa (⚖️)
- Hacer la misma consulta en paralelo con y sin RAG
- Ver cómo el LLM sin grounding puede inventar datos
- Ver cómo el RAG ancla la respuesta al catálogo real

---

## Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET  | `/api/health` | Estado del servidor y RAG Engine |
| POST | `/api/query` | Consulta CON RAG (body: `{"question": "..."}`) |
| POST | `/api/query-no-rag` | Consulta SIN RAG (comparativa) |
| GET  | `/api/catalog` | Lista completa de vehículos |
| GET  | `/api/catalog/filter?marca=BYD` | Catálogo filtrado |
| GET  | `/api/catalog/stats` | Estadísticas del catálogo |

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React :3000)                │
│  ChatBot.jsx  │  CatalogPage.jsx  │  ComparePage.jsx    │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP (axios)
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (Flask :5000)                  │
│  routes/api.py  →  rag_engine.py                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              RAG Engine (LlamaIndex)             │   │
│  │                                                  │   │
│  │  CSV Catálogo → Document → Chunk → Embedding    │   │
│  │                                    ↓             │   │
│  │  Query → Embed → FAISS Búsqueda → Top-K Docs   │   │
│  │                                    ↓             │   │
│  │              Contexto + Prompt → LLM             │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────┐
│              OpenRouter API (nube)                       │
│         meta-llama/llama-3.1-8b-instruct:free           │
└─────────────────────────────────────────────────────────┘

Embeddings locales: sentence-transformers (MPNET multilingual)
Vector Store: FAISS (Facebook AI Similarity Search)
```

---

## Solución de Problemas

### Error: `OPENROUTER_API_KEY no está configurada`
→ Verificar que el archivo `.env` existe y tiene la key correcta

### Error al conectar al backend desde React
→ Verificar que Flask está corriendo en puerto 5000
→ Verificar que CORS está habilitado (está en `app.py`)
→ El `proxy` en `package.json` apunta a `http://localhost:5000`

### Primera ejecución muy lenta
→ Normal. Descarga el modelo de embeddings (~420 MB) una sola vez
→ El índice FAISS se guarda en `embeddings/faiss_index` para reusar

### Error de memoria con FAISS
→ Reducir `similarity_top_k` de 4 a 2 en `rag_engine.py`

### Respuestas en inglés del LLM
→ El prompt ya especifica español. Si persiste, cambiar el modelo en `.env`:
   `LLM_MODEL=mistralai/mistral-7b-instruct:free`

---

## Modelos Alternativos en OpenRouter (gratuitos)

```env
# Opciones 100% gratuitas en OpenRouter:
LLM_MODEL=meta-llama/llama-3.1-8b-instruct:free
LLM_MODEL=mistralai/mistral-7b-instruct:free
LLM_MODEL=google/gemma-2-9b-it:free
LLM_MODEL=microsoft/phi-3-mini-128k-instruct:free
```

---

## Agregar Vehículos al Catálogo

Editar `backend/data/catalogo_vehiculos.csv` con las columnas existentes, luego:

```bash
# Eliminar el índice guardado para regenerarlo
rm -rf backend/embeddings/faiss_index

# Reiniciar el backend
python app.py
```

---

*Proyecto desarrollado para la asignatura de Inteligencia Artificial.*
*Stack: Python 3.10 · Flask 3 · LlamaIndex 0.11 · FAISS · React 18 · OpenRouter*
