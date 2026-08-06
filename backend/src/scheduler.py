import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from .services.data_sync import sync_data

logger = logging.getLogger(__name__)

_scheduler = AsyncIOScheduler()


async def _initial_sync_with_retry(max_attempts: int = 3, delay: float = 5.0) -> None:
    """
    Attempt sync_data() at startup up to `max_attempts` times.
    Retries with `delay` seconds between attempts to handle the case
    where the DB is not yet ready (migrations still running at boot).
    """
    for attempt in range(1, max_attempts + 1):
        try:
            await sync_data()
            logger.info(f"[scheduler] Initial sync succeeded on attempt {attempt}.")
            return
        except Exception as exc:
            logger.warning(
                f"[scheduler] Initial sync attempt {attempt}/{max_attempts} failed: {exc}"
            )
            if attempt < max_attempts:
                await asyncio.sleep(delay)
    logger.error(
        "[scheduler] Initial sync failed after all attempts — "
        "data will be available after the first scheduled run (10 min)."
    )


def start_scheduler() -> None:
    """
    Start the APScheduler that runs sync_data() every 10 minutes.
    Also fires once immediately at startup (with retry) so data is
    available right away even if the DB needs a few seconds to warm up.
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

    asyncio.create_task(_initial_sync_with_retry())
    logger.info("[scheduler] Initial sync triggered (with retry).")
