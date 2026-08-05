import asyncio
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from .config import settings
from .services.data_sync import sync_data

logger = logging.getLogger(__name__)


def _run_sync():
    asyncio.run(sync_data())


def start_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        _run_sync,
        "interval",
        minutes=settings.refresh_interval_minutes,
        id="data_sync",
        replace_existing=True,
    )
    scheduler.start()
    # Trigger once at startup
    scheduler.add_job(_run_sync, "date", id="data_sync_startup", replace_existing=True)
    return scheduler
