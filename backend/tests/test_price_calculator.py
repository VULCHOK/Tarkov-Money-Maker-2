import pytest
from src.services.price_calculator import calculate_differences


SAMPLE_ITEMS = [
    {
        "id": "abc123",
        "name": "Sugar",
        "category": {"name": "Provisions"},
        "buyFor": [
            {"vendor": {"name": "Therapist"}, "priceRUB": 5000},
            {"vendor": {"name": "Prapor"}, "priceRUB": 6000},
        ],
        "avg24hPrice": 12000,
        "low24hPrice": 10000,
    },
    {
        "id": "def456",
        "name": "AK-74N",
        "category": {"name": "Weapons"},
        "buyFor": [
            {"vendor": {"name": "Prapor"}, "priceRUB": 150000},
        ],
        "avg24hPrice": 120000,
        "low24hPrice": 115000,
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
        "category": None,
        "buyFor": [],
        "avg24hPrice": 5000,
        "low24hPrice": None,
    }]
    result = calculate_differences(items)
    assert result[0]["recommendation"] == "FLEA_ONLY"
    assert result[0]["best_trader_price"] is None


def test_empty_list():
    assert calculate_differences([]) == []
