import asyncio
import httpx
from datetime import timezone
from fastapi import APIRouter
from sqlalchemy import func

from ..database import SessionLocal
from ..models import Item
from ..services.data_sync import sync_state, GAME_MODES
from ..services.tarkov_api import last_api_source
from ..scheduler import get_next_sync

router = APIRouter()


async def _probe_rest() -> str:
    """Quick health probe of json.tarkov.dev REST API (3s timeout)."""
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            resp = await client.get(
                "https://json.tarkov.dev/status",
                headers={"Accept": "application/json"},
            )
            return "online" if resp.status_code == 200 else "degraded"
    except Exception:
        return "offline"


def _mode_stats() -> dict:
    db = SessionLocal()
    try:
        counts = dict(
            db.query(Item.mode, func.count(Item.id))
            .group_by(Item.mode)
            .all()
        )
    finally:
        db.close()

    modes = {}
    for mode in GAME_MODES:
        state = sync_state[mode]
        modes[mode] = {
            "status":          state["status"],
            "last_sync":       state["last_sync"],
            "items_synced":    counts.get(mode, 0),
            "elapsed_seconds": state["elapsed_seconds"],
            "error":           state["error"],
        }
    return modes


@router.get("/")
async def get_status():
    rest_status = await _probe_rest()
    modes = _mode_stats()
    total_items = sum(m["items_synced"] for m in modes.values())

    has_error = any(m["status"] == "error" for m in modes.values())
    overall = "degraded" if has_error else rest_status

    last_syncs = [m["last_sync"] for m in modes.values() if m["last_sync"]]
    last_sync = max(last_syncs) if last_syncs else None

    # next_sync comes directly from APScheduler’s next fire time so it stays
    # accurate after restarts, retries, or any scheduler drift.
    next_fire = get_next_sync()
    next_sync = next_fire.astimezone(timezone.utc).isoformat() if next_fire else None

    return {
        "overall":          overall,
        "sources":          {"rest": rest_status},
        "last_sync":        last_sync,
        "next_sync":        next_sync,
        "last_error":       next((m["error"] for m in modes.values() if m["error"]), None),
        "items_synced":     total_items,
        "elapsed_seconds":  max((m["elapsed_seconds"] or 0) for m in modes.values()) or None,
        "api_source_used":  last_api_source,
        "modes":            modes,
    }
