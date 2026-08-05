from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models import Item, TraderPrice, MarketPrice
from ..schemas import ItemSchema

router = APIRouter()


def _build_item_response(db: Session, category: Optional[str], min_profit_pct: Optional[float]) -> list[dict]:
    query = db.query(Item)
    if category:
        query = query.filter(Item.category.ilike(f"%{category}%"))
    items = query.all()

    result = []
    for item in items:
        trader_prices = {
            tp.trader_name: tp.price
            for tp in db.query(TraderPrice).filter(TraderPrice.item_id == item.id).all()
        }
        mp = db.query(MarketPrice).filter(MarketPrice.item_id == item.id).first()
        flea_price = mp.price if mp else None

        best_trader = min(trader_prices, key=trader_prices.get) if trader_prices else None
        best_trader_price = trader_prices[best_trader] if best_trader else None

        difference = None
        difference_pct = None
        recommendation = None

        if flea_price and best_trader_price:
            difference = flea_price - best_trader_price
            difference_pct = round((difference / best_trader_price) * 100, 2)
            recommendation = "BUY_FROM_TRADER" if difference > 0 else "BUY_FROM_FLEA"

        row = {
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "trader_prices": trader_prices,
            "flea_price": flea_price,
            "best_trader_price": best_trader_price,
            "best_trader": best_trader,
            "difference": difference,
            "difference_pct": difference_pct,
            "recommendation": recommendation,
        }

        if min_profit_pct is not None and (difference_pct is None or difference_pct < min_profit_pct):
            continue

        result.append(row)

    return sorted(result, key=lambda x: (x["difference_pct"] or 0), reverse=True)


@router.get("/", response_model=list[ItemSchema])
def get_items(
    category: Optional[str] = Query(None, description="Filter by category"),
    min_profit_pct: Optional[float] = Query(None, description="Minimum profit percentage"),
    db: Session = Depends(get_db),
):
    return _build_item_response(db, category, min_profit_pct)


@router.get("/{item_id}", response_model=ItemSchema)
def get_item(item_id: str, db: Session = Depends(get_db)):
    rows = _build_item_response(db, None, None)
    for row in rows:
        if row["id"] == item_id:
            return row
    raise HTTPException(status_code=404, detail="Item not found")
