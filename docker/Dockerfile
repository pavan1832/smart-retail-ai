# ── SmartRetail AI — Backend Dockerfile ──────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and data
COPY backend/ ./backend/
COPY data/retail_sales.csv  ./data/retail_sales.csv
COPY data/stores.csv        ./data/stores.csv
COPY data/products.csv      ./data/products.csv
COPY data/inventory.csv     ./data/inventory.csv

# Environment
ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Expose FastAPI port
EXPOSE 8000

# Start server
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
