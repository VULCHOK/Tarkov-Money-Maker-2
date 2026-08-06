import asyncio
import httpx
from fastapi import APIRouter
from sqlalchemy import func

from ..database import SessionLocal
from ..models import Item
from ..services.data_sync import sync_state
from ..services.tarkov_api import last_api_source

router = APIRouter()

GAME_MODES = ["regular", "pve", "pvp-season"]


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
        modes[mode] = {
            "status": sync_state.get("status"),
            "last_sync": sync_state.get("last_sync"),
            "items_synced": counts.get(mode, 0),
            "elapsed_seconds": sync_state.get("elapsed_seconds"),
            "error": sync_state.get("error"),
        }
    return modes


@router.get("/")
async def get_status():
    rest_status = await _probe_rest()
    modes = _mode_stats()
    total_items = sum(mode["items_synced"] for mode in modes.values())

    return {
        "overall": rest_status,
        "sources": {"rest": rest_status},
        "last_sync": sync_state.get("last_sync"),
        "last_error": sync_state.get("error"),
        "items_synced": total_items,
        "elapsed_seconds": sync_state.get("elapsed_seconds"),
        "api_source_used": last_api_source,
        "modes": modes,
    }
