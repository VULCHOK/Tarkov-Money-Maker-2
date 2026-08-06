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
    L0/L1/L2 → 0%
    L3       → -30% (+ jusqu'à +15% via skill Hideout Management)

Arbitrage labels:
  BUY_FLEA_SELL_TRADER  – buy on flea, sell to trader  (no fee)
  BUY_TRADER_SELL_FLEA  – buy from trader, sell on flea (fee deducted)
  FLEA_ONLY             – no trader sell offer
  TRADER_ONLY           – not on flea market
  NO_PROFIT             – no interesting arbitrage
"""

import math

# BSG tax constants (current patch)
Ti = 0.03
Tr = 0.03

# Intel Center fee discount table
INTEL_DISCOUNTS = {
    0: 0.00,
    1: 0.00,
    2: 0.00,
    3: 0.30,
}


def flea_fee(base_price: int, sell_price: int, intel_level: int = 0, quantity: int = 1) -> int:
    """
    Compute the flea market listing fee.

    Args:
        base_price:   Item handbook base price.
        sell_price:   Price at which the item is listed on flea.
        intel_level:  Intelligence Center level (0=not built, 1, 2, 3).
        quantity:     Number of items in the offer.

    Returns:
        Fee in RUB (rounded integer, >= 0).
    """
    if not base_price or not sell_price or base_price <= 0 or sell_price <= 0:
        return 0

    VO = base_price * quantity
    VR = sell_price * quantity

    po_raw = math.log10(VO / VR)
    PO = (po_raw ** 1.08) if VR < VO else po_raw

    pr_raw = math.log10(VR / VO)
    PR = (pr_raw ** 1.08) if VR >= VO else pr_raw

    fee = VO * Ti * (4 ** PO) * quantity + VR * Tr * (4 ** PR) * quantity
    fee = max(0.0, fee)

    discount = INTEL_DISCOUNTS.get(intel_level, 0.00)
    if discount > 0:
        fee *= (1.0 - discount)

    return round(fee)


def enrich(item: dict, intel_level: int = 0) -> dict:
    """
    Add computed arbitrage fields to an item dict.

    Compares both directions:
      BUY_FLEA_SELL_TRADER : profit = best_trader_price - flea_price
      BUY_TRADER_SELL_FLEA : profit = flea_price - flea_fee - best_trader_buy_price

    Picks the most profitable direction and stores:
      difference     – net profit in RUB (positive = profit)
      difference_pct – profit as % of cost
      flea_fee       – fee paid if BUY_TRADER_SELL_FLEA, else None
      recommendation – arbitrage label
    """
    item = dict(item)

    avg24h     = item.get("avg24h_price")         or 0
    last_low   = item.get("last_low_price")       or 0
    best_sell  = item.get("best_trader_price")    or 0   # trader rachète AU joueur
    best_buy   = item.get("best_trader_buy_price") or 0  # trader VEND au joueur
    base_price = item.get("base_price")           or 0

    flea_price = last_low or avg24h or None
    item["flea_price"] = flea_price

    # ── Cas sans données ────────────────────────────────────────────────────────
    def _no_profit(label: str) -> dict:
        item.update({"difference": None, "difference_pct": None, "flea_fee": None, "recommendation": label})
        return item

    if not flea_price and not best_sell and not best_buy:
        return _no_profit("NO_PROFIT")
    if not flea_price and not best_buy:
        return _no_profit("TRADER_ONLY")
    if not best_sell and not best_buy:
        return _no_profit("FLEA_ONLY")

    # ── Direction 1 : BUY_FLEA_SELL_TRADER ────────────────────────────────────
    # Coût = flea_price, revenu = best_sell, pas de taxe
    fts_profit: float | None = None
    if flea_price and best_sell:
        fts_profit = best_sell - flea_price

    # ── Direction 2 : BUY_TRADER_SELL_FLEA ────────────────────────────────────
    # Coût = best_buy, revenu = flea_price - fee
    btf_profit: float | None = None
    btf_fee_val: int | None  = None
    if flea_price and best_buy and base_price:
        btf_fee_val = flea_fee(base_price, flea_price, intel_level=intel_level)
        btf_profit  = flea_price - btf_fee_val - best_buy

    # ── Sélection de la meilleure direction ───────────────────────────────────
    fts_ok = fts_profit is not None and fts_profit > 0
    btf_ok = btf_profit is not None and btf_profit > 0

    if fts_ok and (not btf_ok or fts_profit >= btf_profit):
        item["difference"]     = int(fts_profit)
        item["difference_pct"] = round((fts_profit / flea_price) * 100, 2)
        item["flea_fee"]       = None
        item["recommendation"] = "BUY_FLEA_SELL_TRADER"

    elif btf_ok:
        item["difference"]     = int(btf_profit)
        item["difference_pct"] = round((btf_profit / best_buy) * 100, 2)
        item["flea_fee"]       = btf_fee_val
        item["recommendation"] = "BUY_TRADER_SELL_FLEA"

    else:
        # Aucune direction profitable — stocker le meilleur diff quand même pour info
        best_diff = max(
            fts_profit if fts_profit is not None else -999_999_999,
            btf_profit if btf_profit is not None else -999_999_999,
        )
        item["difference"]     = int(best_diff) if best_diff > -999_999_999 else None
        item["difference_pct"] = None
        item["flea_fee"]       = btf_fee_val
        item["recommendation"] = "NO_PROFIT"

    return item
