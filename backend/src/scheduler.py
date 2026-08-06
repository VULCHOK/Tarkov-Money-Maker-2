import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from .services.data_sync import sync_data

logger = logging.getLogger(__name__)

_scheduler = AsyncIOScheduler()


def start_scheduler() -> None:
    """
    Start the APScheduler that runs sync_data() every 10 minutes.
    Also fires once immediately at startup so data is available right away.
    """
    _scheduler.add_job(
        sync_data,
        trigger=IntervalTrigger(minutes=10),
        id="sync_tarkov_data",
        replace_existing=True,
        max_instances=1,
    )
    _scheduler.start()
    logger.info("[scheduler] APScheduler started — sync every 10 minutes.")

    # Fire immediately — asyncio.create_task() replaces deprecated get_event_loop()
    asyncio.create_task(sync_data())
    logger.info("[scheduler] Initial sync triggered.")
