"""
data_sync.py  –  Orchestrates periodic data refresh

Flow:
  1. fetch_items()  from tarkov_api  (3 parallel HTTP calls)
  2. price_calculator.enrich()       (compute flea/trader arbitrage)
  3. bulk upsert into DB

sync_state is a module-level dict exposed to GET /refresh/status.
"""

import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from ..models import Item
from ..database import SessionLocal
from .tarkov_api import fetch_items
from .price_calculator import enrich

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level sync state — readable by the /refresh/status endpoint
# ---------------------------------------------------------------------------
sync_state: dict = {
    "status":        "idle",      # idle | running | success | error
    "last_sync":     None,
    "items_synced":  0,
    "elapsed_seconds": None,
    "error":         None,
}


async def sync_data(db: Session | None = None) -> dict:
    """
    Full sync cycle. Returns a summary dict.
    Called by the scheduler (passes its own db session) or directly
    from the /refresh/ route (no session — we open one internally).
    """
    _own_db = db is None
    if _own_db:
        db = SessionLocal()

    sync_state["status"] = "running"
    sync_state["error"]  = None
    started_at = datetime.now(timezone.utc)
    logger.info("[data_sync] Starting sync...")

    try:
        # 1. Fetch
        raw_items = await fetch_items()

        # 2. Enrich
        enriched = [enrich(item) for item in raw_items]

        # 3. Upsert in chunks of 500
        _upsert(db, enriched)

        elapsed = (datetime.now(timezone.utc) - started_at).total_seconds()
        summary = {
            "items_synced":   len(enriched),
            "elapsed_seconds": round(elapsed, 2),
            "synced_at":      started_at.isoformat(),
        }
        sync_state.update({
            "status":         "success",
            "last_sync":      started_at.isoformat(),
            "items_synced":   len(enriched),
            "elapsed_seconds": round(elapsed, 2),
            "error":          None,
        })
        logger.info(f"[data_sync] Sync complete: {summary}")
        return summary

    except Exception as exc:
        db.rollback()
        sync_state["status"] = "error"
        sync_state["error"]  = str(exc)
        logger.error(f"[data_sync] Sync failed: {exc}")
        raise

    finally:
        if _own_db:
            db.close()


def _upsert(db: Session, enriched: list[dict]) -> None:
    """Bulk upsert using SQLAlchemy core. Works with both SQLite and PostgreSQL."""
    if not enriched:
        return

    from sqlalchemy import inspect as sa_inspect
    from sqlalchemy.dialects.postgresql import insert as pg_insert
    from sqlalchemy import text

    # Detect dialect
    dialect = db.bind.dialect.name if db.bind else ""

    try:
        if dialect == "postgresql":
            from sqlalchemy.dialects.postgresql import insert as pg_insert
            for chunk_start in range(0, len(enriched), 500):
                chunk = enriched[chunk_start: chunk_start + 500]
                stmt = pg_insert(Item).values(chunk)
                stmt = stmt.on_conflict_do_update(
                    index_elements=["id"],
                    set_={k: stmt.excluded[k] for k in chunk[0] if k != "id"},
                )
                db.execute(stmt)
        else:
            # SQLite fallback: merge via ORM
            for item_data in enriched:
                db.merge(Item(**item_data))

        db.commit()

    except Exception:
        db.rollback()
        raise
