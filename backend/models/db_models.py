"""
SmartRetail AI — SQLAlchemy ORM Models
"""

from __future__ import annotations

from datetime import date
from sqlalchemy import (
    Column, Integer, String, Float, Date, ForeignKey, Boolean, create_engine
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class Store(Base):
    __tablename__ = "stores"

    id   = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)

    sales     = relationship("Sale",      back_populates="store")
    inventory = relationship("Inventory", back_populates="store")


class Product(Base):
    __tablename__ = "products"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(200), nullable=False)
    category   = Column(String(100), nullable=False)
    base_price = Column(Float, nullable=False)

    sales     = relationship("Sale",      back_populates="product")
    inventory = relationship("Inventory", back_populates="product")


class Sale(Base):
    __tablename__ = "sales"

    id             = Column(Integer, primary_key=True, index=True)
    date           = Column(Date,    nullable=False, index=True)
    store_id       = Column(Integer, ForeignKey("stores.id"),   nullable=False)
    product_id     = Column(Integer, ForeignKey("products.id"), nullable=False)
    sales_quantity = Column(Integer, nullable=False)
    price          = Column(Float,   nullable=False)
    promotion      = Column(Boolean, nullable=False, default=False)

    store   = relationship("Store",   back_populates="sales")
    product = relationship("Product", back_populates="sales")


class Inventory(Base):
    __tablename__ = "inventory"

    id            = Column(Integer, primary_key=True, index=True)
    store_id      = Column(Integer, ForeignKey("stores.id"),   nullable=False)
    product_id    = Column(Integer, ForeignKey("products.id"), nullable=False)
    current_stock = Column(Integer, nullable=False, default=0)

    store   = relationship("Store",   back_populates="inventory")
    product = relationship("Product", back_populates="inventory")
