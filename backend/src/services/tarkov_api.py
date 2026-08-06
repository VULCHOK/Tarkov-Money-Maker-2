import httpx
import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Trader IDs -> display name
# ---------------------------------------------------------------------------
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

TRADER_SOURCES = set(TRADER_ID_TO_NAME.values())
last_api_source: str = "rest"

# /regular/items  -> full item objects with prices, categories, traders
# /regular/items_{lang} -> flat translation dict {id_or_key: "translated string"}
ITEMS_URL       = "https://json.tarkov.dev/regular/items"
ITEMS_FR_URL    = "https://json.tarkov.dev/regular/items_fr"


def _normalize_item(item: dict, translations_fr: dict, item_categories: dict) -> dict:
    """Build a flat DB-ready dict from a full item object + FR translation dict."""
    item_id = item["id"]

    # translations_fr keys are either "<id> Name" or "<id> ShortName"
    name_fr       = translations_fr.get(f"{item_id} Name",      item.get("name", ""))
    short_name_fr = translations_fr.get(f"{item_id} ShortName", item.get("shortName", ""))

    # Category: first category id -> normalizedName
    category_name = None
    cats = item.get("categories", [])
    if cats:
        cat = item_categories.get(cats[0], {})
        category_name = cat.get("normalizedName")

    # Trader buy prices (RUB only)
    buy_for: list[dict] = []
    for entry in item.get("buyFor", []):
        source = entry.get("vendor", {}).get("name") or entry.get("source", "")
        price  = entry.get("price", 0) or entry.get("priceRUB", 0)
        currency = entry.get("currency", "RUB")
        if source and price and price > 0 and currency == "RUB" and source in TRADER_SOURCES:
            buy_for.append({"source": source, "price": price, "currency": "RUB"})

    return {
        "id":             item_id,
        "name_en":        item.get("name", ""),
        "name_fr":        name_fr,
        "short_name_en":  item.get("shortName", ""),
        "short_name_fr":  short_name_fr,
        "category":       category_name,
        "icon_link":      item.get("iconLink"),
        "wiki_link":      item.get("wikiLink") or item.get("link"),
        "avg24h_price":   item.get("avg24hPrice"),
        "low24h_price":   item.get("low24hPrice"),
        "high24h_price":  item.get("high24hPrice"),
        "last_low_price": item.get("lastLowPrice"),
        "change_48h_pct": item.get("changeLast48hPercent"),
        "base_price":     item.get("basePrice"),
        "buy_for":        buy_for,
    }


async def fetch_items() -> list[dict]:
    """
    Fetch all items from json.tarkov.dev.

    - GET /regular/items      -> full item objects (prices, categories, traders)
    - GET /regular/items_fr   -> flat FR translation dict {"<id> Name": "...", ...}
    """
    async with httpx.AsyncClient(timeout=60) as client:
        import asyncio
        resp_items, resp_fr = await asyncio.gather(
            client.get(ITEMS_URL,    headers={"Accept": "application/json"}),
            client.get(ITEMS_FR_URL, headers={"Accept": "application/json"}),
        )
        resp_items.raise_for_status()
        resp_fr.raise_for_status()

    # /regular/items  -> { "data": { "items": {id: {...}}, "itemCategories": {id: {...}}, ... } }
    raw_items = resp_items.json()
    data      = raw_items.get("data", raw_items)
    items_dict: dict       = data.get("items", {})
    item_categories: dict  = data.get("itemCategories", {})

    # /regular/items_fr -> { "data": { "<id> Name": "...", "<id> ShortName": "..." } }
    raw_fr         = resp_fr.json()
    translations_fr: dict = raw_fr.get("data", {})

    if not items_dict:
        logger.error(
            f"[tarkov_api] Empty items_dict. "
            f"data keys: {list(data.keys())[:10]}"
        )
        raise ValueError("json.tarkov.dev returned empty items dict")

    normalized = [
        _normalize_item(item, translations_fr, item_categories)
        for item in items_dict.values()
    ]
    logger.info(f"[tarkov_api] Fetched {len(normalized)} items from json.tarkov.dev")
    return normalized
