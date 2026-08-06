"""
models.py  –  SQLAlchemy ORM models

Single table `items` — rebuilt from scratch to match the real API structure.

Price logic:
  - flea market prices come from avg24hPrice / low24hPrice / high24hPrice
  - trader sell prices come from sellToTrader[].priceRUB  (we keep the best)
  - difference / recommendation are computed by the price_calculator service
"""

import json

from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Boolean
from sqlalchemy.sql import func

from .database import Base


class Item(Base):
    __tablename__ = "items"

    # ── Identity ──────────────────────────────────────────────────────────────
    id              = Column(String(24),  primary_key=True, index=True)
    normalized_name = Column(String(255), index=True)          # slug, e.g. "colt-m4a1-..."
    name_en         = Column(String(255), nullable=False, default="")
    name_fr         = Column(String(255), nullable=True)
    short_name_en   = Column(String(50),  nullable=True)
    short_name_fr   = Column(String(50),  nullable=True)
    category        = Column(String(100), index=True)          # normalizedName of primary category
    types           = Column(String(255), nullable=True)       # comma-separated e.g. "gun,wearable"
    icon_link       = Column(Text,        nullable=True)
    wiki_link       = Column(Text,        nullable=True)

    # ── Physical ──────────────────────────────────────────────────────────────
    width  = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    weight = Column(Float,   nullable=True)

    # ── Flea market prices (from API) ─────────────────────────────────────────
    avg24h_price     = Column(Integer, nullable=True)   # average flea price over 24h
    low24h_price     = Column(Integer, nullable=True)   # lowest flea price over 24h
    high24h_price    = Column(Integer, nullable=True)   # highest flea price over 24h
    last_low_price   = Column(Integer, nullable=True)   # last recorded low offer
    last_offer_count = Column(Integer, nullable=True)   # nb of active offers
    change_48h       = Column(Integer, nullable=True)   # absolute price change over 48h
    change_48h_pct   = Column(Float,   nullable=True)   # percentage price change over 48h
    min_level_flea   = Column(Integer, nullable=True)   # player level required to use flea

    # ── Base / trader data (from API) ─────────────────────────────────────────
    base_price        = Column(Integer, nullable=True)   # handbook base price
    best_trader       = Column(String(50),  nullable=True)  # trader name with best sell price
    best_trader_price = Column(Integer,     nullable=True)  # best sell price in RUB
    trader_prices     = Column(Text,        nullable=True)  # JSON: {"Prapor": 1234, ...}

    # ── Computed by price_calculator ──────────────────────────────────────────
    # flea_price = the price we'd actually pay to buy from flea (avg24h or last_low)
    flea_price      = Column(Integer, nullable=True)
    difference      = Column(Integer, nullable=True)   # flea_price - best_trader_price
    difference_pct  = Column(Float,   nullable=True)   # difference / best_trader_price * 100
    recommendation  = Column(String(20), nullable=True)
    # Possible values:
    #   BUY_FLEA_SELL_TRADER  – buy cheap on flea, sell to trader for profit
    #   BUY_TRADER_SELL_FLEA  – buy from trader, resell on flea for profit
    #   FLEA_ONLY             – no trader buy offer
    #   TRADER_ONLY           – not on flea market
    #   NO_PROFIT             – no interesting arbitrage

    # ── Sync metadata ─────────────────────────────────────────────────────────
    api_updated_at = Column(String(32),              nullable=True)  # ISO string from API
    updated_at     = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # ── Helpers ───────────────────────────────────────────────────────────────
    def trader_prices_dict(self) -> dict:
        if not self.trader_prices:
            return {}
        try:
            return json.loads(self.trader_prices)
        except Exception:
            return {}
