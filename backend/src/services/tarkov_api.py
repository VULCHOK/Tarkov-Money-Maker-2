import httpx
import asyncio
import logging
from ..config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# GraphQL query (primary source — api.tarkov.dev/graphql)
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

# Track which source was used last (exposed via /status)
last_api_source: str = "unknown"


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
                request=resp.request, response=resp
            )
        data = resp.json()
        if "errors" in data:
            raise ValueError(f"GraphQL errors: {data['errors']}")
        return data.get("data", {}).get("items", [])


# ---------------------------------------------------------------------------
# Fallback: json.tarkov.dev REST API
# Endpoint: GET https://json.tarkov.dev/items/prices
# Returns: [{"id", "name", "avg24hPrice", "low24hPrice", "high24hPrice",
#            "lastLowPrice", "changeLast48hPercent", "basePrice",
#            "buyFor": [{"source", "price", "currency"}], ...}]
# ---------------------------------------------------------------------------
async def _fetch_rest_fallback() -> list[dict]:
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.get(
            "https://json.tarkov.dev/items/prices",
            headers={"Accept": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json()
        # Normalize to same shape as GraphQL response
        items = []
        for item in data:
            items.append({
                "id":                   item.get("id", ""),
                "name":                 item.get("name", ""),
                "shortName":            item.get("shortName", ""),
                "category":             item.get("category"),
                "iconLink":             item.get("iconLink"),
                "wikiLink":             item.get("wikiLink"),
                "avg24hPrice":          item.get("avg24hPrice"),
                "low24hPrice":          item.get("low24hPrice"),
                "high24hPrice":         item.get("high24hPrice"),
                "lastLowPrice":         item.get("lastLowPrice"),
                "changeLast48hPercent": item.get("changeLast48hPercent"),
                "basePrice":            item.get("basePrice"),
                "buyFor":               item.get("buyFor", []),
                "sellFor":              item.get("sellFor", []),
            })
        return items


# ---------------------------------------------------------------------------
# Public entry point — tries GraphQL first, falls back to REST
# ---------------------------------------------------------------------------
async def fetch_items() -> list[dict]:
    global last_api_source
    last_error: Exception = RuntimeError("No attempts made")

    # — Try GraphQL with retries —
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

    # — GraphQL failed — try REST fallback —
    logger.warning("GraphQL exhausted — trying json.tarkov.dev REST fallback...")
    try:
        items = await _fetch_rest_fallback()
        logger.info(f"[REST fallback] Fetched {len(items)} items")
        last_api_source = "rest_fallback"
        return items
    except Exception as e:
        logger.error(f"[REST fallback] Also failed: {e}")
        last_api_source = "unavailable"
        raise last_error  # raise original GraphQL error
