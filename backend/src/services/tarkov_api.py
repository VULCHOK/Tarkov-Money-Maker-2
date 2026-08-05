import httpx
import asyncio
import logging
from ..config import settings

logger = logging.getLogger(__name__)

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

SOURCE_DISPLAY = {
    "prapor":      "Prapor",
    "therapist":   "Therapist",
    "skier":       "Skier",
    "peacekeeper": "Peacekeeper",
    "mechanic":    "Mechanic",
    "ragman":      "Ragman",
    "jaeger":      "Jaeger",
    "fence":       "Fence",
    "fleaMarket":  "Flea Market",
}

# 3 attempts: wait 5s then 15s before final try
MAX_RETRIES = 3
RETRY_DELAYS = [5, 15, 45]


async def fetch_items() -> list[dict]:
    """Fetch all items from tarkov.dev with retry on transient errors."""
    last_error: Exception = RuntimeError("No attempts made")

    for attempt in range(MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    settings.tarkov_api_url,
                    json={"query": ITEMS_QUERY},
                    headers={"Content-Type": "application/json"},
                )

                if resp.status_code != 200:
                    logger.warning(
                        f"[attempt {attempt+1}/{MAX_RETRIES}] "
                        f"tarkov.dev {resp.status_code}: {resp.text[:200]}"
                    )
                    last_error = httpx.HTTPStatusError(
                        str(resp.status_code), request=resp.request, response=resp
                    )
                    if attempt < MAX_RETRIES - 1:
                        await asyncio.sleep(RETRY_DELAYS[attempt])
                    continue

                data = resp.json()
                if "errors" in data:
                    logger.warning(
                        f"[attempt {attempt+1}/{MAX_RETRIES}] "
                        f"GraphQL errors: {data['errors']}"
                    )
                    last_error = ValueError(str(data["errors"]))
                    if attempt < MAX_RETRIES - 1:
                        await asyncio.sleep(RETRY_DELAYS[attempt])
                    continue

                items = data.get("data", {}).get("items", [])
                logger.info(f"Fetched {len(items)} items from tarkov.dev (attempt {attempt+1})")
                return items

        except (httpx.ConnectError, httpx.TimeoutException) as e:
            logger.warning(f"[attempt {attempt+1}/{MAX_RETRIES}] Network error: {e}")
            last_error = e
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_DELAYS[attempt])

    logger.error(f"All {MAX_RETRIES} attempts failed. Last error: {last_error}")
    raise last_error
