# market.py — stub kept for future use
# MarketPrice model removed in v2 refactor (flea price now stored as flea_price in items)
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def get_market():
    return {"message": "Market prices are embedded in /items/ as flea_price field."}
