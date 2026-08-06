import asyncio
from fastapi import APIRouter
from ..services.data_sync import sync_data, sync_state

router = APIRouter()


@router.post("/")
async def force_refresh():
    """
    Trigger an immediate data refresh from tarkov.dev.
    Runs in the background — response is immediate.
    Poll GET /refresh/status to track progress.
    """
    asyncio.create_task(sync_data())   # no db arg -> data_sync opens its own session
    return {"message": "Refresh triggered. Poll GET /refresh/status for progress."}


@router.get("/status")
def get_sync_status():
    """Returns the current sync state (idle | running | success | error)."""
    return sync_state
