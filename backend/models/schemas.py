"""
SmartRetail AI — Pydantic Schemas (request / response DTOs)
"""

from __future__ import annotations

from datetime import date
from typing import Optional, List
from pydantic import BaseModel, Field


# ── Stores ────────────────────────────────────────────────────────────────────

class StoreOut(BaseModel):
    id:   int
    name: str
    city: str

    model_config = {"from_attributes": True}


# ── Products ──────────────────────────────────────────────────────────────────

class ProductOut(BaseModel):
    id:         int
    name:       str
    category:   str
    base_price: float

    model_config = {"from_attributes": True}


# ── Sales Analytics ───────────────────────────────────────────────────────────

class DailySales(BaseModel):
    date:             date
    total_quantity:   int
    total_revenue:    float
    num_transactions: int


class TopProduct(BaseModel):
    product_id:   int
    product_name: str
    category:     str
    total_sold:   int
    total_revenue: float


class StoreSummary(BaseModel):
    store_id:      int
    store_name:    str
    city:          str
    total_sales:   int
    total_revenue: float


class SalesAnalyticsOut(BaseModel):
    period_start:    date
    period_end:      date
    total_revenue:   float
    total_units_sold: int
    daily_trend:     List[DailySales]
    top_products:    List[TopProduct]
    store_summaries: List[StoreSummary]


# ── Demand Prediction ─────────────────────────────────────────────────────────

class PredictDemandIn(BaseModel):
    store_id:   int  = Field(..., example=1)
    product_id: int  = Field(..., example=42)
    price:      Optional[float] = Field(None, example=1299.0)
    promotion:  int  = Field(0,   example=0, ge=0, le=1)


class PredictDemandOut(BaseModel):
    store_id:         int
    product_id:       int
    store_name:       str
    product_name:     str
    predicted_demand: float   # 7-day units
    horizon_days:     int = 7


# ── Inventory Recommendation ──────────────────────────────────────────────────

class InventoryRecommendationIn(BaseModel):
    store_id:   int = Field(..., example=1)
    product_id: int = Field(..., example=42)
    promotion:  int = Field(0, ge=0, le=1)


class InventoryRecommendationOut(BaseModel):
    store_id:             int
    product_id:           int
    store_name:           str
    product_name:         str
    current_stock:        int
    predicted_demand:     float
    recommended_restock:  int
    safety_stock:         int
    alert_level:          str
    reason:               str


# ── Alerts ────────────────────────────────────────────────────────────────────

class AlertOut(BaseModel):
    store_id:    int
    store_name:  str
    product_id:  int
    product_name: str
    alert_level: str
    current_stock: int
    predicted_demand: float
    recommended_restock: int
