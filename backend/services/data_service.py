"""
SmartRetail AI — Data Service
Loads and caches CSV data; provides query helpers for routers.
Allows the platform to run without a live PostgreSQL instance.
"""

from __future__ import annotations

import os
import logging
from functools import lru_cache
from typing import Optional

import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")


def _path(filename: str) -> str:
    return os.path.join(DATA_DIR, filename)


# ── Cached loaders ────────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def load_stores() -> pd.DataFrame:
    df = pd.read_csv(_path("stores.csv"))
    logger.info("Loaded %d stores", len(df))
    return df


@lru_cache(maxsize=1)
def load_products() -> pd.DataFrame:
    df = pd.read_csv(_path("products.csv"))
    logger.info("Loaded %d products", len(df))
    return df


@lru_cache(maxsize=1)
def load_sales() -> pd.DataFrame:
    df = pd.read_csv(_path("retail_sales.csv"), parse_dates=["date"])
    logger.info("Loaded %d sales records", len(df))
    return df


@lru_cache(maxsize=1)
def load_inventory() -> pd.DataFrame:
    df = pd.read_csv(_path("inventory.csv"))
    logger.info("Loaded %d inventory records", len(df))
    return df


# ── Query Helpers ─────────────────────────────────────────────────────────────

def get_store(store_id: int) -> Optional[dict]:
    stores = load_stores()
    row = stores[stores["store_id"] == store_id]
    return row.iloc[0].to_dict() if len(row) else None


def get_product(product_id: int) -> Optional[dict]:
    products = load_products()
    row = products[products["product_id"] == product_id]
    return row.iloc[0].to_dict() if len(row) else None


def get_current_stock(store_id: int, product_id: int) -> int:
    inv = load_inventory()
    row = inv[(inv["store_id"] == store_id) & (inv["product_id"] == product_id)]
    if len(row) == 0:
        return 0
    return int(row.iloc[0]["current_stock"])


def get_recent_sales(store_id: int, product_id: int, weeks: int = 8) -> list[float]:
    """Return weekly sales totals for the last `weeks` weeks."""
    sales = load_sales()
    mask = (sales["store_id"] == store_id) & (sales["product_id"] == product_id)
    sub = sales[mask].copy()
    if sub.empty:
        return []
    sub["week"] = sub["date"].dt.to_period("W")
    weekly = sub.groupby("week")["sales_quantity"].sum().tail(weeks)
    return weekly.tolist()


def sales_analytics(
    start_date: Optional[str] = None,
    end_date:   Optional[str] = None,
    store_id:   Optional[int] = None,
) -> dict:
    """Aggregate sales data for the analytics endpoint."""
    sales    = load_sales()
    products = load_products()
    stores   = load_stores()

    df = sales.merge(products[["product_id", "name", "category"]], on="product_id", how="left")
    df = df.merge(stores[["store_id", "name", "city"]], on="store_id", how="left", suffixes=("_product","_store"))

    if start_date:
        df = df[df["date"] >= pd.Timestamp(start_date)]
    if end_date:
        df = df[df["date"] <= pd.Timestamp(end_date)]
    if store_id:
        df = df[df["store_id"] == store_id]

    period_start = df["date"].min().date()
    period_end   = df["date"].max().date()
    df["revenue"]  = df["sales_quantity"] * df["price"]

    # Daily trend
    daily = (
        df.groupby("date")
        .agg(
            total_quantity=("sales_quantity", "sum"),
            total_revenue=("revenue", "sum"),
            num_transactions=("sales_quantity", "count"),
        )
        .reset_index()
        .sort_values("date")
        .tail(90)   # last 90 days max
    )

    # Top products
    top_products = (
        df.groupby(["product_id", "name_product", "category"])
        .agg(total_sold=("sales_quantity", "sum"), total_revenue=("revenue", "sum"))
        .reset_index()
        .sort_values("total_sold", ascending=False)
        .head(10)
    )

    # Store summaries
    store_summaries = (
        df.groupby(["store_id", "name_store", "city"])
        .agg(total_sales=("sales_quantity", "sum"), total_revenue=("revenue", "sum"))
        .reset_index()
        .sort_values("total_revenue", ascending=False)
    )

    return {
        "period_start":     str(period_start),
        "period_end":       str(period_end),
        "total_revenue":    round(float(df["revenue"].sum()), 2),
        "total_units_sold": int(df["sales_quantity"].sum()),
        "daily_trend": [
            {
                "date":             str(r["date"].date()),
                "total_quantity":   int(r["total_quantity"]),
                "total_revenue":    round(float(r["total_revenue"]), 2),
                "num_transactions": int(r["num_transactions"]),
            }
            for _, r in daily.iterrows()
        ],
        "top_products": [
            {
                "product_id":    int(r["product_id"]),
                "product_name":  r["name_product"],
                "category":      r["category"],
                "total_sold":    int(r["total_sold"]),
                "total_revenue": round(float(r["total_revenue"]), 2),
            }
            for _, r in top_products.iterrows()
        ],
        "store_summaries": [
            {
                "store_id":      int(r["store_id"]),
                "store_name":    r["name_store"],
                "city":          r["city"],
                "total_sales":   int(r["total_sales"]),
                "total_revenue": round(float(r["total_revenue"]), 2),
            }
            for _, r in store_summaries.iterrows()
        ],
    }
