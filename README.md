# 🚗⚡ AutoElectric AI — Sistema RAG de Vehículos Eléctricos

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)](https://www.python.org/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Flask 3](https://img.shields.io/badge/Flask-3-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![LlamaIndex](https://img.shields.io/badge/LlamaIndex-0.11-orange)](https://www.llamaindex.ai/)

**AutoElectric AI** es un sistema de generación aumentada por recuperación (**RAG**) diseñado para actuar como un catálogo inteligente de vehículos eléctricos. Combina la potencia de los LLM modernos con una base de datos local para ofrecer respuestas precisas, evitando alucinaciones y anclando la información a los datos reales del catálogo de 20 vehículos.

---

## 🏗️ Arquitectura del Sistema

El proyecto utiliza un enfoque desacoplado para separar el motor de IA de la interfaz de usuario:

- **Backend:** API REST construida con **Flask** que gestiona el motor RAG utilizando **LlamaIndex** y **FAISS** para la búsqueda vectorial.
- **Frontend:** Interfaz moderna en **React** que permite visualizar el catálogo y comparar en tiempo real las respuestas con y sin contexto (RAG vs LLM puro).
- **Embeddings:** Generados localmente con el modelo multilingüe `paraphrase-multilingual-mpnet-base-v2`.

---

## 📂 Estructura del Proyecto

```text
ecommerce-rag/
├── backend/                # Servidor Flask + LlamaIndex
│   ├── data/               # Catálogo CSV (Base de conocimiento)
│   ├── embeddings/         # Índice FAISS generado
│   ├── routes/             # Endpoints de la API
│   └── rag_engine.py       # Motor RAG (LlamaIndex + FAISS)
└── frontend/               # Aplicación React
    ├── src/components/     # ChatBot y tarjetas de vehículos
    └── src/pages/          # Catálogo y comparativa RAG
🚀 Instalación y ConfiguraciónRequisitos PreviosPython 3.10+Node.js 18+API Key de OpenRouter (Modelo: llama-3.1-8b-instruct:free)1. Configuración del BackendBashcd backend
python -m venv venv
# Activar entorno (Windows: venv\Scripts\activate | Linux: source venv/bin/activate)
source venv/bin/activate  
pip install -r requirements.txt
cp .env.example .env      # Configura tu OPENROUTER_API_KEY aquí
python app.py
2. Configuración del FrontendBashcd frontend
npm install
npm start
🛠️ Stack TecnológicoCapaHerramientasOrquestación IALlamaIndex 0.11Base de Datos VectorialFAISSEmbeddingsSentence-Transformers (Local)Backend FrameworkFlask 3.0Frontend FrameworkReact 18Modelos de LenguajeLlama 3.1 (vía OpenRouter)🔍 Funcionalidades ClaveModo RAG Toggle: Compara la precisión de la IA con y sin información del catálogo en tiempo real.Búsqueda Semántica: Entiende lenguaje natural para encontrar vehículos por autonomía, precio o tipo.Fuentes Citadas: Muestra las especificaciones reales extraídas del CSV debajo de cada respuesta.Persistencia: El índice FAISS se guarda localmente para evitar regenerar embeddings en cada ejecución.📈 Roadmap DevOpsComo parte de mi perfil enfocado en DevOps, este proyecto integrará próximamente:[ ] Docker: Containerización completa de la arquitectura (Backend + Frontend).[ ] CI/CD: Automatización de despliegue y pruebas mediante GitHub Actions.[ ] Monitoreo: Implementación de métricas de observabilidad para el servicio de IA.Proyecto académico desarrollado para la asignatura de Inteligencia Artificial.