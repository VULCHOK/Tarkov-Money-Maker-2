import httpx
import asyncio
import logging
from ..config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# GraphQL query (primary — api.tarkov.dev/graphql)
# ---------------------------------------------------------------------------
ITEMS_QUERY = """
query TarkovPrices {
  items(limit: 2000) {
    id
    name
    shortName
    category { name }
    iconLink
    wikiLink
    avg24hPrice
    low24hPrice
    high24hPrice
    lastLowPrice
    changeLast48hPercent
    basePrice
    buyFor  { source price currency }
    sellFor { source price currency }
  }
}
"""

TRADER_SOURCES = {
    "prapor", "therapist", "skier", "peacekeeper",
    "mechanic", "ragman", "jaeger", "fence"
}
SOURCE_DISPLAY = {
    "prapor": "Prapor", "therapist": "Therapist", "skier": "Skier",
    "peacekeeper": "Peacekeeper", "mechanic": "Mechanic",
    "ragman": "Ragman", "jaeger": "Jaeger", "fence": "Fence",
    "fleaMarket": "Flea Market",
}

MAX_RETRIES = 3
RETRY_DELAYS = [5, 15, 45]

# Exposed via /status endpoint
last_api_source: str = "unknown"

# ---------------------------------------------------------------------------
# json.tarkov.dev trader ID → display name
# Verified from /regular/items response (2026-08)
# ---------------------------------------------------------------------------
_TRADER_ID_TO_NAME: dict[str, str] = {
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


# ---------------------------------------------------------------------------
# Primary: GraphQL
# ---------------------------------------------------------------------------
async def _fetch_graphql() -> list[dict]:
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            settings.tarkov_api_url,
            json={"query": ITEMS_QUERY},
            headers={"Content-Type": "application/json"},
        )
        if resp.status_code != 200:
            raise httpx.HTTPStatusError(
                f"{resp.status_code}: {resp.text[:200]}",
                request=resp.request, response=resp,
            )
        data = resp.json()
        if "errors" in data:
            raise ValueError(f"GraphQL errors: {data['errors']}")
        return data.get("data", {}).get("items", [])


# ---------------------------------------------------------------------------
# Fallback: json.tarkov.dev  GET /regular/items
#
# Real response shape (verified 2026-08):
#   [
#     ["data", {
#       "items": { "<id>": { ...fields... } },
#       "itemCategories": { "<id>": { "normalizedName": "..." } },
#       ...
#     }],
#     ["translations", [...]]
#   ]
#
# Price fields per item:
#   avg24hPrice, low24hPrice, high24hPrice, lastLowPrice,
#   changeLast48hPercent, basePrice
#   buyFromTrader: [{ trader: "<traderID>", priceRUB, currency, ... }]
# ---------------------------------------------------------------------------
def _normalize_rest_item(item: dict, item_categories: dict) -> dict:
    """Convert a json.tarkov.dev item into the same shape as our GraphQL items."""
    # Resolve most-specific category name from first category ID
    category_name = None
    cats = item.get("categories", [])
    if cats:
        cat = item_categories.get(cats[0], {})
        category_name = cat.get("normalizedName")

    # Build buyFor — only RUB prices from known traders
    buy_for = []
    for entry in item.get("buyFromTrader", []):
        trader_name = _TRADER_ID_TO_NAME.get(entry.get("trader", ""))
        price_rub = entry.get("priceRUB") or entry.get("price", 0)
        currency = entry.get("currency", "RUB")
        if trader_name and price_rub and price_rub > 0 and currency == "RUB":
            buy_for.append({
                "source":   trader_name.lower().replace(" ", ""),
                "price":    price_rub,
                "currency": "RUB",
            })

    return {
        "id":                   item.get("id", ""),
        "name":                 item.get("name", ""),
        "shortName":            item.get("shortName", ""),
        "category":             {"name": category_name},
        "iconLink":             item.get("iconLink"),
        "wikiLink":             item.get("wikiLink") or item.get("link"),
        "avg24hPrice":          item.get("avg24hPrice"),
        "low24hPrice":          item.get("low24hPrice"),
        "high24hPrice":         item.get("high24hPrice"),
        "lastLowPrice":         item.get("lastLowPrice"),
        "changeLast48hPercent": item.get("changeLast48hPercent"),
        "basePrice":            item.get("basePrice"),
        "buyFor":               buy_for,
        "sellFor":              [],
    }


async def _fetch_rest_fallback() -> list[dict]:
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.get(
            "https://json.tarkov.dev/regular/items",
            headers={"Accept": "application/json"},
        )
        resp.raise_for_status()
        raw = resp.json()

    # Parse [["data", {...}], ["translations", [...]]]
    data_section: dict = {}
    for entry in raw:
        if isinstance(entry, list) and len(entry) == 2 and entry[0] == "data":
            data_section = entry[1]
            break

    items_dict: dict = data_section.get("items", {})
    item_categories: dict = data_section.get("itemCategories", {})

    if not items_dict:
        raise ValueError("json.tarkov.dev returned empty items dict")

    normalized = [
        _normalize_rest_item(item, item_categories)
        for item in items_dict.values()
    ]
    logger.info(f"[REST fallback] Normalized {len(normalized)} items from json.tarkov.dev")
    return normalized


# ---------------------------------------------------------------------------
# Public entry point — GraphQL first, REST fallback if all retries fail
# ---------------------------------------------------------------------------
async def fetch_items() -> list[dict]:
    global last_api_source
    last_error: Exception = RuntimeError("No attempts made")

    for attempt in range(MAX_RETRIES):
        try:
            items = await _fetch_graphql()
            logger.info(f"[GraphQL] Fetched {len(items)} items (attempt {attempt + 1})")
            last_api_source = "graphql"
            return items
        except (httpx.HTTPStatusError, httpx.ConnectError,
                httpx.TimeoutException, ValueError) as e:
            logger.warning(f"[GraphQL attempt {attempt + 1}/{MAX_RETRIES}] {e}")
            last_error = e
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_DELAYS[attempt])

    logger.warning("GraphQL exhausted — trying json.tarkov.dev REST fallback...")
    try:
        items = await _fetch_rest_fallback()
        last_api_source = "rest_fallback"
        return items
    except Exception as e:
        logger.error(f"[REST fallback] Also failed: {e}")
        last_api_source = "unavailable"
        raise last_error
