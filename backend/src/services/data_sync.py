"""
data_sync.py  –  Orchestration du sync périodique

Flow:
  1. fetch_items()  (3 modes en parallèle)
  2. price_calculator.enrich()  (arbitrage par item)
  3. bulk upsert PostgreSQL  (PK = id + mode)
"""

import logging
from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import insert as pg_insert

from ..models import Item
from ..database import SessionLocal, engine
from .tarkov_api import fetch_items
from .price_calculator import enrich

logger = logging.getLogger(__name__)

sync_state: dict = {
    "status":          "idle",
    "last_sync":       None,
    "items_synced":    0,
    "elapsed_seconds": None,
    "error":           None,
}


async def sync_data() -> dict:
    sync_state["status"] = "running"
    sync_state["error"]  = None
    started_at = datetime.now(timezone.utc)
    logger.info("[data_sync] Starting sync (3 modes)...")

    try:
        raw_items = await fetch_items()          # regular + pve + pvp-season
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


def _upsert(enriched: list[dict]) -> None:
    if not enriched:
        return

    # Colonnes à mettre à jour (tout sauf la PK composite)
    update_cols = [c for c in enriched[0].keys() if c not in ("id", "mode")]

    with engine.begin() as conn:
        for start in range(0, len(enriched), 500):
            chunk = enriched[start: start + 500]
            stmt = pg_insert(Item).values(chunk)
            stmt = stmt.on_conflict_do_update(
                index_elements=["id", "mode"],
                set_={col: stmt.excluded[col] for col in update_cols},
            )
            conn.execute(stmt)

    logger.info(f"[data_sync] Upserted {len(enriched)} items")
