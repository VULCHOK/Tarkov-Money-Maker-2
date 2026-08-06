"""
price_calculator.py  –  Stateless arbitrage logic

Receives a flat item dict (from tarkov_api._normalize_item)
and adds computed fields:
  flea_price      : best price to buy from flea (last_low_price or avg24h_price)
  difference      : flea_price - best_trader_price  (negative = flea is cheaper)
  difference_pct  : difference / best_trader_price * 100
  recommendation  : arbitrage label

Arbitrage labels:
  BUY_FLEA_SELL_TRADER  – flea price < trader sell price  => buy flea, sell trader
  BUY_TRADER_SELL_FLEA  – trader buy price < flea sell price  (not implemented yet)
  FLEA_ONLY             – item has no trader sell offer
  TRADER_ONLY           – item has no flea market listing
  NO_PROFIT             – no interesting arbitrage
"""

# Flea market fee rate (5% of sell price by default)
FLEA_FEE_RATE = 0.05


def enrich(item: dict) -> dict:
    """
    Add computed price fields to an item dict. Returns the same dict mutated.
    """
    item = dict(item)  # don't mutate the original

    avg24h    = item.get("avg24h_price")    or 0
    last_low  = item.get("last_low_price")  or 0
    best_sell = item.get("best_trader_price") or 0

    # Use last_low_price as our reference flea buy price (more conservative)
    # Fall back to avg24h if no last_low available
    flea_price = last_low or avg24h or None
    item["flea_price"] = flea_price

    if not flea_price and not best_sell:
        item["difference"]     = None
        item["difference_pct"] = None
        item["recommendation"] = "NO_PROFIT"
        return item

    if not flea_price:
        item["difference"]     = None
        item["difference_pct"] = None
        item["recommendation"] = "TRADER_ONLY"
        return item

    if not best_sell:
        item["difference"]     = None
        item["difference_pct"] = None
        item["recommendation"] = "FLEA_ONLY"
        return item

    # flea_price - best_trader_price
    # negative => buying from flea is CHEAPER than trader sells
    # => arbitrage: buy on flea, sell to trader for profit
    diff = flea_price - best_sell
    diff_pct = round((diff / best_sell) * 100, 2) if best_sell else None

    item["difference"]     = diff
    item["difference_pct"] = diff_pct

    if diff < 0:
        # Flea is cheaper than trader sell price => profit margin = -diff
        item["recommendation"] = "BUY_FLEA_SELL_TRADER"
    else:
        item["recommendation"] = "NO_PROFIT"

    return item
