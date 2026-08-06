from typing import Optional
from .tarkov_api import TRADER_SOURCES


def calculate_differences(normalized_items: list[dict]) -> list[dict]:
    """
    Enrich normalized items with price comparison data.

    Input items come from tarkov_api._normalize_item() and have:
      buy_for: [{ source: str, price: int, currency: str }]
      avg24h_price, low24h_price, base_price, etc.

    Logic:
      - best_trader_price = cheapest trader buy price (RUB)
      - flea_price        = avg24h_price (average flea listing)
      - difference        = flea_price - best_trader_price
      - BUY_FROM_TRADER   if difference > 0  (trader cheaper than flea)
      - BUY_FROM_FLEA     if difference <= 0
    """
    results = []
    for item in normalized_items:
        trader_prices: dict[str, int] = {}
        for entry in item.get("buy_for", []):
            source = entry.get("source", "")
            price = entry.get("price", 0)
            if source in TRADER_SOURCES and price and price > 0:
                trader_prices[source] = price

        flea_price: Optional[int] = item.get("avg24h_price") or item.get("low24h_price")

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
            **item,   # carry all original fields
            "trader_prices":     trader_prices,
            "flea_price":        flea_price,
            "best_trader":       best_trader,
            "best_trader_price": best_trader_price,
            "difference":        difference,
            "difference_pct":    difference_pct,
            "recommendation":    recommendation,
        })

    return results
