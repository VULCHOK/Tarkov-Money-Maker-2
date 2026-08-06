from sqlalchemy import Column, String, Integer, Float, DateTime, Text
from sqlalchemy.sql import func
from .database import Base


class Item(Base):
    """
    Single flat table — all price data stored directly on the item.
    Upserted every 10 minutes by data_sync.sync_data().
    """
    __tablename__ = "items"

    # Identity
    id         = Column(String(24),  primary_key=True, index=True)
    name       = Column(String(255), nullable=False)
    short_name = Column(String(50))
    category   = Column(String(100), index=True)
    icon_link  = Column(Text)
    wiki_link  = Column(Text)

    # Raw prices from tarkov.dev
    avg24h_price   = Column(Integer)
    low24h_price   = Column(Integer)
    high24h_price  = Column(Integer)
    last_low_price = Column(Integer)
    base_price     = Column(Integer)
    change_48h_pct = Column(Float)

    # Computed by price_calculator
    flea_price        = Column(Integer)
    best_trader       = Column(String(50))
    best_trader_price = Column(Integer)
    difference        = Column(Integer)
    difference_pct    = Column(Float)
    recommendation    = Column(String(20))   # BUY_FROM_TRADER | BUY_FROM_FLEA | FLEA_ONLY | TRADER_ONLY
    trader_prices     = Column(Text)          # JSON string {"Prapor": 1234, ...}

    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
