from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from .database import Base


class Item(Base):
    __tablename__ = "items"

    id = Column(String(24), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100))
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class TraderPrice(Base):
    __tablename__ = "trader_prices"

    item_id = Column(String(24), ForeignKey("items.id"), primary_key=True)
    trader_name = Column(String(50), primary_key=True)
    price = Column(Integer, nullable=False)
    currency = Column(String(3), default="RUB")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class MarketPrice(Base):
    __tablename__ = "market_prices"

    item_id = Column(String(24), ForeignKey("items.id"), primary_key=True)
    price = Column(Integer, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
