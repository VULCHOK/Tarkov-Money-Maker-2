"""
models.py  –  SQLAlchemy ORM models

Table `items`  —  PK = (id, mode)
Supporte 3 modes de jeu : regular (PVP), pve, pvp-season
"""

import json

from sqlalchemy import Column, String, Integer, Float, DateTime, Text, PrimaryKeyConstraint
from sqlalchemy.sql import func

from .database import Base

GAME_MODES = ["regular", "pve", "pvp-season"]


class Item(Base):
    __tablename__ = "items"
    __table_args__ = (
        PrimaryKeyConstraint("id", "mode"),
    )

    # ── Identity ─────────────────────────────────────────────────────────────────────────────────
    id              = Column(String(24),  nullable=False)
    mode            = Column(String(20),  nullable=False, default="regular")  # PK part 2
    normalized_name = Column(String(255), index=True)
    name_en         = Column(String(255), nullable=False, default="")
    name_fr         = Column(String(255), nullable=True)
    short_name_en   = Column(String(50),  nullable=True)
    short_name_fr   = Column(String(50),  nullable=True)
    category        = Column(String(100), index=True)
    types           = Column(String(255), nullable=True)
    icon_link       = Column(Text,        nullable=True)
    wiki_link       = Column(Text,        nullable=True)

    # ── Physical ─────────────────────────────────────────────────────────────────────────────
    width  = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    weight = Column(Float,   nullable=True)

    # ── Flea market prices ────────────────────────────────────────────────────────────────
    avg24h_price     = Column(Integer, nullable=True)
    low24h_price     = Column(Integer, nullable=True)
    high24h_price    = Column(Integer, nullable=True)
    last_low_price   = Column(Integer, nullable=True)
    last_offer_count = Column(Integer, nullable=True)
    change_48h       = Column(Integer, nullable=True)
    change_48h_pct   = Column(Float,   nullable=True)
    min_level_flea   = Column(Integer, nullable=True)

    # ── Trader data ────────────────────────────────────────────────────────────────────────
    base_price        = Column(Integer,     nullable=True)
    best_trader       = Column(String(50),  nullable=True)
    best_trader_price = Column(Integer,     nullable=True)
    trader_prices     = Column(Text,        nullable=True)  # JSON: {"Prapor": 1234, ...}

    # ── Computed ───────────────────────────────────────────────────────────────────────────────
    flea_price      = Column(Integer,     nullable=True)
    difference      = Column(Integer,     nullable=True)
    difference_pct  = Column(Float,       nullable=True)
    recommendation  = Column(String(20),  nullable=True)

    # ── Sync metadata ────────────────────────────────────────────────────────────────────────
    api_updated_at = Column(String(32),              nullable=True)
    updated_at     = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def trader_prices_dict(self) -> dict:
        if not self.trader_prices:
            return {}
        try:
            return json.loads(self.trader_prices)
        except Exception:
            return {}
