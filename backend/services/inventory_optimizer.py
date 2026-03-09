"""
SmartRetail AI — Inventory Optimization Engine
Rule-based optimizer that converts demand forecasts into restock recommendations.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class AlertLevel(str, Enum):
    OK       = "OK"
    LOW      = "LOW"
    CRITICAL = "CRITICAL"
    OVERSTOCK = "OVERSTOCK"


@dataclass
class InventoryRecommendation:
    store_id:           int | str
    product_id:         int | str
    product_name:       str
    current_stock:      int
    predicted_demand:   float
    recommended_restock: int
    safety_stock:       int
    alert_level:        AlertLevel
    reason:             str

    def to_dict(self) -> dict:
        return {
            "store_id":             self.store_id,
            "product_id":           self.product_id,
            "product_name":         self.product_name,
            "current_stock":        self.current_stock,
            "predicted_demand":     self.predicted_demand,
            "recommended_restock":  self.recommended_restock,
            "safety_stock":         self.safety_stock,
            "alert_level":          self.alert_level.value,
            "reason":               self.reason,
        }


class InventoryOptimizer:
    """
    Converts demand forecasts into actionable restock recommendations.

    Parameters
    ----------
    safety_factor   : multiplier applied to predicted demand to compute target stock.
                      e.g. 1.3 → order enough for 130 % of predicted demand.
    low_stock_ratio : if current_stock / predicted_demand < this, flag as LOW.
    critical_ratio  : if current_stock / predicted_demand < this, flag as CRITICAL.
    overstock_ratio : if current_stock / predicted_demand > this, flag as OVERSTOCK.
    lead_time_days  : assumed supplier lead time; used to buffer safety stock.
    """

    def __init__(
        self,
        safety_factor:   float = 1.30,
        low_stock_ratio: float = 0.50,
        critical_ratio:  float = 0.20,
        overstock_ratio: float = 2.50,
        lead_time_days:  int   = 3,
    ) -> None:
        self.safety_factor   = safety_factor
        self.low_stock_ratio = low_stock_ratio
        self.critical_ratio  = critical_ratio
        self.overstock_ratio = overstock_ratio
        self.lead_time_days  = lead_time_days

    # ── Public API ────────────────────────────────────────────────────────────

    def recommend(
        self,
        store_id:         int | str,
        product_id:       int | str,
        product_name:     str,
        current_stock:    int,
        predicted_demand: float,
    ) -> InventoryRecommendation:
        """
        Core optimization logic.

            safety_stock       = predicted_demand * (lead_time_days / 7)
            target_stock       = predicted_demand * safety_factor + safety_stock
            recommended_restock = max(0, target_stock - current_stock)
        """
        predicted_demand = max(predicted_demand, 0.0)
        daily_demand     = predicted_demand / 7.0
        safety_stock     = int(daily_demand * self.lead_time_days)
        target_stock     = int(predicted_demand * self.safety_factor + safety_stock)
        restock          = max(0, target_stock - current_stock)

        alert, reason = self._classify(current_stock, predicted_demand, restock)

        return InventoryRecommendation(
            store_id            = store_id,
            product_id          = product_id,
            product_name        = product_name,
            current_stock       = current_stock,
            predicted_demand    = round(predicted_demand, 1),
            recommended_restock = restock,
            safety_stock        = safety_stock,
            alert_level         = alert,
            reason              = reason,
        )

    def bulk_recommend(self, items: list[dict]) -> list[InventoryRecommendation]:
        """Process multiple store–product pairs at once."""
        return [
            self.recommend(
                store_id         = item["store_id"],
                product_id       = item["product_id"],
                product_name     = item.get("product_name", str(item["product_id"])),
                current_stock    = item["current_stock"],
                predicted_demand = item["predicted_demand"],
            )
            for item in items
        ]

    # ── Private ───────────────────────────────────────────────────────────────

    def _classify(
        self,
        current_stock:    int,
        predicted_demand: float,
        restock:          int,
    ) -> tuple[AlertLevel, str]:
        if predicted_demand == 0:
            return AlertLevel.OK, "No demand expected; no restock needed."

        ratio = current_stock / predicted_demand

        if ratio < self.critical_ratio:
            return (
                AlertLevel.CRITICAL,
                f"Stock covers only {ratio:.0%} of predicted demand — immediate restock of {restock} units required.",
            )
        if ratio < self.low_stock_ratio:
            return (
                AlertLevel.LOW,
                f"Stock covers {ratio:.0%} of predicted demand — restock {restock} units soon.",
            )
        if ratio > self.overstock_ratio:
            return (
                AlertLevel.OVERSTOCK,
                f"Stock is {ratio:.1f}× predicted demand — consider markdowns or redistribution.",
            )
        return (
            AlertLevel.OK,
            f"Stock healthy at {ratio:.0%} of predicted demand. Restocking {restock} units recommended.",
        )


# ── Singleton ─────────────────────────────────────────────────────────────────
optimizer = InventoryOptimizer()
