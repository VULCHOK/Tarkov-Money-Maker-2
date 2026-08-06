import asyncio
import httpx
from fastapi import APIRouter
from ..services.data_sync import sync_state
from ..services.tarkov_api import last_api_source

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


@router.get("/")
async def get_status():
    """
    Returns real-time status of json.tarkov.dev + last sync state.
    Called by the frontend every 30s.
    """
    rest_status = await _probe_rest()

    return {
        "overall":         rest_status,
        "sources":         {"rest": rest_status},
        "last_sync":       sync_state.get("last_sync"),
        "last_error":      sync_state.get("error"),
        "items_synced":    sync_state.get("items_synced", 0),
        "api_source_used": last_api_source,
    }
