from fastapi import APIRouter, BackgroundTasks
from ..services.data_sync import sync_data

router = APIRouter()


@router.post("/")
async def force_refresh(background_tasks: BackgroundTasks):
    background_tasks.add_task(sync_data)
    return {"message": "Refresh triggered. Data will be updated shortly."}
