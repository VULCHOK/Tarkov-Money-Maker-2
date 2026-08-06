from fastapi import APIRouter
from ..services.data_sync import sync_state
from ..services.tarkov_api import last_api_source
import httpx
import asyncio

router = APIRouter()


async def _probe_graphql() -> str:
    """Quick health probe of tarkov.dev GraphQL (3s timeout)."""
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            resp = await client.post(
                "https://api.tarkov.dev/graphql",
                json={"query": "{ items(limit:1) { id } }"},
                headers={"Content-Type": "application/json"},
            )
            if resp.status_code == 200:
                data = resp.json()
                if "errors" not in data:
                    return "online"
            return "degraded"
    except Exception:
        return "offline"


async def _probe_rest() -> str:
    """Quick health probe of json.tarkov.dev REST (3s timeout)."""
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            resp = await client.get(
                "https://json.tarkov.dev/items/prices",
                headers={"Accept": "application/json"},
            )
            return "online" if resp.status_code == 200 else "degraded"
    except Exception:
        return "offline"


@router.get("/")
async def get_status():
    """
    Returns real-time status of tarkov.dev services + last sync state.
    Called by the frontend every 30s to display the status indicator.
    """
    graphql_status, rest_status = await asyncio.gather(
        _probe_graphql(),
        _probe_rest(),
    )

    if graphql_status == "online":
        overall = "online"
    elif rest_status == "online":
        overall = "degraded"
    else:
        overall = "offline"

    return {
        "overall": overall,
        "sources": {
            "graphql": graphql_status,
            "rest":    rest_status,
        },
        # Fixed: use correct sync_state keys (last_sync / error, not last_success / last_error)
        "last_sync":       sync_state.get("last_sync"),
        "last_error":      sync_state.get("error"),
        "item_count":      sync_state.get("item_count", 0),
        "api_source_used": last_api_source,
    }
