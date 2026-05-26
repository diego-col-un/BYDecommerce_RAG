FROM python:3.11-slim

WORKDIR /app

COPY backend/ ./backend/
COPY backend/requirements.txt .

RUN pip install --no-cache-dir \
    flask==3.0.3 \
    flask-cors==4.0.1 \
    llama-index-core==0.11.22 \
    llama-index-readers-file==0.2.2 \
    llama-index-embeddings-huggingface==0.3.1 \
    "huggingface-hub==0.23.4" \
    faiss-cpu>=1.12.0 \
    sentence-transformers==3.3.1 \
    "pandas==2.2.3" \
    python-dotenv==1.0.1 \
    "httpx==0.27.2" \
    openai>=1.0.0 && \
    pip install --no-cache-dir --no-deps llama-index-llms-openai==0.1.31 && \
    pip install --no-cache-dir --no-deps llama-index-llms-openai-like==0.2.0

EXPOSE 7860

CMD ["python", "backend/app.py"]