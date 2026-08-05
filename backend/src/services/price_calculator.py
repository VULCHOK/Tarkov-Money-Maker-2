from typing import Optional

TRADER_NAMES = {"Prapor", "Therapist", "Skier", "Peacekeeper", "Mechanic", "Ragman", "Jaeger", "Fence"}


def calculate_differences(raw_items: list[dict]) -> list[dict]:
    """
    Transform raw tarkov.dev items into enriched price-comparison objects.
    Returns list of dicts with profit analysis.
    """
    results = []
    for item in raw_items:
        trader_prices: dict[str, int] = {}

        for entry in item.get("buyFor", []):
            vendor = entry.get("vendor", {}).get("name", "")
            if vendor in TRADER_NAMES:
                price_rub = entry.get("priceRUB", 0)
                if price_rub and price_rub > 0:
                    trader_prices[vendor] = price_rub

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
        })

    return results
