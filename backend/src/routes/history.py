"""
routes/history.py

GET /api/items/{item_id}/history?mode=regular

Retourne les derniers HISTORY_POINTS snapshots (max 144 = 24h)
pour un item donné, triés du plus ancien au plus récent.

Réponse JSON :
{
  "item_id": "...",
  "mode": "regular",
  "points": [
    { "ts": "2026-08-08T20:00:00Z", "flea_price": 12000, "offer_count": 34 },
    ...
  ]
}
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from ..database import SessionLocal
from ..models import ItemHistory
from ..services.data_sync import HISTORY_POINTS

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/{item_id}/history")
def get_item_history(
    item_id: str,
    mode: str = Query(default="regular", regex="^(regular|pve|pvp-season)$"),
    db: Session = Depends(get_db),
):
    rows = (
        db.execute(
            select(ItemHistory)
            .where(ItemHistory.item_id == item_id, ItemHistory.mode == mode)
            .order_by(desc(ItemHistory.ts))
            .limit(HISTORY_POINTS)
        )
        .scalars()
        .all()
    )

    # Retourner du plus ancien au plus récent (ordre chronologique pour les graphiques)
    rows = list(reversed(rows))

    return {
        "item_id": item_id,
        "mode":    mode,
        "points": [
            {
                "ts":          r.ts.isoformat(),
                "flea_price":  r.flea_price,
                "offer_count": r.offer_count,
            }
            for r in rows
        ],
    }
