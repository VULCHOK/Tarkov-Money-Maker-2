from typing import Optional
from .tarkov_api import TRADER_SOURCES, SOURCE_DISPLAY


def calculate_differences(raw_items: list[dict]) -> list[dict]:
    """
    Transform raw tarkov.dev items into enriched price-comparison objects.

    tarkov.dev schema:
      buyFor  = what you pay to acquire the item (trader sells TO you / flea buy price)
      sellFor = what you receive when selling the item (trader buys FROM you)

    Logic:
      - best_trader_buy_price  = min(buyFor where source in TRADER_SOURCES)
      - flea_price             = avg24hPrice (average flea listing price)
      - difference             = flea_price - best_trader_buy_price
      - positive diff          -> buy from trader, sell on flea (BUY_FROM_TRADER)
      - negative diff          -> buy from flea cheaper (BUY_FROM_FLEA)
    """
    results = []
    for item in raw_items:
        # Collect trader BUY prices (what traders charge YOU, in RUB)
        # Only consider RUB prices for simplicity; skip barter-only entries (price=0)
        trader_prices: dict[str, int] = {}
        for entry in item.get("buyFor", []):
            source = entry.get("source", "")
            price = entry.get("price", 0)
            currency = entry.get("currency", "RUB")
            if source in TRADER_SOURCES and price and price > 0 and currency == "RUB":
                display = SOURCE_DISPLAY.get(source, source)
                trader_prices[display] = price

        flea_price: Optional[int] = item.get("avg24hPrice") or item.get("low24hPrice")

        best_trader: Optional[str] = None
        best_trader_price: Optional[int] = None
        if trader_prices:
            best_trader = min(trader_prices, key=trader_prices.get)
            best_trader_price = trader_prices[best_trader]

        difference: Optional[int] = None
        difference_pct: Optional[float] = None
        recommendation: Optional[str] = None

        if flea_price and best_trader_price:
            difference = flea_price - best_trader_price
            difference_pct = round((difference / best_trader_price) * 100, 2)
            recommendation = "BUY_FROM_TRADER" if difference > 0 else "BUY_FROM_FLEA"
        elif flea_price and not best_trader_price:
            recommendation = "FLEA_ONLY"
        elif best_trader_price and not flea_price:
            recommendation = "TRADER_ONLY"

        results.append({
            "id": item["id"],
            "name": item["name"],
            "category": (item.get("category") or {}).get("name"),
            "trader_prices": trader_prices,
            "flea_price": flea_price,
            "best_trader_price": best_trader_price,
            "best_trader": best_trader,
            "difference": difference,
            "difference_pct": difference_pct,
            "recommendation": recommendation,
            # Extra fields for potential future use
            "icon_link": item.get("iconLink"),
            "wiki_link": item.get("wikiLink"),
            "change_48h_pct": item.get("changeLast48hPercent"),
            "base_price": item.get("basePrice"),
        })

    return results
