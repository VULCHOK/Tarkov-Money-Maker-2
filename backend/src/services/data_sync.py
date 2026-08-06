import json
import logging
from datetime import datetime, timezone

from sqlalchemy.dialects.sqlite import insert as sqlite_insert

from ..database import SessionLocal
from ..models import Item
from ..services.tarkov_api import fetch_items
from ..services.price_calculator import calculate_prices

logger = logging.getLogger(__name__)

_sync_status: dict = {
    "last_sync": None,
    "item_count": 0,
    "status": "never",
    "error": None,
}


def get_sync_status() -> dict:
    return dict(_sync_status)


async def sync_data() -> dict:
    global _sync_status
    logger.info("[data_sync] Starting sync...")
    try:
        raw_items = await fetch_items()

        # Guard: reject sync if names still look like placeholders
        sample_names = [i.get("name_en", "") for i in raw_items[:10]]
        placeholder_count = sum(1 for n in sample_names if n.endswith(" Name"))
        if placeholder_count >= 5:
            raise ValueError(
                f"tarkov.dev is serving placeholder data ({placeholder_count}/10 sample names "
                f"end with ' Name'). Skipping DB upsert to preserve existing data."
            )

        enriched = [calculate_prices(item) for item in raw_items]

        db = SessionLocal()
        try:
            upserted = 0
            for item in enriched:
                stmt = sqlite_insert(Item).values(
                    id=item["id"],
                    name_en=item.get("name_en", ""),
                    name_fr=item.get("name_fr"),
                    short_name_en=item.get("short_name_en"),
                    short_name_fr=item.get("short_name_fr"),
                    category=item.get("category"),
                    icon_link=item.get("icon_link"),
                    wiki_link=item.get("wiki_link"),
                    avg24h_price=item.get("avg24h_price"),
                    low24h_price=item.get("low24h_price"),
                    high24h_price=item.get("high24h_price"),
                    last_low_price=item.get("last_low_price"),
                    base_price=item.get("base_price"),
                    change_48h_pct=item.get("change_48h_pct"),
                    flea_price=item.get("flea_price"),
                    best_trader=item.get("best_trader"),
                    best_trader_price=item.get("best_trader_price"),
                    difference=item.get("difference"),
                    difference_pct=item.get("difference_pct"),
                    recommendation=item.get("recommendation"),
                    trader_prices=json.dumps(item.get("trader_prices", {})),
                )
                stmt = stmt.on_conflict_do_update(
                    index_elements=["id"],
                    set_={
                        "name_en": stmt.excluded.name_en,
                        "name_fr": stmt.excluded.name_fr,
                        "short_name_en": stmt.excluded.short_name_en,
                        "short_name_fr": stmt.excluded.short_name_fr,
                        "category": stmt.excluded.category,
                        "icon_link": stmt.excluded.icon_link,
                        "wiki_link": stmt.excluded.wiki_link,
                        "avg24h_price": stmt.excluded.avg24h_price,
                        "low24h_price": stmt.excluded.low24h_price,
                        "high24h_price": stmt.excluded.high24h_price,
                        "last_low_price": stmt.excluded.last_low_price,
                        "base_price": stmt.excluded.base_price,
                        "change_48h_pct": stmt.excluded.change_48h_pct,
                        "flea_price": stmt.excluded.flea_price,
                        "best_trader": stmt.excluded.best_trader,
                        "best_trader_price": stmt.excluded.best_trader_price,
                        "difference": stmt.excluded.difference,
                        "difference_pct": stmt.excluded.difference_pct,
                        "recommendation": stmt.excluded.recommendation,
                        "trader_prices": stmt.excluded.trader_prices,
                        "updated_at": datetime.now(timezone.utc),
                    },
                )
                db.execute(stmt)
                upserted += 1
            db.commit()
        finally:
            db.close()

        _sync_status = {
            "last_sync": datetime.now(timezone.utc).isoformat(),
            "item_count": upserted,
            "status": "ok",
            "error": None,
        }
        logger.info(f"[data_sync] Sync complete — {upserted} items upserted")
        return _sync_status

    except Exception as exc:
        _sync_status = {
            "last_sync": datetime.now(timezone.utc).isoformat(),
            "item_count": _sync_status.get("item_count", 0),
            "status": "error",
            "error": str(exc),
        }
        logger.error(f"[data_sync] Sync failed: {exc}")
        raise
