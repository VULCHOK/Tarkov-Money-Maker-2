"""
data_sync.py  –  Orchestration du sync périodique

Flow:
  1. fetch_items()  (3 modes en parallèle)
  2. price_calculator.enrich()  (arbitrage par item)
  3. bulk upsert PostgreSQL  (PK = id + mode)
  4. snapshot item_history  (flea_price + offer_count)
  5. purge des snapshots > 24h
"""

import logging
from datetime import datetime, timezone, timedelta

from sqlalchemy.dialects.postgresql import insert as pg_insert

from ..models import Item, ItemHistory
from ..database import SessionLocal, engine
from .tarkov_api import fetch_items
from .price_calculator import enrich

logger = logging.getLogger(__name__)

GAME_MODES = ["regular", "pve", "pvp-season"]

# État par mode : { "regular": {...}, "pve": {...}, "pvp-season": {...} }
sync_state: dict = {
    mode: {
        "status":          "idle",
        "last_sync":       None,
        "items_synced":    0,
        "elapsed_seconds": None,
        "error":           None,
    }
    for mode in GAME_MODES
}

# Nombre de points à conserver par (item, mode) — 144 = 24h × 6 syncs/h
HISTORY_POINTS = 144
# TTL absolu de sécurité : on purge tout ce qui dépasse 26h
HISTORY_TTL_HOURS = 26


async def sync_data() -> dict:
    # Marquer tous les modes comme "running"
    for mode in GAME_MODES:
        sync_state[mode]["status"] = "running"
        sync_state[mode]["error"]  = None

    started_at = datetime.now(timezone.utc)
    logger.info("[data_sync] Starting sync (3 modes)...")

    try:
        raw_items = await fetch_items()          # regular + pve + pvp-season
        enriched  = [enrich(item) for item in raw_items]
        _upsert(enriched)
        _snapshot_history(enriched, started_at)
        _purge_old_history(started_at)

        elapsed = round((datetime.now(timezone.utc) - started_at).total_seconds(), 2)

        # Compter les items par mode
        counts_by_mode: dict[str, int] = {m: 0 for m in GAME_MODES}
        for item in enriched:
            m = item.get("mode")
            if m in counts_by_mode:
                counts_by_mode[m] += 1

        for mode in GAME_MODES:
            sync_state[mode].update({
                "status":          "success",
                "last_sync":       started_at.isoformat(),
                "items_synced":    counts_by_mode[mode],
                "elapsed_seconds": elapsed,
                "error":           None,
            })

        summary = {"items_synced": len(enriched), "elapsed_seconds": elapsed}
        logger.info(f"[data_sync] Sync complete: {summary}")
        return summary

    except Exception as exc:
        for mode in GAME_MODES:
            sync_state[mode]["status"] = "error"
            sync_state[mode]["error"]  = str(exc)
        logger.error(f"[data_sync] Sync failed: {exc}", exc_info=True)
        raise


def _upsert(enriched: list[dict]) -> None:
    if not enriched:
        return

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


def _snapshot_history(enriched: list[dict], ts: datetime) -> None:
    """
    Insère un snapshot ItemHistory pour chaque item enrichi.
    On ne snapshote que les items PVP (regular) car la flea n'existe pas en PVE.
    Pour être complet on stocke quand même tous les modes — le frontend filtrera.
    """
    if not enriched:
        return

    rows = [
        {
            "item_id":     item["id"],
            "mode":        item.get("mode", "regular"),
            "ts":          ts,
            "flea_price":  item.get("flea_price") or item.get("last_low_price"),
            "offer_count": item.get("last_offer_count"),
        }
        for item in enriched
        # Ne stocker que si au moins une des deux valeurs est présente
        if item.get("flea_price") is not None
        or item.get("last_low_price") is not None
        or item.get("last_offer_count") is not None
    ]

    if not rows:
        return

    with engine.begin() as conn:
        for start in range(0, len(rows), 500):
            conn.execute(
                pg_insert(ItemHistory).values(rows[start: start + 500])
            )

    logger.info(f"[data_sync] Snapshotted {len(rows)} history rows")


def _purge_old_history(now: datetime) -> None:
    """
    Supprime les snapshots de plus de HISTORY_TTL_HOURS heures.
    Simple DELETE par timestamp — rapide grâce à l'index sur (item_id, mode, ts).
    """
    cutoff = now - timedelta(hours=HISTORY_TTL_HOURS)
    with engine.begin() as conn:
        result = conn.execute(
            ItemHistory.__table__.delete().where(ItemHistory.ts < cutoff)
        )
        deleted = result.rowcount
    if deleted:
        logger.info(f"[data_sync] Purged {deleted} history rows older than {HISTORY_TTL_HOURS}h")
