"""
data_sync.py  –  Orchestrates periodic data refresh

Flow:
  1. fetch_items()  from tarkov_api  (3 parallel HTTP calls)
  2. price_calculator.enrich()       (compute flea/trader arbitrage)
  3. bulk upsert into DB
"""

import json
import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

from ..models import Item
from .tarkov_api import fetch_items
from .price_calculator import enrich

logger = logging.getLogger(__name__)


async def sync_data(db: Session) -> dict:
    """
    Full sync cycle. Returns a summary dict.
    Called by the scheduler every 10 minutes.
    """
    started_at = datetime.now(timezone.utc)
    logger.info("[data_sync] Starting sync...")

    # 1. Fetch raw items from API
    try:
        raw_items = await fetch_items()
    except Exception as exc:
        logger.error(f"[data_sync] fetch_items failed: {exc}")
        raise

    # 2. Enrich with price calculations
    enriched = [enrich(item) for item in raw_items]

    # 3. Bulk upsert (INSERT OR REPLACE for SQLite)
    try:
        for chunk_start in range(0, len(enriched), 500):
            chunk = enriched[chunk_start : chunk_start + 500]
            stmt = sqlite_insert(Item).values(chunk)
            stmt = stmt.on_conflict_do_update(
                index_elements=["id"],
                set_={k: stmt.excluded[k] for k in chunk[0] if k != "id"},
            )
            db.execute(stmt)
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error(f"[data_sync] DB upsert failed: {exc}")
        raise

    elapsed = (datetime.now(timezone.utc) - started_at).total_seconds()
    summary = {
        "items_synced": len(enriched),
        "elapsed_seconds": round(elapsed, 2),
        "synced_at": started_at.isoformat(),
    }
    logger.info(f"[data_sync] Sync complete: {summary}")
    return summary
