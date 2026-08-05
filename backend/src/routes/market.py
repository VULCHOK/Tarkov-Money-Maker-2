from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import MarketPrice

router = APIRouter()


@router.get("/")
def get_market(db: Session = Depends(get_db)):
    rows = db.query(MarketPrice).all()
    return [{"item_id": r.item_id, "price": r.price} for r in rows]
