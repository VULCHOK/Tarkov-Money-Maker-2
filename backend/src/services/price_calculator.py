"""
price_calculator.py  –  Stateless arbitrage logic

Flea market tax formula (official, from wiki):
  fee = VO × Ti × 4^PO + VR × Tr × 4^PR
  where:
    VO = offer value  = base_price × quantity  (we use quantity=1)
    VR = requirement value = sell_price × quantity
    PO = log10(VO / VR) ; raised to power 1.08 if VR < VO
    PR = log10(VR / VO) ; raised to power 1.08 if VR >= VO
    Ti = Tr = 0.03  (current tax constants)

  Optional: Intel Center L3 gives 30% discount on fee (INTEL_DISCOUNT).

  The fee applies when YOU sell on the flea (BUY_TRADER_SELL_FLEA).
  For BUY_FLEA_SELL_TRADER, no fee — you buy from flea, sell to trader.

Arbitrage labels:
  BUY_FLEA_SELL_TRADER  – buy on flea, sell to trader  (profit = trader_price - flea_price)
  BUY_TRADER_SELL_FLEA  – not yet implemented
  FLEA_ONLY             – no trader buy offer
  TRADER_ONLY           – not on flea market
  NO_PROFIT             – no interesting arbitrage
"""

import math

# Tax constants (BSG, current patch)
Ti = 0.03
Tr = 0.03

# Set to True if player has Intel Center Level 3 (30% fee reduction)
INTEL_DISCOUNT = False


def flea_fee(base_price: int, sell_price: int, quantity: int = 1) -> int:
    """
    Compute the flea market listing fee for selling `quantity` items at `sell_price` each.
    `base_price` is the item's handbook base price (stored in DB as base_price).

    Returns the fee in RUB (rounded integer).
    """
    if not base_price or not sell_price:
        return 0

    VO = base_price * quantity
    VR = sell_price * quantity

    PO = math.log10(VO / VR)
    if VR < VO:
        PO = PO ** 1.08

    PR = math.log10(VR / VO)
    if VR >= VO:
        PR = PR ** 1.08

    fee = VO * Ti * (4 ** PO) * quantity + VR * Tr * (4 ** PR) * quantity
    fee = round(fee)

    if INTEL_DISCOUNT:
        fee = round(fee * 0.70)

    return fee


def enrich(item: dict) -> dict:
    """
    Add computed price fields to an item dict. Returns a new dict.

    diff = best_trader_price - flea_price  (positive = profit when buying flea + selling trader)
    """
    item = dict(item)

    avg24h   = item.get("avg24h_price")   or 0
    last_low = item.get("last_low_price") or 0
    best_sell = item.get("best_trader_price") or 0
    base_price = item.get("base_price") or 0

    # Reference flea buy price — last_low is more conservative, fall back to avg24h
    flea_price = last_low or avg24h or None
    item["flea_price"] = flea_price

    # ── No data at all ──────────────────────────────────────────────────────
    if not flea_price and not best_sell:
        item["difference"]     = None
        item["difference_pct"] = None
        item["flea_fee"]       = None
        item["recommendation"] = "NO_PROFIT"
        return item

    if not flea_price:
        item["difference"]     = None
        item["difference_pct"] = None
        item["flea_fee"]       = None
        item["recommendation"] = "TRADER_ONLY"
        return item

    if not best_sell:
        item["difference"]     = None
        item["difference_pct"] = None
        item["flea_fee"]       = None
        item["recommendation"] = "FLEA_ONLY"
        return item

    # ── BUY_FLEA_SELL_TRADER ───────────────────────────────────────────────
    # No listing fee — you BUY from flea (pay flea_price) then SELL to trader.
    # Profit = trader_price - flea_price
    diff = best_sell - flea_price
    diff_pct = round((diff / flea_price) * 100, 2) if flea_price else None

    item["difference"]     = diff
    item["difference_pct"] = diff_pct
    item["flea_fee"]       = None   # no fee for this direction

    if diff > 0:
        item["recommendation"] = "BUY_FLEA_SELL_TRADER"
    else:
        item["recommendation"] = "NO_PROFIT"

    return item
