import httpx
import logging
from ..config import settings

logger = logging.getLogger(__name__)

ITEMS_QUERY = """
{
  items(limit: 2000) {
    id
    name
    category {
      name
    }
    buyFor {
      vendor {
        name
      }
      priceRUB
    }
    avg24hPrice
    low24hPrice
  }
}
"""


async def fetch_items() -> list[dict]:
    """Fetch all items from tarkov.dev GraphQL API."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            settings.tarkov_api_url,
            json={"query": ITEMS_QUERY},
            headers={"Content-Type": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("data", {}).get("items", [])
