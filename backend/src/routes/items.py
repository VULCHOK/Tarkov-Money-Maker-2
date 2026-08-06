from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, Literal
from ..database import get_db
from ..models import Item, GAME_MODES
from ..schemas import ItemOut

router = APIRouter()

GameMode = Literal["regular", "pve", "pvp-season"]


@router.get("/", response_model=list[ItemOut])
def list_items(
    db: Session = Depends(get_db),
    mode: GameMode = Query("regular", description="Game mode: regular | pve | pvp-season"),
    recommendation: Optional[str] = Query(None),
    search: Optional[str] = Query(None, description="Search by name"),
    limit: int = Query(5000, ge=1, le=10000),
    offset: int = Query(0, ge=0),
):
    q = db.query(Item).filter(Item.mode == mode)

    if recommendation:
        q = q.filter(Item.recommendation == recommendation)
    if search:
        q = q.filter(or_(
            Item.name_en.ilike(f"%{search}%"),
            Item.name_fr.ilike(f"%{search}%"),
            Item.short_name_en.ilike(f"%{search}%"),
        ))

    return q.order_by(Item.difference_pct.desc().nullslast()).offset(offset).limit(limit).all()
