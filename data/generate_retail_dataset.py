"""
SmartRetail AI — Synthetic Retail Dataset Generator
Generates 1 year of sales data for 50 stores and 500 products.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import os

# Reproducibility
np.random.seed(42)
random.seed(42)

# ── Configuration ────────────────────────────────────────────────────────────
NUM_STORES = 50
NUM_PRODUCTS = 500
START_DATE = datetime(2023, 1, 1)
END_DATE = datetime(2023, 12, 31)

CITIES = [
    "Bangalore", "Hyderabad", "Mumbai", "Delhi", "Chennai",
    "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Surat",
    "Lucknow", "Kanpur", "Nagpur", "Visakhapatnam", "Bhopal",
    "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Coimbatore",
]

CATEGORIES = ["Footwear", "Apparel", "Electronics", "Accessories", "Sports", "Home"]

PRODUCT_NAMES = {
    "Footwear":     ["Running Shoes", "Casual Sneakers", "Formal Shoes", "Sandals", "Boots", "Loafers"],
    "Apparel":      ["T-Shirt", "Jeans", "Jacket", "Kurta", "Dress", "Shorts"],
    "Electronics":  ["Earbuds", "Smart Watch", "Phone Case", "Charger", "Power Bank", "Speaker"],
    "Accessories":  ["Sunglasses", "Belt", "Wallet", "Cap", "Scarf", "Watch"],
    "Sports":       ["Yoga Mat", "Dumbbell", "Resistance Band", "Skipping Rope", "Football", "Cricket Bat"],
    "Home":         ["Pillow", "Lamp", "Mug", "Notebook", "Pen Set", "Planner"],
}


def generate_stores(n: int) -> pd.DataFrame:
    """Create store master data."""
    stores = []
    for i in range(1, n + 1):
        city = CITIES[i % len(CITIES)]
        stores.append({"store_id": i, "name": f"Store-{i:03d}", "city": city})
    return pd.DataFrame(stores)


def generate_products(n: int) -> pd.DataFrame:
    """Create product master data with base prices."""
    products = []
    pid = 1
    per_category = n // len(CATEGORIES)
    for cat in CATEGORIES:
        names = PRODUCT_NAMES[cat]
        for j in range(per_category):
            name = names[j % len(names)]
            variant = j // len(names) + 1
            base_price = round(random.uniform(199, 4999), 2)
            products.append({
                "product_id": pid,
                "name": f"{name} v{variant}",
                "category": cat,
                "base_price": base_price,
            })
            pid += 1
    return pd.DataFrame(products)


def seasonal_factor(date: datetime, category: str) -> float:
    """Return a multiplier based on month/season for a given category."""
    month = date.month
    # Festival months (Oct–Dec) boost all; summer (Apr–Jun) boosts sports/apparel
    base = 1.0
    if month in [10, 11, 12]:   # Festive season
        base = 1.6
    elif month in [4, 5, 6]:    # Summer
        base = 1.3 if category in ["Sports", "Footwear", "Apparel"] else 1.1
    elif month in [1, 2]:       # Post-holiday dip
        base = 0.8
    # Add weekly pattern: weekend boost
    if date.weekday() >= 5:
        base *= 1.2
    return base


def generate_sales(stores: pd.DataFrame, products: pd.DataFrame) -> pd.DataFrame:
    """Generate daily sales records with realistic demand patterns."""
    dates = pd.date_range(START_DATE, END_DATE, freq="D")
    records = []

    # Sample a subset of store–product pairs to keep dataset manageable
    store_ids = stores["store_id"].tolist()
    product_rows = products.to_dict("records")

    print(f"Generating sales for {len(store_ids)} stores × {len(product_rows)} products × {len(dates)} days …")
    print("(Sampling ~10% of store–product combinations per day for efficiency)")

    for date in dates:
        # Each day, sample ~5% of store-product combos
        sampled_stores = random.sample(store_ids, max(1, len(store_ids) // 5))
        for sid in sampled_stores:
            sampled_products = random.sample(product_rows, max(1, len(product_rows) // 10))
            for prod in sampled_products:
                sf = seasonal_factor(date.to_pydatetime(), prod["category"])
                base_demand = random.randint(5, 80)
                promotion = 1 if random.random() < 0.15 else 0  # 15% chance of promo
                promo_boost = 1.4 if promotion else 1.0
                quantity = max(1, int(np.random.poisson(base_demand * sf * promo_boost)))
                # Price with occasional markdown
                price = round(prod["base_price"] * random.uniform(0.85, 1.05), 2)
                records.append({
                    "date": date.date(),
                    "store_id": sid,
                    "product_id": prod["product_id"],
                    "sales_quantity": quantity,
                    "price": price,
                    "promotion": promotion,
                })

    return pd.DataFrame(records)


def generate_inventory(stores: pd.DataFrame, products: pd.DataFrame) -> pd.DataFrame:
    """Generate current inventory levels."""
    rows = []
    for sid in stores["store_id"]:
        for pid in products["product_id"]:
            stock = random.randint(0, 300)
            rows.append({"store_id": sid, "product_id": pid, "current_stock": stock})
    return pd.DataFrame(rows)


def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))

    print("=== SmartRetail AI — Dataset Generator ===\n")

    stores = generate_stores(NUM_STORES)
    stores.to_csv(f"{out_dir}/stores.csv", index=False)
    print(f"✔ stores.csv          ({len(stores)} rows)")

    products = generate_products(NUM_PRODUCTS)
    products.to_csv(f"{out_dir}/products.csv", index=False)
    print(f"✔ products.csv        ({len(products)} rows)")

    sales = generate_sales(stores, products)
    sales.to_csv(f"{out_dir}/retail_sales.csv", index=False)
    print(f"✔ retail_sales.csv    ({len(sales):,} rows)")

    inventory = generate_inventory(stores, products)
    inventory.to_csv(f"{out_dir}/inventory.csv", index=False)
    print(f"✔ inventory.csv       ({len(inventory):,} rows)")

    print("\nDataset generation complete.")


if __name__ == "__main__":
    main()
