from pydantic import BaseModel
from typing import Optional


class ItemSchema(BaseModel):
    id: str
    name: str
    category: Optional[str] = None
    trader_prices: dict[str, int] = {}
    flea_price: Optional[int] = None
    best_trader_price: Optional[int] = None
    best_trader: Optional[str] = None
    difference: Optional[int] = None
    difference_pct: Optional[float] = None
    recommendation: Optional[str] = None

    class Config:
        from_attributes = True
