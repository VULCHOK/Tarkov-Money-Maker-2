from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ItemOut(BaseModel):
    id:                str
    name_en:           str
    name_fr:           Optional[str]   = None
    short_name_en:     Optional[str]   = None
    short_name_fr:     Optional[str]   = None
    category:          Optional[str]   = None
    icon_link:         Optional[str]   = None
    wiki_link:         Optional[str]   = None

    avg24h_price:      Optional[int]   = None
    low24h_price:      Optional[int]   = None
    high24h_price:     Optional[int]   = None
    last_low_price:    Optional[int]   = None
    base_price:        Optional[int]   = None
    change_48h_pct:    Optional[float] = None

    flea_price:        Optional[int]   = None
    best_trader:       Optional[str]   = None
    best_trader_price: Optional[int]   = None
    difference:        Optional[int]   = None
    difference_pct:    Optional[float] = None
    recommendation:    Optional[str]   = None
    trader_prices:     Optional[str]   = None   # raw JSON string

    updated_at:        Optional[datetime] = None

    class Config:
        from_attributes = True
