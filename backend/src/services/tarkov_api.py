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


def _normalize_item(item: dict, item_categories: dict) -> dict:
    category_name = None
    cats = item.get("categories", [])
    if cats:
        cat = item_categories.get(cats[0], {})
        category_name = cat.get("normalizedName")

    buy_for: list[dict] = []
    for entry in item.get("buyFromTrader", []):
        trader_name = TRADER_ID_TO_NAME.get(entry.get("trader", ""))
        price_rub = entry.get("priceRUB") or entry.get("price", 0)
        currency = entry.get("currency", "RUB")
        if trader_name and price_rub and price_rub > 0 and currency == "RUB":
            buy_for.append({"source": trader_name, "price": price_rub, "currency": "RUB"})

    return {
        "id":             item["id"],
        "name":           item.get("name", ""),
        "short_name":     item.get("shortName", ""),
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
    Fetch all items from json.tarkov.dev/regular/items.

    Response shape (2026-08, verified live):
      {
        "data": {
          "items": { "<id>": { ...fields... } },
          "itemCategories": { "<id>": { "normalizedName": "..." } },
          ...
        },
        "translations": [...]
      }
    """
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.get(
            "https://json.tarkov.dev/regular/items",
            headers={"Accept": "application/json"},
        )
        resp.raise_for_status()
        raw = resp.json()

    # Support dict shape (current) and legacy list shape
    if isinstance(raw, dict):
        data_section = raw.get("data", {})
    elif isinstance(raw, list):
        data_section = {}
        for entry in raw:
            if isinstance(entry, list) and len(entry) == 2 and entry[0] == "data":
                data_section = entry[1]
                break
            elif isinstance(entry, dict) and "items" in entry:
                data_section = entry
                break
    else:
        raise ValueError(f"Unexpected response type: {type(raw)}")

    items_dict: dict = data_section.get("items", {})
    item_categories: dict = data_section.get("itemCategories", {})

    if not items_dict:
        logger.error(
            f"Empty items dict. "
            f"raw type={type(raw).__name__}  "
            f"raw keys={list(raw.keys()) if isinstance(raw, dict) else 'list'}  "
            f"data_section keys={list(data_section.keys())[:10]}"
        )
        raise ValueError("json.tarkov.dev returned empty items dict")

    normalized = [_normalize_item(item, item_categories) for item in items_dict.values()]
    logger.info(f"[tarkov_api] Fetched and normalized {len(normalized)} items from json.tarkov.dev")
    return normalized
