"""
data_sync.py  –  Orchestrates periodic data refresh

Flow:
  1. fetch_items()       from tarkov_api  (3 parallel HTTP calls)
  2. price_calculator.enrich()           (compute flea/trader arbitrage)
  3. bulk upsert into PostgreSQL

sync_state is a module-level dict exposed to GET /refresh/status.
"""

import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert

from ..models import Item
from ..database import SessionLocal, engine
from .tarkov_api import fetch_items
from .price_calculator import enrich

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level sync state — readable by GET /refresh/status
# ---------------------------------------------------------------------------
sync_state: dict = {
    "status":          "idle",
    "last_sync":       None,
    "items_synced":    0,
    "elapsed_seconds": None,
    "error":           None,
}


async def sync_data(db: Session | None = None) -> dict:
    """
    Full sync cycle.  Returns a summary dict.
    Can be called with an existing Session or without (opens its own).
    """
    _own_db = db is None
    if _own_db:
        db = SessionLocal()

    sync_state["status"] = "running"
    sync_state["error"]  = None
    started_at = datetime.now(timezone.utc)
    logger.info("[data_sync] Starting sync...")

    try:
        raw_items = await fetch_items()
        enriched  = [enrich(item) for item in raw_items]
        _upsert(enriched)

        elapsed = (datetime.now(timezone.utc) - started_at).total_seconds()
        summary = {
            "items_synced":    len(enriched),
            "elapsed_seconds": round(elapsed, 2),
            "synced_at":       started_at.isoformat(),
        }
        sync_state.update({
            "status":          "success",
            "last_sync":       started_at.isoformat(),
            "items_synced":    len(enriched),
            "elapsed_seconds": round(elapsed, 2),
            "error":           None,
        })
        logger.info(f"[data_sync] Sync complete: {summary}")
        return summary

    except Exception as exc:
        sync_state["status"] = "error"
        sync_state["error"]  = str(exc)
        logger.error(f"[data_sync] Sync failed: {exc}", exc_info=True)
        raise

    finally:
        if _own_db:
            db.close()


def _upsert(enriched: list[dict]) -> None:
    """
    Bulk upsert using raw SQLAlchemy Core + PostgreSQL INSERT ... ON CONFLICT.
    Uses engine directly to avoid SQLAlchemy 2.x db.bind=None issue.
    Chunks of 500 rows to stay under parameter limits.
    """
    if not enriched:
        return

    # Columns that can be updated (everything except primary key)
    update_cols = [c for c in enriched[0].keys() if c != "id"]

    with engine.begin() as conn:
        for start in range(0, len(enriched), 500):
            chunk = enriched[start: start + 500]
            stmt = pg_insert(Item).values(chunk)
            stmt = stmt.on_conflict_do_update(
                index_elements=["id"],
                set_={col: stmt.excluded[col] for col in update_cols},
            )
            conn.execute(stmt)

    logger.info(f"[data_sync] Upserted {len(enriched)} items")
