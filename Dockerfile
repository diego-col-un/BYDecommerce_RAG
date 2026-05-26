FROM python:3.11-slim

WORKDIR /app

COPY backend/ ./backend/
COPY backend/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 7860

CMD ["python", "backend/app.py"]