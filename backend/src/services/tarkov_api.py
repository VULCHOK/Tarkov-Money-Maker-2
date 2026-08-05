import httpx
import logging
from ..config import settings

logger = logging.getLogger(__name__)

# tarkov.dev GraphQL schema reference: https://api.tarkov.dev/graphql
# - buyFor.vendor is a union type: use __typename + name via inline fragments
# - avg24hPrice / low24hPrice are top-level Int fields
# - category.name is correct
ITEMS_QUERY = """
query TarkovPrices {
  items(limit: 2000) {
    id
    name
    category {
      name
    }
    buyFor {
      price
      currency
      priceRUB
      vendor {
        name
        ... on TraderOffer {
          trader {
            name
          }
          minTraderLevel
        }
      }
    }
    avg24hPrice
    low24hPrice
  }
}
"""

TRADER_NAMES = {
    "Prapor", "Therapist", "Skier", "Peacekeeper",
    "Mechanic", "Ragman", "Jaeger", "Fence"
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
            logger.error(f"tarkov.dev returned {resp.status_code}: {resp.text[:500]}")
            resp.raise_for_status()
        data = resp.json()
        if "errors" in data:
            logger.error(f"GraphQL errors: {data['errors']}")
            raise ValueError(f"GraphQL errors: {data['errors']}")
        return data.get("data", {}).get("items", [])
