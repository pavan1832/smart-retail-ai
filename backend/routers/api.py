"""
SmartRetail AI — API Routers
Registers all route modules onto the FastAPI app.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List

from backend.services.data_service import (
    load_stores, load_products, get_store, get_product,
    get_current_stock, get_recent_sales, sales_analytics,
)
from backend.ml_models.demand_forecasting import forecaster
from backend.services.inventory_optimizer import optimizer
from backend.models.schemas import (
    StoreOut, ProductOut,
    PredictDemandIn, PredictDemandOut,
    InventoryRecommendationIn, InventoryRecommendationOut,
    AlertOut,
)

router = APIRouter()


# ── Stores ─────────────────────────────────────────────────────────────────────

@router.get("/stores", response_model=List[StoreOut], tags=["Stores"])
def list_stores(city: Optional[str] = Query(None, description="Filter by city")):
    """Return all stores, optionally filtered by city."""
    stores = load_stores()
    if city:
        stores = stores[stores["city"].str.lower() == city.lower()]
    return stores.rename(columns={"store_id": "id"}).to_dict("records")


# ── Products ───────────────────────────────────────────────────────────────────

@router.get("/products", response_model=List[ProductOut], tags=["Products"])
def list_products(
    category: Optional[str] = Query(None),
    limit:    int           = Query(50, ge=1, le=500),
):
    """Return product catalog, optionally filtered by category."""
    products = load_products()
    if category:
        products = products[products["category"].str.lower() == category.lower()]
    products = products.head(limit)
    return products.rename(columns={"product_id": "id"}).to_dict("records")


# ── Sales Analytics ────────────────────────────────────────────────────────────

@router.get("/sales-analytics", tags=["Analytics"])
def get_sales_analytics(
    start_date: Optional[str] = Query(None, example="2023-01-01"),
    end_date:   Optional[str] = Query(None, example="2023-12-31"),
    store_id:   Optional[int] = Query(None),
):
    """Aggregate sales analytics for the dashboard."""
    try:
        return sales_analytics(start_date, end_date, store_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Demand Prediction ──────────────────────────────────────────────────────────

@router.post("/predict-demand", response_model=PredictDemandOut, tags=["ML"])
def predict_demand(payload: PredictDemandIn):
    """
    Predict 7-day demand for a store–product pair.

    Falls back to a heuristic if the model has not been trained yet.
    """
    store   = get_store(payload.store_id)
    product = get_product(payload.product_id)

    if store is None:
        raise HTTPException(status_code=404, detail=f"Store {payload.store_id} not found")
    if product is None:
        raise HTTPException(status_code=404, detail=f"Product {payload.product_id} not found")

    price = payload.price if payload.price is not None else float(product["base_price"])
    recent = get_recent_sales(payload.store_id, payload.product_id)

    try:
        demand = forecaster.predict(
            store_id         = payload.store_id,
            product_id       = payload.product_id,
            avg_price        = price,
            promotion        = payload.promotion,
            reference_sales  = recent,
        )
    except RuntimeError:
        # Model not trained — use simple heuristic
        base = (sum(recent) / len(recent)) if recent else 50.0
        promo_boost = 1.4 if payload.promotion else 1.0
        demand = round(base * promo_boost, 1)

    return PredictDemandOut(
        store_id         = payload.store_id,
        product_id       = payload.product_id,
        store_name       = store["name"],
        product_name     = product["name"],
        predicted_demand = demand,
        horizon_days     = 7,
    )


# ── Inventory Recommendation ───────────────────────────────────────────────────

@router.post("/inventory-recommendation", response_model=InventoryRecommendationOut, tags=["Inventory"])
def inventory_recommendation(payload: InventoryRecommendationIn):
    """Return a restock recommendation for a store–product pair."""
    store   = get_store(payload.store_id)
    product = get_product(payload.product_id)

    if store is None:
        raise HTTPException(status_code=404, detail=f"Store {payload.store_id} not found")
    if product is None:
        raise HTTPException(status_code=404, detail=f"Product {payload.product_id} not found")

    price   = float(product["base_price"])
    recent  = get_recent_sales(payload.store_id, payload.product_id)
    current = get_current_stock(payload.store_id, payload.product_id)

    try:
        demand = forecaster.predict(
            store_id        = payload.store_id,
            product_id      = payload.product_id,
            avg_price       = price,
            promotion       = payload.promotion,
            reference_sales = recent,
        )
    except RuntimeError:
        base   = (sum(recent) / len(recent)) if recent else 50.0
        demand = round(base * (1.4 if payload.promotion else 1.0), 1)

    rec = optimizer.recommend(
        store_id         = payload.store_id,
        product_id       = payload.product_id,
        product_name     = product["name"],
        current_stock    = current,
        predicted_demand = demand,
    )

    return InventoryRecommendationOut(
        store_id            = payload.store_id,
        product_id          = payload.product_id,
        store_name          = store["name"],
        product_name        = product["name"],
        current_stock       = rec.current_stock,
        predicted_demand    = rec.predicted_demand,
        recommended_restock = rec.recommended_restock,
        safety_stock        = rec.safety_stock,
        alert_level         = rec.alert_level.value,
        reason              = rec.reason,
    )


# ── Alerts ─────────────────────────────────────────────────────────────────────

@router.get("/alerts", response_model=List[AlertOut], tags=["Inventory"])
def get_alerts(
    store_id:    Optional[int] = Query(None),
    alert_level: Optional[str] = Query(None, description="LOW | CRITICAL | OVERSTOCK"),
    limit:       int           = Query(20, ge=1, le=100),
):
    """Return inventory alerts across stores (sampled for performance)."""
    from backend.services.data_service import load_inventory
    import random

    stores   = load_stores()
    products = load_products()
    inv      = load_inventory()

    if store_id:
        inv = inv[inv["store_id"] == store_id]

    # Sample rows for speed
    sample = inv.sample(min(len(inv), 200), random_state=42)

    alerts = []
    for _, row in sample.iterrows():
        sid = int(row["store_id"])
        pid = int(row["product_id"])
        s   = stores[stores["store_id"] == sid]
        p   = products[products["product_id"] == pid]
        if s.empty or p.empty:
            continue

        recent  = get_recent_sales(sid, pid)
        demand  = (sum(recent) / len(recent)) if recent else 50.0
        current = int(row["current_stock"])

        rec = optimizer.recommend(
            store_id         = sid,
            product_id       = pid,
            product_name     = p.iloc[0]["name"],
            current_stock    = current,
            predicted_demand = demand,
        )

        if alert_level and rec.alert_level.value != alert_level.upper():
            continue
        if rec.alert_level.value == "OK":
            continue

        alerts.append(AlertOut(
            store_id            = sid,
            store_name          = s.iloc[0]["name"],
            product_id          = pid,
            product_name        = p.iloc[0]["name"],
            alert_level         = rec.alert_level.value,
            current_stock       = current,
            predicted_demand    = rec.predicted_demand,
            recommended_restock = rec.recommended_restock,
        ))

    return alerts[:limit]


# ── Model Training ─────────────────────────────────────────────────────────────

@router.post("/train", tags=["ML"])
def train_model():
    """Trigger model training on the full sales dataset (may take ~60 s)."""
    from backend.services.data_service import load_sales
    sales = load_sales()
    metrics = forecaster.train(sales)
    return {"status": "trained", "metrics": metrics}
