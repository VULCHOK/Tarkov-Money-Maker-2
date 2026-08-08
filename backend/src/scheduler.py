import asyncio
import logging
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from .services.data_sync import sync_data

logger = logging.getLogger(__name__)

_scheduler = AsyncIOScheduler()

SYNC_INTERVAL_MINUTES = 10


def get_next_sync() -> datetime | None:
    """Return the APScheduler next fire time for the sync job, or None."""
    job = _scheduler.get_job("sync_tarkov_data")
    return job.next_run_time if job else None


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
        f"[scheduler] Initial sync failed after all attempts — "
        f"data will be available after the first scheduled run ({SYNC_INTERVAL_MINUTES} min)."
    )


def start_scheduler() -> None:
    """
    Start the APScheduler that runs sync_data() every SYNC_INTERVAL_MINUTES minutes.
    Also fires once immediately at startup (with retry) so data is
    available right away even if the DB needs a few seconds to warm up.
    """
    _scheduler.add_job(
        sync_data,
        trigger=IntervalTrigger(minutes=SYNC_INTERVAL_MINUTES),
        id="sync_tarkov_data",
        replace_existing=True,
        max_instances=1,
    )
    _scheduler.start()
    logger.info(f"[scheduler] APScheduler started — sync every {SYNC_INTERVAL_MINUTES} minutes.")

    asyncio.create_task(_initial_sync_with_retry())
    logger.info("[scheduler] Initial sync triggered (with retry).")
