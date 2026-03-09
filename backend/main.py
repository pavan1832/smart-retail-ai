"""
SmartRetail AI — FastAPI Application Entry Point
"""

from __future__ import annotations

import logging
import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure the project root is in sys.path when running directly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.routers.api import router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ── App factory ───────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(
        title       = "SmartRetail AI",
        description = "Demand Forecasting & Inventory Optimization Platform",
        version     = "1.0.0",
        docs_url    = "/docs",
        redoc_url   = "/redoc",
    )

    # CORS — allow React dev server and production origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://localhost:5173",
            "https://*.vercel.app",
        ],
        allow_credentials = True,
        allow_methods     = ["*"],
        allow_headers     = ["*"],
    )

    app.include_router(router, prefix="/api/v1")

    @app.get("/", tags=["Health"])
    def root():
        return {"service": "SmartRetail AI", "status": "ok", "version": "1.0.0"}

    @app.get("/health", tags=["Health"])
    def health():
        return {"status": "healthy"}

    return app


app = create_app()

# ── Dev runner ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
