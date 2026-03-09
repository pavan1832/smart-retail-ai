# 🛍️ SmartRetail AI — Demand Forecasting & Inventory Optimization Platform

> An enterprise-grade retail intelligence platform that predicts product demand and optimizes inventory across multiple stores using machine learning.

[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](https://docker.com)

---

## 📸 Screenshots

| Dashboard | Demand Forecast | Inventory Alerts |
|-----------|----------------|-----------------|
| ![Dashboard](docs/screenshot-dashboard.png) | ![Forecast](docs/screenshot-forecast.png) | ![Alerts](docs/screenshot-alerts.png) |

---

## 🎯 Project Overview

SmartRetail AI simulates the kind of demand-forecasting platform used by global retailers like **TJX, Walmart, and Amazon** to:

- 📊 Analyze 12 months of historical sales across 50 stores and 500+ products
- 🤖 Predict future demand using a **RandomForestRegressor** trained on seasonal, temporal, and promotional features
- 📦 Generate intelligent **restock recommendations** with configurable safety buffers
- 🚨 Surface real-time **inventory alerts** (Critical / Low / Overstock)
- 🏪 Compare **multi-city store performance** across Bangalore, Mumbai, Delhi, Hyderabad, and Chennai

---

## 🏗️ System Architecture

```
Retail Dataset (CSV / PostgreSQL)
         │
         ▼
 ┌─────────────────┐
 │  Data Pipeline  │  Pandas · NumPy
 │  (Feature Eng.) │
 └────────┬────────┘
          │
          ▼
 ┌──────────────────────┐
 │  Demand Forecasting  │  RandomForestRegressor
 │  ml_models/          │  Lag features · Seasonality
 └────────┬─────────────┘
          │
          ▼
 ┌──────────────────────────┐
 │  Inventory Optimizer     │  Rule-based engine
 │  services/               │  Safety stock · Alerts
 └────────┬─────────────────┘
          │
          ▼
 ┌─────────────────┐
 │  FastAPI Backend│  REST API · Pydantic
 │  /api/v1/       │  Auto-docs (/docs)
 └────────┬────────┘
          │
          ▼
 ┌──────────────────┐
 │  React Dashboard │  Recharts · TailwindCSS
 │  frontend/src/   │  4 pages · Live data
 └──────────────────┘
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Demand Forecasting** | RandomForest model with lag/seasonality features → 7-day prediction |
| **Inventory Optimization** | Safety-stock algorithm → per-SKU restock recommendations |
| **Inventory Alerts** | Critical / Low / Overstock tiering with auto-threshold logic |
| **Analytics Dashboard** | Revenue trends, top products, category breakdown, store rankings |
| **Multi-Store Simulation** | 50 stores across 5 Indian cities with city-level radar charts |
| **Synthetic Data Generator** | 178 K+ realistic sales rows for a full year |
| **REST API** | 7 production endpoints with Pydantic validation & OpenAPI docs |
| **Docker** | One-command deployment with `docker-compose up` |

---

## 🛠️ Tech Stack

**Backend**
- Python 3.11, FastAPI, Uvicorn
- Pandas, NumPy, scikit-learn, joblib

**Frontend**
- React 18, Vite, TailwindCSS
- Recharts (AreaChart, BarChart, RadarChart, PieChart)
- Lucide React icons

**Data**
- CSV-backed data layer (plug-and-play PostgreSQL via SQLAlchemy)
- Synthetic dataset generator (50 stores · 500 products · 365 days)

**DevOps**
- Docker + docker-compose
- Render / Railway (backend), Vercel (frontend), Supabase (DB)

---

## 📁 Project Structure

```
smart-retail-ai/
├── backend/
│   ├── main.py                      # FastAPI app factory
│   ├── routers/
│   │   └── api.py                   # All API endpoints
│   ├── services/
│   │   ├── data_service.py          # CSV data layer + query helpers
│   │   └── inventory_optimizer.py   # Rule-based restock engine
│   ├── ml_models/
│   │   └── demand_forecasting.py    # RandomForest demand model
│   └── models/
│       ├── db_models.py             # SQLAlchemy ORM
│       └── schemas.py               # Pydantic DTOs
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # Root component + routing
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # KPI cards + trend charts
│   │   │   ├── DemandForecast.jsx   # ML prediction UI
│   │   │   ├── InventoryAlerts.jsx  # Alert management
│   │   │   └── StorePerformance.jsx # City-level analytics
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StatCard.jsx
│   │   │   └── AlertBadge.jsx
│   │   └── services/
│   │       └── api.js               # Backend API client
│   ├── package.json
│   └── vite.config.js
├── data/
│   ├── generate_retail_dataset.py   # Synthetic data generator
│   ├── retail_sales.csv             # 178K+ sales records
│   ├── stores.csv                   # 50 store locations
│   ├── products.csv                 # 498 products / 6 categories
│   └── inventory.csv                # 24.9K inventory records
├── docker/
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start (Local)

### Prerequisites
- Python 3.11+
- Node.js 20+
- Git

### 1. Clone the repo
```bash
git clone https://github.com/your-org/smart-retail-ai.git
cd smart-retail-ai
```

### 2. Generate the dataset
```bash
cd data
pip install pandas numpy
python generate_retail_dataset.py
cd ..
```

### 3. Run the backend
```bash
cd backend
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
# API docs → http://localhost:8000/docs
```

### 4. Run the frontend
```bash
cd frontend
npm install
npm run dev
# Dashboard → http://localhost:3000
```

### 5. (Optional) Train the ML model
```
POST http://localhost:8000/api/v1/train
```
This trains the RandomForestRegressor on all 178K sales rows (~60 s). Until trained, the API uses a heuristic fallback.

---

## 🐳 Docker Deployment

```bash
# Build and start everything
docker-compose up --build

# Backend  → http://localhost:8000
# Frontend → http://localhost:3000
# API docs → http://localhost:8000/docs
```

---

## ☁️ Cloud Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
vercel deploy --prod
```
Set environment variable: `VITE_API_URL=https://your-backend.onrender.com/api/v1`

### Backend → Render
1. Connect your GitHub repo on [render.com](https://render.com)
2. Build command: `pip install -r backend/requirements.txt`
3. Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

### Database → Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Run the schema from `backend/models/db_models.py` via Alembic
3. Set `DATABASE_URL` environment variable

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/v1/stores` | List all stores (filter by city) |
| `GET`  | `/api/v1/products` | Product catalog (filter by category) |
| `GET`  | `/api/v1/sales-analytics` | Aggregated revenue + trend data |
| `POST` | `/api/v1/predict-demand` | 7-day demand forecast |
| `POST` | `/api/v1/inventory-recommendation` | Restock recommendation |
| `GET`  | `/api/v1/alerts` | Inventory alerts (Critical/Low/Overstock) |
| `POST` | `/api/v1/train` | Train / retrain the ML model |

### Example — Demand Prediction
```bash
curl -X POST http://localhost:8000/api/v1/predict-demand \
  -H "Content-Type: application/json" \
  -d '{"store_id": 1, "product_id": 42, "promotion": 1}'
```
```json
{
  "store_id": 1,
  "product_id": 42,
  "store_name": "Store-001",
  "product_name": "Running Shoes v1",
  "predicted_demand": 228.5,
  "horizon_days": 7
}
```

### Example — Inventory Recommendation
```bash
curl -X POST http://localhost:8000/api/v1/inventory-recommendation \
  -H "Content-Type: application/json" \
  -d '{"store_id": 1, "product_id": 42, "promotion": 0}'
```
```json
{
  "store_name": "Store-001",
  "product_name": "Running Shoes v1",
  "current_stock": 120,
  "predicted_demand": 200.0,
  "recommended_restock": 90,
  "safety_stock": 9,
  "alert_level": "LOW",
  "reason": "Stock covers 60% of predicted demand — restock 90 units soon."
}
```

---

## 🤖 ML Model Details

**Algorithm:** `RandomForestRegressor` (200 trees, max_depth=15)

**Input Features:**
| Feature | Description |
|---------|-------------|
| `store_id_enc` | Label-encoded store ID |
| `product_id_enc` | Label-encoded product ID |
| `avg_price` | Average selling price in the week |
| `promotion` | Binary promo flag |
| `month`, `week_of_year`, `quarter` | Temporal features |
| `sin_woy`, `cos_woy` | Cyclical seasonality encoding |
| `lag_1`, `lag_2` | Previous 1–2 weeks' sales |
| `rolling_mean_4` | 4-week rolling average |

**Target:** `weekly_sales` (units per store–product–week)

**Typical performance:** MAE ≈ 8–12 units · R² ≈ 0.82–0.87

---

## 📊 Dataset Schema

**retail_sales.csv**
```
date, store_id, product_id, sales_quantity, price, promotion
2023-01-01, 1, 42, 34, 1299.50, 0
```

**stores.csv** — `store_id, name, city`
**products.csv** — `product_id, name, category, base_price`
**inventory.csv** — `store_id, product_id, current_stock`

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/xyz`
3. Commit your changes: `git commit -m "feat: add xyz"`
4. Push and open a PR

---

## 📄 License

MIT © 2024 SmartRetail AI. Built as a portfolio / learning project.

---

> *Built to demonstrate production-quality full-stack AI engineering — from data pipelines and ML training to REST APIs and React dashboards.*
