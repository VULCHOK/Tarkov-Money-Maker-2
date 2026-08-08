"""
models.py  –  SQLAlchemy ORM models

Table `items`  —  PK = (id, mode)
Table `item_history`  —  snapshot toutes les 10 min (flea_price + offer_count)
Supporte 3 modes de jeu : regular (PVP), pve, pvp-season

Noms localisés stockés en JSON :
  names       = {"en": "...", "fr": "...", ...}
  short_names = {"en": "...", "fr": "...", ...}
Actuellement peuplé en EN + FR ; extensible à toutes les langues tarkov.dev.
"""

import json

from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Text,
    BigInteger, Index, PrimaryKeyConstraint,
)
from sqlalchemy.sql import func

from .database import Base

GAME_MODES = ["regular", "pve", "pvp-season"]


class Item(Base):
    __tablename__ = "items"
    __table_args__ = (
        PrimaryKeyConstraint("id", "mode"),
    )

    # ── Identity ───────────────────────────────────────────────────────────────────
    id              = Column(String(24),  nullable=False)
    mode            = Column(String(20),  nullable=False, default="regular")
    normalized_name = Column(String(255), index=True)

    # Noms localisés — JSON {"en": "...", "fr": "...", <future langs>}
    names       = Column(Text, nullable=False, default="{}")
    short_names = Column(Text, nullable=True,  default="{}")

    category  = Column(String(100), index=True)
    types     = Column(String(255), nullable=True)
    icon_link = Column(Text,        nullable=True)
    wiki_link = Column(Text,        nullable=True)

    # ── Physical ──────────────────────────────────────────────────────────────────────
    width  = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    weight = Column(Float,   nullable=True)

    # ── Flea market prices ───────────────────────────────────────────────────────────
    avg24h_price     = Column(Integer, nullable=True)
    low24h_price     = Column(Integer, nullable=True)
    high24h_price    = Column(Integer, nullable=True)
    last_low_price   = Column(Integer, nullable=True)
    last_offer_count = Column(Integer, nullable=True)
    change_48h       = Column(Integer, nullable=True)
    change_48h_pct   = Column(Float,   nullable=True)
    min_level_flea   = Column(Integer, nullable=True)

    # ── Trader SELL data (trader rachète AU joueur) ──────────────────────────────────
    base_price        = Column(Integer,     nullable=True)
    best_trader       = Column(String(50),  nullable=True)
    best_trader_price = Column(Integer,     nullable=True)
    trader_prices     = Column(Text,        nullable=True)  # JSON: {"Prapor": 1234, ...}

    # ── Trader BUY data (trader VEND AU joueur) ────────────────────────────────────
    best_trader_buy       = Column(String(50),  nullable=True)
    best_trader_buy_price = Column(Integer,     nullable=True)
    trader_buy_prices     = Column(Text,        nullable=True)  # JSON: {"Mechanic": {"1": 5000}, ...}

    # ── Computed ────────────────────────────────────────────────────────────────────────
    flea_price     = Column(Integer,    nullable=True)
    difference     = Column(Integer,    nullable=True)
    difference_pct = Column(Float,      nullable=True)
    flea_fee       = Column(Integer,    nullable=True)
    recommendation = Column(String(20), nullable=True)

    # ── Sync metadata ─────────────────────────────────────────────────────────────────
    api_updated_at = Column(String(32),              nullable=True)
    updated_at     = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # ── Helpers ─────────────────────────────────────────────────────────────────────
    def names_dict(self) -> dict:
        try:
            return json.loads(self.names or "{}")
        except Exception:
            return {}

    def short_names_dict(self) -> dict:
        try:
            return json.loads(self.short_names or "{}")
        except Exception:
            return {}

    def trader_prices_dict(self) -> dict:
        try:
            return json.loads(self.trader_prices or "{}")
        except Exception:
            return {}

    def trader_buy_prices_dict(self) -> dict:
        try:
            return json.loads(self.trader_buy_prices or "{}")
        except Exception:
            return {}


class ItemHistory(Base):
    """
    Snapshot toutes les ~10 min de flea_price et last_offer_count.
    Conserve les 144 derniers points par (item_id, mode) = 24h à raison de
    6 syncs/heure.  Le nettoyage des vieilles lignes se fait dans data_sync.py.
    """
    __tablename__ = "item_history"
    __table_args__ = (
        # Lookup rapide : historique d'un item dans un mode, trié par temps
        Index("ix_item_history_item_mode_ts", "item_id", "mode", "ts"),
    )

    id          = Column(BigInteger, primary_key=True, autoincrement=True)
    item_id     = Column(String(24), nullable=False)
    mode        = Column(String(20), nullable=False, default="regular")
    # Timestamp UTC du snapshot (seconde-précision suffit)
    ts          = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    flea_price  = Column(Integer, nullable=True)
    offer_count = Column(Integer, nullable=True)
