import httpx
import logging
from ..config import settings

logger = logging.getLogger(__name__)

# Real tarkov.dev GraphQL schema (verified 2026):
# buyFor / sellFor use { source, price, currency } — NOT vendor { name }
# source values: "prapor", "therapist", "skier", "peacekeeper",
#                "mechanic", "ragman", "jaeger", "fence", "fleaMarket"
# Flea prices: avg24hPrice, low24hPrice, high24hPrice, lastLowPrice
# Ref: https://github.com/the-hideout/tarkov-api/blob/main/docs/graphql-examples.md
ITEMS_QUERY = """
query TarkovPrices {
  items(limit: 2000) {
    id
    name
    shortName
    category {
      name
    }
    iconLink
    wikiLink
    avg24hPrice
    low24hPrice
    high24hPrice
    lastLowPrice
    changeLast48hPercent
    basePrice
    buyFor {
      source
      price
      currency
    }
    sellFor {
      source
      price
      currency
    }
  }
}
"""

TRADER_SOURCES = {
    "prapor", "therapist", "skier", "peacekeeper",
    "mechanic", "ragman", "jaeger", "fence"
}

# Display names for sources
SOURCE_DISPLAY = {
    "prapor":     "Prapor",
    "therapist":  "Therapist",
    "skier":      "Skier",
    "peacekeeper": "Peacekeeper",
    "mechanic":   "Mechanic",
    "ragman":     "Ragman",
    "jaeger":     "Jaeger",
    "fence":      "Fence",
    "fleaMarket": "Flea Market",
}


async def fetch_items() -> list[dict]:
    """Fetch all items from tarkov.dev GraphQL API."""
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            settings.tarkov_api_url,
            json={"query": ITEMS_QUERY},
            headers={"Content-Type": "application/json"},
        )
        if resp.status_code != 200:
            logger.error(f"tarkov.dev {resp.status_code}: {resp.text[:500]}")
            resp.raise_for_status()
        data = resp.json()
        if "errors" in data:
            logger.error(f"GraphQL errors: {data['errors']}")
            raise ValueError(f"GraphQL errors: {data['errors']}")
        items = data.get("data", {}).get("items", [])
        logger.info(f"Fetched {len(items)} items from tarkov.dev")
        return items
