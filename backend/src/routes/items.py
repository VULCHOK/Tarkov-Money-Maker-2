from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from ..database import SessionLocal
from ..models import Item
from ..schemas import ItemOut

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=list[ItemOut])
def list_items(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None, description="Filter by category name"),
    min_profit_pct: Optional[float] = Query(None, description="Min difference_pct threshold"),
    recommendation: Optional[str] = Query(None, description="BUY_FROM_TRADER | BUY_FROM_FLEA | FLEA_ONLY | TRADER_ONLY"),
    search: Optional[str] = Query(None, description="Search by name_en or name_fr"),
    limit: int = Query(5000, ge=1, le=10000),
    offset: int = Query(0, ge=0),
):
    q = db.query(Item)

    if category:
        q = q.filter(Item.category == category)
    if recommendation:
        q = q.filter(Item.recommendation == recommendation)
    if min_profit_pct is not None:
        q = q.filter(Item.difference_pct >= min_profit_pct)
    if search:
        q = q.filter(or_(
            Item.name_en.ilike(f"%{search}%"),
            Item.name_fr.ilike(f"%{search}%"),
            Item.short_name_en.ilike(f"%{search}%"),
        ))

    return q.order_by(Item.difference_pct.desc().nullslast()).offset(offset).limit(limit).all()


@router.get("/categories", response_model=list[str])
def list_categories(db: Session = Depends(get_db)):
    rows = db.query(Item.category).filter(Item.category.isnot(None)).distinct().all()
    return sorted([r[0] for r in rows])
