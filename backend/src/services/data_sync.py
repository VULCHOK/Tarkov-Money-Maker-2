import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Item
from .tarkov_api import fetch_items
from .price_calculator import calculate_differences

logger = logging.getLogger(__name__)

# In-memory state (reset on container restart)
sync_state: dict = {
    "last_success": None,
    "last_error":   None,
    "item_count":   0,
    "in_progress":  False,
    "api_source":   "rest",
}


async def sync_data() -> None:
    """
    Fetch items from json.tarkov.dev and upsert them into the DB.
    Called by APScheduler every 10 minutes and on startup.
    Never raises — all errors are caught and logged.
    """
    if sync_state["in_progress"]:
        logger.info("Sync already in progress, skipping.")
        return

    sync_state["in_progress"] = True
    sync_state["last_error"] = None
    logger.info("[sync] Starting data sync from json.tarkov.dev...")

    try:
        raw_items = await fetch_items()
        enriched  = calculate_differences(raw_items)

        db: Session = SessionLocal()
        try:
            upserted = 0
            for item in enriched:
                db_item = db.get(Item, item["id"])
                if db_item:
                    # Update all price fields
                    db_item.name           = item["name"]
                    db_item.short_name     = item.get("short_name", "")
                    db_item.category       = item.get("category")
                    db_item.icon_link      = item.get("icon_link")
                    db_item.wiki_link      = item.get("wiki_link")
                    db_item.avg24h_price   = item.get("avg24h_price")
                    db_item.low24h_price   = item.get("low24h_price")
                    db_item.high24h_price  = item.get("high24h_price")
                    db_item.last_low_price = item.get("last_low_price")
                    db_item.base_price     = item.get("base_price")
                    db_item.change_48h_pct = item.get("change_48h_pct")
                    db_item.flea_price     = item.get("flea_price")
                    db_item.best_trader    = item.get("best_trader")
                    db_item.best_trader_price = item.get("best_trader_price")
                    db_item.difference     = item.get("difference")
                    db_item.difference_pct = item.get("difference_pct")
                    db_item.recommendation = item.get("recommendation")
                    db_item.trader_prices  = str(item.get("trader_prices", {}))
                else:
                    db.add(Item(
                        id             = item["id"],
                        name           = item["name"],
                        short_name     = item.get("short_name", ""),
                        category       = item.get("category"),
                        icon_link      = item.get("icon_link"),
                        wiki_link      = item.get("wiki_link"),
                        avg24h_price   = item.get("avg24h_price"),
                        low24h_price   = item.get("low24h_price"),
                        high24h_price  = item.get("high24h_price"),
                        last_low_price = item.get("last_low_price"),
                        base_price     = item.get("base_price"),
                        change_48h_pct = item.get("change_48h_pct"),
                        flea_price     = item.get("flea_price"),
                        best_trader    = item.get("best_trader"),
                        best_trader_price = item.get("best_trader_price"),
                        difference     = item.get("difference"),
                        difference_pct = item.get("difference_pct"),
                        recommendation = item.get("recommendation"),
                        trader_prices  = str(item.get("trader_prices", {})),
                    ))
                upserted += 1

            db.commit()
            sync_state["last_success"] = datetime.now(timezone.utc).isoformat()
            sync_state["item_count"]   = upserted
            logger.info(f"[sync] Complete — {upserted} items upserted.")

        finally:
            db.close()

    except Exception as e:
        msg = f"{type(e).__name__}: {e}"
        sync_state["last_error"] = msg
        logger.error(f"[sync] Failed: {msg}")
    finally:
        sync_state["in_progress"] = False
