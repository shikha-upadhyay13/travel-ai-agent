FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create data directory for SQLite
RUN mkdir -p /app/data

# Environment defaults
ENV OLLAMA_URL=http://ollama:11434/api/generate
ENV OLLAMA_MODEL=llama3
ENV DB_PATH=/app/data/travel_agent.db
ENV LOG_LEVEL=INFO
ENV CORS_ORIGINS=http://localhost:8000,http://localhost:3000

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
