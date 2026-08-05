import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Item, TraderPrice, MarketPrice
from .tarkov_api import fetch_items
from .price_calculator import calculate_differences

logger = logging.getLogger(__name__)

# In-memory sync state (reset on container restart)
sync_state: dict = {
    "last_success": None,   # ISO datetime string
    "last_error": None,     # error message string
    "item_count": 0,
    "in_progress": False,
}


async def sync_data() -> None:
    """Fetch data from tarkov.dev and upsert into the database.

    Never raises — safe to call from BackgroundTask or APScheduler.
    """
    if sync_state["in_progress"]:
        logger.info("Sync already in progress, skipping.")
        return

    sync_state["in_progress"] = True
    sync_state["last_error"] = None
    logger.info("Starting data sync from tarkov.dev...")

    try:
        raw_items = await fetch_items()
        enriched = calculate_differences(raw_items)

        db: Session = SessionLocal()
        try:
            for item in enriched:
                db_item = db.get(Item, item["id"])
                if db_item:
                    db_item.name = item["name"]
                    db_item.category = item["category"]
                else:
                    db.add(Item(
                        id=item["id"],
                        name=item["name"],
                        category=item["category"],
                    ))

                for trader, price in item["trader_prices"].items():
                    tp = db.get(TraderPrice, (item["id"], trader))
                    if tp:
                        tp.price = price
                    else:
                        db.add(TraderPrice(
                            item_id=item["id"],
                            trader_name=trader,
                            price=price,
                        ))

                if item["flea_price"]:
                    mp = db.get(MarketPrice, item["id"])
                    if mp:
                        mp.price = item["flea_price"]
                    else:
                        db.add(MarketPrice(
                            item_id=item["id"],
                            price=item["flea_price"],
                        ))

            db.commit()
            sync_state["last_success"] = datetime.now(timezone.utc).isoformat()
            sync_state["item_count"] = len(enriched)
            logger.info(f"Sync complete. {len(enriched)} items processed.")
        finally:
            db.close()

    except Exception as e:
        # Catch everything — never crash BackgroundTask or APScheduler
        error_msg = f"{type(e).__name__}: {e}"
        sync_state["last_error"] = error_msg
        logger.error(f"Sync failed: {error_msg}")
    finally:
        sync_state["in_progress"] = False
