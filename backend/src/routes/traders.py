# traders.py — stub kept for future use
# TraderPrice model removed in v2 refactor (prices now stored as JSON in items.trader_prices)
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def get_traders():
    return {"message": "Trader prices are embedded in /items/ as trader_prices JSON field."}
