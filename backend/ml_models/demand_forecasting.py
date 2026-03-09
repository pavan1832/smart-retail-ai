"""
SmartRetail AI — Demand Forecasting Module
Trains a RandomForestRegressor to predict 7-day product demand.
"""

from __future__ import annotations

import os
import logging
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "demand_model.pkl")
ENCODERS_PATH = os.path.join(os.path.dirname(__file__), "encoders.pkl")

# ── Feature Engineering ───────────────────────────────────────────────────────

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add temporal and lag features from raw sales data."""
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])

    # Temporal features
    df["day_of_week"]   = df["date"].dt.dayofweek        # 0=Mon … 6=Sun
    df["month"]         = df["date"].dt.month
    df["day_of_year"]   = df["date"].dt.dayofyear
    df["week_of_year"]  = df["date"].dt.isocalendar().week.astype(int)
    df["is_weekend"]    = (df["day_of_week"] >= 5).astype(int)
    df["quarter"]       = df["date"].dt.quarter

    # Seasonality proxy (sine/cosine encoding of day-of-year)
    df["sin_doy"] = np.sin(2 * np.pi * df["day_of_year"] / 365)
    df["cos_doy"] = np.cos(2 * np.pi * df["day_of_year"] / 365)

    return df


def aggregate_weekly(df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate daily sales to weekly totals per store–product pair."""
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df["week_start"] = df["date"].dt.to_period("W").apply(lambda p: p.start_time)

    weekly = (
        df.groupby(["store_id", "product_id", "week_start"])
        .agg(
            weekly_sales=("sales_quantity", "sum"),
            avg_price=("price", "mean"),
            promotion=("promotion", "max"),
        )
        .reset_index()
    )
    weekly["month"]        = weekly["week_start"].dt.month
    weekly["week_of_year"] = weekly["week_start"].dt.isocalendar().week.astype(int)
    weekly["quarter"]      = weekly["week_start"].dt.quarter
    weekly["sin_woy"]      = np.sin(2 * np.pi * weekly["week_of_year"] / 52)
    weekly["cos_woy"]      = np.cos(2 * np.pi * weekly["week_of_year"] / 52)
    return weekly


# ── Model Training ────────────────────────────────────────────────────────────

class DemandForecaster:
    """Wraps a RandomForestRegressor for retail demand prediction."""

    FEATURE_COLS = [
        "store_id_enc", "product_id_enc",
        "avg_price", "promotion",
        "month", "week_of_year", "quarter",
        "sin_woy", "cos_woy",
        "lag_1", "lag_2", "rolling_mean_4",
    ]

    def __init__(self) -> None:
        self.model: RandomForestRegressor | None = None
        self.store_enc   = LabelEncoder()
        self.product_enc = LabelEncoder()
        self._fitted     = False

    # ── Public API ────────────────────────────────────────────────────────────

    def train(self, sales_df: pd.DataFrame) -> dict:
        """Train on historical sales data and persist the model."""
        weekly = aggregate_weekly(sales_df)
        weekly = self._add_lag_features(weekly)
        weekly = self._encode_ids(weekly, fit=True)

        X = weekly[self.FEATURE_COLS]
        y = weekly["weekly_sales"]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        self.model = RandomForestRegressor(
            n_estimators=200,
            max_depth=15,
            min_samples_leaf=5,
            n_jobs=-1,
            random_state=42,
        )
        self.model.fit(X_train, y_train)
        self._fitted = True

        # Evaluate
        preds = self.model.predict(X_test)
        metrics = {
            "mae":      round(mean_absolute_error(y_test, preds), 2),
            "r2":       round(r2_score(y_test, preds), 4),
            "samples":  len(weekly),
        }
        logger.info("Model trained — MAE: %(mae)s | R²: %(r2)s", metrics)

        self._save()
        return metrics

    def predict(
        self,
        store_id: int | str,
        product_id: int | str,
        avg_price: float,
        promotion: int,
        reference_sales: list[float] | None = None,
    ) -> float:
        """Return predicted weekly demand (7-day units)."""
        self._ensure_loaded()

        lag1          = reference_sales[-1] if reference_sales else 50.0
        lag2          = reference_sales[-2] if reference_sales and len(reference_sales) >= 2 else 50.0
        rolling_mean4 = np.mean(reference_sales[-4:]) if reference_sales and len(reference_sales) >= 4 else 50.0

        import datetime
        today = datetime.date.today()
        week_of_year = int(today.strftime("%V"))
        month        = today.month
        quarter      = (month - 1) // 3 + 1

        # Encode IDs safely
        try:
            sid_enc = self.store_enc.transform([str(store_id)])[0]
        except ValueError:
            sid_enc = 0
        try:
            pid_enc = self.product_enc.transform([str(product_id)])[0]
        except ValueError:
            pid_enc = 0

        row = pd.DataFrame([{
            "store_id_enc":   sid_enc,
            "product_id_enc": pid_enc,
            "avg_price":      avg_price,
            "promotion":      promotion,
            "month":          month,
            "week_of_year":   week_of_year,
            "quarter":        quarter,
            "sin_woy":        np.sin(2 * np.pi * week_of_year / 52),
            "cos_woy":        np.cos(2 * np.pi * week_of_year / 52),
            "lag_1":          lag1,
            "lag_2":          lag2,
            "rolling_mean_4": rolling_mean4,
        }])

        pred = float(self.model.predict(row[self.FEATURE_COLS])[0])
        return max(0.0, round(pred, 1))

    # ── Private Helpers ───────────────────────────────────────────────────────

    def _add_lag_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.sort_values(["store_id", "product_id", "week_start"])
        grp = df.groupby(["store_id", "product_id"])["weekly_sales"]
        df["lag_1"]          = grp.shift(1).fillna(0)
        df["lag_2"]          = grp.shift(2).fillna(0)
        rolling = grp.shift(1).rolling(4, min_periods=1).mean()
        # reset_index drops MultiIndex levels that came from the groupby transform
        if isinstance(rolling.index, pd.MultiIndex):
            rolling = rolling.reset_index(level=[0, 1], drop=True)
        df["rolling_mean_4"] = rolling.fillna(0)
        return df

    def _encode_ids(self, df: pd.DataFrame, fit: bool = False) -> pd.DataFrame:
        df = df.copy()
        df["store_id"]   = df["store_id"].astype(str)
        df["product_id"] = df["product_id"].astype(str)
        if fit:
            df["store_id_enc"]   = self.store_enc.fit_transform(df["store_id"])
            df["product_id_enc"] = self.product_enc.fit_transform(df["product_id"])
        else:
            df["store_id_enc"]   = self.store_enc.transform(df["store_id"])
            df["product_id_enc"] = self.product_enc.transform(df["product_id"])
        return df

    def _save(self) -> None:
        joblib.dump(self.model, MODEL_PATH)
        joblib.dump({"store": self.store_enc, "product": self.product_enc}, ENCODERS_PATH)
        logger.info("Model saved to %s", MODEL_PATH)

    def _ensure_loaded(self) -> None:
        if self._fitted:
            return
        if os.path.exists(MODEL_PATH) and os.path.exists(ENCODERS_PATH):
            self.model = joblib.load(MODEL_PATH)
            encs = joblib.load(ENCODERS_PATH)
            self.store_enc   = encs["store"]
            self.product_enc = encs["product"]
            self._fitted = True
        else:
            raise RuntimeError(
                "Model not trained yet. Call POST /train or run train_model.py first."
            )


# ── Singleton ─────────────────────────────────────────────────────────────────
forecaster = DemandForecaster()
