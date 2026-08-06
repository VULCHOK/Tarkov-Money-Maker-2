from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ItemOut(BaseModel):
    id:                    str
    mode:                  str
    normalized_name:       Optional[str]   = None
    name_en:               str
    name_fr:               Optional[str]   = None
    short_name_en:         Optional[str]   = None
    short_name_fr:         Optional[str]   = None
    category:              Optional[str]   = None
    types:                 Optional[str]   = None
    icon_link:             Optional[str]   = None
    wiki_link:             Optional[str]   = None
    width:                 Optional[int]   = None
    height:                Optional[int]   = None
    weight:                Optional[float] = None
    avg24h_price:          Optional[int]   = None
    low24h_price:          Optional[int]   = None
    high24h_price:         Optional[int]   = None
    last_low_price:        Optional[int]   = None
    last_offer_count:      Optional[int]   = None
    change_48h:            Optional[int]   = None
    change_48h_pct:        Optional[float] = None
    min_level_flea:        Optional[int]   = None
    base_price:            Optional[int]   = None
    # Trader SELL (trader rachète AU joueur)
    best_trader:           Optional[str]   = None
    best_trader_price:     Optional[int]   = None
    trader_prices:         Optional[str]   = None
    # Trader BUY (trader VEND au joueur)
    best_trader_buy:       Optional[str]   = None
    best_trader_buy_price: Optional[int]   = None
    trader_buy_prices:     Optional[str]   = None
    # Computed
    flea_price:            Optional[int]   = None
    difference:            Optional[int]   = None
    difference_pct:        Optional[float] = None
    flea_fee:              Optional[int]   = None
    recommendation:        Optional[str]   = None
    api_updated_at:        Optional[str]   = None
    updated_at:            Optional[datetime] = None

    class Config:
        from_attributes = True
