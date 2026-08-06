"""
tarkov_api.py  –  Fetches data from json.tarkov.dev

Real API structure (verified 2026-08-06):
  GET /regular/items
    └─ data.items          : dict { id -> item_object }
    └─ data.itemCategories : dict { id -> { id, normalizedName, parent, children } }
    └─ data.fleaMarket     : { minPlayerLevel, enabled, ... }

  item_object sell prices:
    sellToTrader[]  : [{ trader (ID), priceRUB, currency }]
    buyFromTrader[] : [{ trader (ID), priceRUB, currency, minTraderLevel }]

  GET /regular/items_en  /  /regular/items_fr  (etc.)
    └─ data : flat dict { "<id> Name" -> "...", "<id> ShortName" -> "..." }

  Note: item.name and itemCategory.name are placeholder strings like
  "5447a9cd... Name" — always use translation dicts for display names.
"""

import asyncio
import logging

import httpx

logger = logging.getLogger(__name__)

BASE_URL = "https://json.tarkov.dev"

# Exposed to status.py for display in the /status endpoint
last_api_source: str = "rest"

# Trader ID -> display name
TRADER_ID_TO_NAME: dict[str, str] = {
    "54cb50c76803fa8b248b4571": "Prapor",
    "54cb57776803fa99248b456e": "Therapist",
    "579dc571d53a0658a154fbec": "Fence",
    "58330581ace78e27b8b10cee": "Skier",
    "5935c25fb3acc3127c3d8cd9": "Peacekeeper",
    "5a7c2eca46aef81a7ca2145d": "Mechanic",
    "5ac3b934156ae10c4430e83c": "Ragman",
    "5c0647fdd443bc2504c2d371": "Jaeger",
    "6617beeaa9cfa777ca915b7c": "Lightkeeper",
}


def _get_data(resp_json: dict) -> dict:
    return resp_json.get("data", resp_json)


def _best_sell_to_trader(sell_list: list[dict]) -> tuple[str | None, int | None]:
    """
    From sellToTrader[], return (trader_name, best_priceRUB).
    Ignores Fence (always lowest).
    """
    best_name  = None
    best_price = 0
    for entry in sell_list:
        trader_id   = entry.get("trader", "")
        trader_name = TRADER_ID_TO_NAME.get(trader_id)
        if not trader_name or trader_name == "Fence":
            continue
        price_rub = entry.get("priceRUB") or 0
        if price_rub > best_price:
            best_price = price_rub
            best_name  = trader_name
    return (best_name, best_price if best_price > 0 else None)


def _all_sell_prices(sell_list: list[dict]) -> dict[str, int]:
    """Return { trader_name: priceRUB } for all traders in sellToTrader[]."""
    result: dict[str, int] = {}
    for entry in sell_list:
        trader_id   = entry.get("trader", "")
        trader_name = TRADER_ID_TO_NAME.get(trader_id)
        price_rub   = entry.get("priceRUB") or 0
        if trader_name and price_rub > 0:
            if price_rub > result.get(trader_name, 0):
                result[trader_name] = price_rub
    return result


def _normalize_item(
    item: dict,
    trans_en: dict,
    trans_fr: dict,
    item_categories: dict,
) -> dict:
    import json as _json
    item_id = item["id"]

    name_en       = trans_en.get(f"{item_id} Name",      "")
    name_fr       = trans_fr.get(f"{item_id} Name",      name_en)
    short_name_en = trans_en.get(f"{item_id} ShortName", "")
    short_name_fr = trans_fr.get(f"{item_id} ShortName", short_name_en)

    category_slug = None
    for cat_id in item.get("categories", []):
        cat = item_categories.get(cat_id)
        if cat:
            category_slug = cat.get("normalizedName")
            break

    sell_list = item.get("sellToTrader", [])
    best_trader, best_trader_price = _best_sell_to_trader(sell_list)
    trader_prices_json = _json.dumps(_all_sell_prices(sell_list))

    return {
        "id":              item_id,
        "name_en":         name_en,
        "name_fr":         name_fr,
        "short_name_en":   short_name_en,
        "short_name_fr":   short_name_fr,
        "normalized_name": item.get("normalizedName"),
        "category":        category_slug,
        "types":           ",".join(item.get("types", [])),
        "icon_link":       item.get("iconLink"),
        "wiki_link":       item.get("wikiLink") or item.get("link"),
        "avg24h_price":    item.get("avg24hPrice"),
        "low24h_price":    item.get("low24hPrice"),
        "high24h_price":   item.get("high24hPrice"),
        "last_low_price":  item.get("lastLowPrice"),
        "last_offer_count": item.get("lastOfferCount"),
        "change_48h":      item.get("changeLast48h"),
        "change_48h_pct":  item.get("changeLast48hPercent"),
        "min_level_flea":  item.get("minLevelForFlea"),
        "base_price":      item.get("basePrice"),
        "width":           item.get("width"),
        "height":          item.get("height"),
        "weight":          item.get("weight"),
        "best_trader":       best_trader,
        "best_trader_price": best_trader_price,
        "trader_prices":     trader_prices_json,
        "api_updated_at":  item.get("updated"),
    }


async def fetch_items() -> list[dict]:
    """
    Fetch all items. Returns a list of flat dicts ready for DB upsert.
    Three parallel requests:
      - /regular/items       full item objects (prices, categories, traders)
      - /regular/items_en    English translations
      - /regular/items_fr    French translations
    """
    global last_api_source
    async with httpx.AsyncClient(timeout=90) as client:
        resp_items, resp_en, resp_fr = await asyncio.gather(
            client.get(f"{BASE_URL}/regular/items",    headers={"Accept": "application/json"}),
            client.get(f"{BASE_URL}/regular/items_en", headers={"Accept": "application/json"}),
            client.get(f"{BASE_URL}/regular/items_fr", headers={"Accept": "application/json"}),
        )
        resp_items.raise_for_status()
        resp_en.raise_for_status()
        resp_fr.raise_for_status()

    last_api_source = "rest"

    data            = _get_data(resp_items.json())
    items_dict      : dict = data.get("items", {})
    item_categories : dict = data.get("itemCategories", {})
    trans_en        : dict = _get_data(resp_en.json())
    trans_fr        : dict = _get_data(resp_fr.json())

    if not items_dict:
        raise ValueError(
            f"[tarkov_api] items_dict is empty. data keys: {list(data.keys())}"
        )

    result = [
        _normalize_item(item, trans_en, trans_fr, item_categories)
        for item in items_dict.values()
    ]
    logger.info(f"[tarkov_api] Fetched {len(result)} items")
    return result
