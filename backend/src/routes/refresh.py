import asyncio
from fastapi import APIRouter
from ..services.data_sync import sync_data, sync_state

router = APIRouter()


@router.post("/")
async def force_refresh():
    """Trigger an immediate data refresh from tarkov.dev.

    Uses asyncio.create_task so the HTTP response is returned immediately
    and the sync runs in the background without crashing the ASGI worker.
    """
    asyncio.create_task(sync_data())
    return {"message": "Refresh triggered. Poll GET /refresh/status for progress."}


@router.get("/status")
def get_sync_status():
    """Returns the current sync state — use this to diagnose issues."""
    return sync_state
