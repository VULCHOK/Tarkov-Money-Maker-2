import pytest
from src.services.price_calculator import calculate_differences


SAMPLE_ITEMS = [
    {
        "id": "abc123",
        "name": "Sugar",
        "shortName": "Sugar",
        "category": {"name": "Provisions"},
        # buyFor uses source/price/currency (real tarkov.dev schema)
        "buyFor": [
            {"source": "therapist", "price": 5000, "currency": "RUB"},
            {"source": "prapor",    "price": 6000, "currency": "RUB"},
        ],
        "sellFor": [
            {"source": "therapist",  "price": 3500, "currency": "RUB"},
            {"source": "fleaMarket", "price": 12000, "currency": "RUB"},
        ],
        "avg24hPrice": 12000,
        "low24hPrice": 10000,
        "high24hPrice": 14000,
        "lastLowPrice": 11000,
        "changeLast48hPercent": 5.2,
        "basePrice": 4500,
        "iconLink": None,
        "wikiLink": None,
    },
    {
        "id": "def456",
        "name": "AK-74N",
        "shortName": "AK-74N",
        "category": {"name": "Weapons"},
        "buyFor": [
            {"source": "prapor", "price": 150000, "currency": "RUB"},
        ],
        "sellFor": [],
        "avg24hPrice": 120000,
        "low24hPrice": 115000,
        "high24hPrice": 130000,
        "lastLowPrice": 118000,
        "changeLast48hPercent": -3.1,
        "basePrice": 100000,
        "iconLink": None,
        "wikiLink": None,
    },
]


def test_sugar_buy_from_trader():
    result = calculate_differences(SAMPLE_ITEMS)
    sugar = next(r for r in result if r["id"] == "abc123")
    assert sugar["best_trader"] == "Therapist"
    assert sugar["best_trader_price"] == 5000
    assert sugar["flea_price"] == 12000
    assert sugar["difference"] == 7000
    assert sugar["difference_pct"] == 140.0
    assert sugar["recommendation"] == "BUY_FROM_TRADER"


def test_ak_buy_from_flea():
    result = calculate_differences(SAMPLE_ITEMS)
    ak = next(r for r in result if r["id"] == "def456")
    assert ak["difference"] == -30000
    assert ak["recommendation"] == "BUY_FROM_FLEA"


def test_no_trader_price():
    items = [{
        "id": "ghi789",
        "name": "Flea-Only Item",
        "shortName": "FleaOnly",
        "category": None,
        "buyFor": [{"source": "fleaMarket", "price": 5000, "currency": "RUB"}],
        "sellFor": [],
        "avg24hPrice": 5000,
        "low24hPrice": None,
        "high24hPrice": None,
        "lastLowPrice": None,
        "changeLast48hPercent": None,
        "basePrice": None,
        "iconLink": None,
        "wikiLink": None,
    }]
    result = calculate_differences(items)
    assert result[0]["recommendation"] == "FLEA_ONLY"
    assert result[0]["best_trader_price"] is None


def test_barter_only_excluded():
    """Items with price=0 (barter-only) must not appear as trader prices."""
    items = [{
        "id": "jkl000",
        "name": "Barter Item",
        "shortName": "Barter",
        "category": None,
        "buyFor": [{"source": "mechanic", "price": 0, "currency": "RUB"}],
        "sellFor": [],
        "avg24hPrice": 8000,
        "low24hPrice": None,
        "high24hPrice": None,
        "lastLowPrice": None,
        "changeLast48hPercent": None,
        "basePrice": None,
        "iconLink": None,
        "wikiLink": None,
    }]
    result = calculate_differences(items)
    assert result[0]["trader_prices"] == {}
    assert result[0]["recommendation"] == "FLEA_ONLY"


def test_empty_list():
    assert calculate_differences([]) == []
