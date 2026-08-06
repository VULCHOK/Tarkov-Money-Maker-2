import httpx
import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# json.tarkov.dev trader ID → display name
# Verified 2026-08 from /regular/items response
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

TARKOV_API_BASE = "https://json.tarkov.dev/regular/items"


def _normalize_item(item_en: dict, item_fr: dict, item_categories: dict) -> dict:
    category_name = None
    cats = item_en.get("categories", [])
    if cats:
        cat = item_categories.get(cats[0], {})
        category_name = cat.get("normalizedName")

    buy_for: list[dict] = []
    for entry in item_en.get("buyFromTrader", []):
        trader_name = TRADER_ID_TO_NAME.get(entry.get("trader", ""))
        price_rub = entry.get("priceRUB") or entry.get("price", 0)
        currency = entry.get("currency", "RUB")
        if trader_name and price_rub and price_rub > 0 and currency == "RUB":
            buy_for.append({"source": trader_name, "price": price_rub, "currency": "RUB"})

    return {
        "id":             item_en["id"],
        "name_en":        item_en.get("name", ""),
        "name_fr":        item_fr.get("name", item_en.get("name", "")),
        "short_name_en":  item_en.get("shortName", ""),
        "short_name_fr":  item_fr.get("shortName", item_en.get("shortName", "")),
        "category":       category_name,
        "icon_link":      item_en.get("iconLink"),
        "wiki_link":      item_en.get("wikiLink") or item_en.get("link"),
        "avg24h_price":   item_en.get("avg24hPrice"),
        "low24h_price":   item_en.get("low24hPrice"),
        "high24h_price":  item_en.get("high24hPrice"),
        "last_low_price": item_en.get("lastLowPrice"),
        "change_48h_pct": item_en.get("changeLast48hPercent"),
        "base_price":     item_en.get("basePrice"),
        "buy_for":        buy_for,
    }


async def fetch_items() -> list[dict]:
    """
    Fetch all items from json.tarkov.dev in English and French.
    Uses _en and _fr suffixes per official API documentation.
    """
    async with httpx.AsyncClient(timeout=60) as client:
        resp_en, resp_fr = await _fetch_both(client)

    data_en = _extract_data(resp_en.json())
    data_fr = _extract_data(resp_fr.json())

    items_en: dict = data_en.get("items", {})
    items_fr: dict = data_fr.get("items", {})
    item_categories: dict = data_en.get("itemCategories", {})

    if not items_en:
        raise ValueError("json.tarkov.dev returned empty items dict")

    normalized = [
        _normalize_item(item_en, items_fr.get(item_id, {}), item_categories)
        for item_id, item_en in items_en.items()
    ]
    logger.info(f"[tarkov_api] Fetched {len(normalized)} items (EN+FR) from json.tarkov.dev")
    return normalized


async def _fetch_both(client: httpx.AsyncClient):
    import asyncio
    resp_en, resp_fr = await asyncio.gather(
        client.get(f"{TARKOV_API_BASE}_en", headers={"Accept": "application/json"}),
        client.get(f"{TARKOV_API_BASE}_fr", headers={"Accept": "application/json"}),
    )
    resp_en.raise_for_status()
    resp_fr.raise_for_status()
    return resp_en, resp_fr


def _extract_data(raw) -> dict:
    if isinstance(raw, dict):
        return raw.get("data", {})
    if isinstance(raw, list):
        for entry in raw:
            if isinstance(entry, list) and len(entry) == 2 and entry[0] == "data":
                return entry[1]
            if isinstance(entry, dict) and "items" in entry:
                return entry
    raise ValueError(f"Unexpected response type: {type(raw)}")
