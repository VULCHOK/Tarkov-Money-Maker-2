from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import TraderPrice

router = APIRouter()


@router.get("/")
def get_traders(db: Session = Depends(get_db)):
    rows = db.query(TraderPrice).all()
    grouped: dict[str, list] = {}
    for row in rows:
        grouped.setdefault(row.trader_name, []).append({
            "item_id": row.item_id,
            "price": row.price,
            "currency": row.currency,
        })
    return grouped
