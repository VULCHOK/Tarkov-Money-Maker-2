import logging
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Item, TraderPrice, MarketPrice
from .tarkov_api import fetch_items
from .price_calculator import calculate_differences

logger = logging.getLogger(__name__)


async def sync_data():
    """Fetch data from tarkov.dev and upsert into the database."""
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
                    db.add(Item(id=item["id"], name=item["name"], category=item["category"]))

                for trader, price in item["trader_prices"].items():
                    tp = db.get(TraderPrice, (item["id"], trader))
                    if tp:
                        tp.price = price
                    else:
                        db.add(TraderPrice(item_id=item["id"], trader_name=trader, price=price))

                if item["flea_price"]:
                    mp = db.get(MarketPrice, item["id"])
                    if mp:
                        mp.price = item["flea_price"]
                    else:
                        db.add(MarketPrice(item_id=item["id"], price=item["flea_price"]))

            db.commit()
            logger.info(f"Sync complete. {len(enriched)} items processed.")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Sync failed: {e}")
        raise
