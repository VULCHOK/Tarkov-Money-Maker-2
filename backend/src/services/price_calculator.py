"""
price_calculator.py  –  Stateless arbitrage logic

Flea market tax formula (official BSG wiki):
  fee = VO × Ti × 4^PO + VR × Tr × 4^PR
  where:
    VO = base_price × quantity   (quantity=1 always here)
    VR = sell_price × quantity
    PO = log10(VO / VR) ; raised to ^1.08 if VR < VO
    PR = log10(VR / VO) ; raised to ^1.08 if VR >= VO
    Ti = Tr = 0.03  (current BSG tax constants)

  Intel Center discount:
    L1 → 0%  (no discount)
    L2 → 0%  (no discount, only L3 gives benefit)
    L3 → 30% discount, +0.3% per Hideout Management skill level (up to +15% at lvl50)

  The fee applies when YOU list an item on the flea market (sell side).

Arbitrage labels:
  BUY_FLEA_SELL_TRADER  – buy on flea, sell to trader  (no fee)
  BUY_TRADER_SELL_FLEA  – buy from trader, sell on flea (fee deducted from profit)
  FLEA_ONLY             – no trader buy offer
  TRADER_ONLY           – not on flea market
  NO_PROFIT             – no interesting arbitrage
"""

import math

# BSG tax constants (current patch)
Ti = 0.03
Tr = 0.03

# Trader buy multipliers (used to estimate base_price if not stored)
# base_price ≈ trader_buy_price / multiplier
TRADER_MULTIPLIERS = {
    "Ragman":      0.62,
    "Therapist":   0.60,
    "Jaeger":      0.60,
    "Mechanic":    0.56,
    "Prapor":      0.50,
    "Peacekeeper": 0.495,
    "Skier":       0.49,
    "Fence":       0.40,
    "Lightkeeper": 0.50,
}

# Intel Center fee discount table
# Key = level (0 = not built, 1, 2, 3)
# Value = discount fraction (0.0 → 0%, 0.30 → 30%)
INTEL_DISCOUNTS = {
    0: 0.00,
    1: 0.00,
    2: 0.00,
    3: 0.30,   # +0.3% per Hideout Management level up to lvl 50 (+15% max), hardcoded base here
}


def flea_fee(base_price: int, sell_price: int, intel_level: int = 0, quantity: int = 1) -> int:
    """
    Compute the flea market listing fee.

    Args:
        base_price:   Item handbook base price.
        sell_price:   Price at which YOU list the item on flea.
        intel_level:  Intelligence Center level (0=not built, 1, 2, 3).
        quantity:     Number of items in the offer.

    Returns:
        Fee in RUB (rounded integer, >= 0).
    """
    if not base_price or not sell_price or base_price <= 0 or sell_price <= 0:
        return 0

    VO = base_price * quantity
    VR = sell_price * quantity

    # PO modifier
    po_raw = math.log10(VO / VR)
    PO = (po_raw ** 1.08) if VR < VO else po_raw

    # PR modifier
    pr_raw = math.log10(VR / VO)
    PR = (pr_raw ** 1.08) if VR >= VO else pr_raw

    fee = VO * Ti * (4 ** PO) * quantity + VR * Tr * (4 ** PR) * quantity
    fee = max(0.0, fee)

    # Intel Center discount
    discount = INTEL_DISCOUNTS.get(intel_level, 0.00)
    if discount > 0:
        fee *= (1.0 - discount)

    return round(fee)


def enrich(item: dict, intel_level: int = 0) -> dict:
    """
    Add computed price fields to an item dict.

    Fields added:
      flea_price        – reference buy price on flea
      difference        – net profit in RUB  (positive = profit)
      difference_pct    – profit as % of cost
      flea_fee          – fee paid when selling on flea (BUY_TRADER_SELL_FLEA only)
      recommendation    – arbitrage label
    """
    item = dict(item)

    avg24h     = item.get("avg24h_price")     or 0
    last_low   = item.get("last_low_price")   or 0
    best_sell  = item.get("best_trader_price") or 0  # best price trader pays YOU
    base_price = item.get("base_price")        or 0

    # Best price YOU can buy from a trader (cheapest offer, not stored yet → use best_sell as proxy)
    # TODO: store trader buy offers separately; for now we skip BUY_TRADER_SELL_FLEA
    # when no trader_buy_price is available.
    best_buy_from_trader = item.get("best_trader_buy_price") or 0

    flea_price = last_low or avg24h or None
    item["flea_price"] = flea_price

    # ── No data ─────────────────────────────────────────────────────────────
    if not flea_price and not best_sell:
        item.update({"difference": None, "difference_pct": None, "flea_fee": None, "recommendation": "NO_PROFIT"})
        return item

    if not flea_price:
        item.update({"difference": None, "difference_pct": None, "flea_fee": None, "recommendation": "TRADER_ONLY"})
        return item

    if not best_sell:
        item.update({"difference": None, "difference_pct": None, "flea_fee": None, "recommendation": "FLEA_ONLY"})
        return item

    # ── BUY_FLEA_SELL_TRADER ─────────────────────────────────────────────────
    # Cost  = flea_price (buy on flea, no fee on the buy side)
    # Revenue = best_sell (trader pays you this)
    # Profit = best_sell - flea_price  (no listing fee for this direction)
    fts_profit = best_sell - flea_price

    # ── BUY_TRADER_SELL_FLEA ─────────────────────────────────────────────────
    # Cost    = best_buy_from_trader (what you pay the trader)
    # Revenue = flea_price - fee  (you list at flea price, pay listing fee)
    # Profit  = flea_price - fee - best_buy_from_trader
    btf_profit = None
    btf_fee    = None
    if best_buy_from_trader and flea_price and base_price:
        btf_fee    = flea_fee(base_price, flea_price, intel_level=intel_level)
        btf_profit = flea_price - btf_fee - best_buy_from_trader

    # ── Pick best arbitrage ──────────────────────────────────────────────────
    if fts_profit > 0 and (btf_profit is None or fts_profit >= btf_profit):
        item["difference"]     = fts_profit
        item["difference_pct"] = round((fts_profit / flea_price) * 100, 2)
        item["flea_fee"]       = None
        item["recommendation"] = "BUY_FLEA_SELL_TRADER"

    elif btf_profit is not None and btf_profit > 0:
        item["difference"]     = btf_profit
        item["difference_pct"] = round((btf_profit / best_buy_from_trader) * 100, 2) if best_buy_from_trader else None
        item["flea_fee"]       = btf_fee
        item["recommendation"] = "BUY_TRADER_SELL_FLEA"

    else:
        item["difference"]     = max(fts_profit, btf_profit or fts_profit)
        item["difference_pct"] = None
        item["flea_fee"]       = None
        item["recommendation"] = "NO_PROFIT"

    return item
