"""
tarkov_api.py  –  Fetches data from json.tarkov.dev

Supporte 3 modes : regular (PVP), pve, pvp-season (Seasonal)
Endpoints : /{mode}/items  /{mode}/items_{lang}

Noms localisés stockés dans names/short_names (JSON) :
  Pour ajouter une langue : ajouter son code dans LANG_CODES ci-dessous.
  Le reste du code (fetch parallèle, stockage, fallback EN) est générique.
"""

import asyncio
import json as _json
import logging

import httpx

logger = logging.getLogger(__name__)

BASE_URL   = "https://json.tarkov.dev"
GAME_MODES = ["regular", "pve", "pvp-season"]

# Langues fetchées depuis json.tarkov.dev (endpoints /{mode}/items_{lang})
# Pour ajouter une langue, il suffit d'ajouter son code ici.
LANG_CODES = ["en", "fr", "de", "ru", "pl", "es"]

last_api_source: str = "rest"

TRADER_ID_TO_NAME: dict[str, str] = {
    "54cb50c76803fa8b248b4571": "Prapor",
    "54cb57776803fa99248b456e": "Therapist",
    "579dc571d53a0658a154fbec": "Fence",
    "58330581ace78e27b8b10cee": "Skier",
    "5935c25fb3acc3127c3d8cd9": "Peacekeeper",
    "5a7c2eca46aef81a7ca2145d": "Mechanic",
    "5ac3b934156ae10c4430e83c": "Ragman",
    "5c0647fdd443bc2504c2d371": "Jaeger",
    "6617beeaa9cfa777ca915b7c": "Lightkeeper",
}


def _get_data(resp_json: dict) -> dict:
    return resp_json.get("data", resp_json)


def _best_sell_to_trader(sell_list: list[dict]) -> tuple[str | None, int | None]:
    best_name  = None
    best_price = 0
    for entry in sell_list:
        trader_id   = entry.get("trader", "")
        trader_name = TRADER_ID_TO_NAME.get(trader_id)
        if not trader_name or trader_name == "Fence":
            continue
        price_rub = entry.get("priceRUB") or 0
        if price_rub > best_price:
            best_price = price_rub
            best_name  = trader_name
    return (best_name, best_price if best_price > 0 else None)


def _all_sell_prices(sell_list: list[dict]) -> dict[str, int]:
    result: dict[str, int] = {}
    for entry in sell_list:
        trader_id   = entry.get("trader", "")
        trader_name = TRADER_ID_TO_NAME.get(trader_id)
        price_rub   = entry.get("priceRUB") or 0
        if trader_name and price_rub > 0:
            if price_rub > result.get(trader_name, 0):
                result[trader_name] = price_rub
    return result


def _best_buy_from_trader(
    buy_list: list[dict], trader_levels: dict[str, int] | None = None
) -> tuple[str | None, int | None]:
    best_name  = None
    best_price = None
    for entry in buy_list:
        trader_id   = entry.get("trader", "")
        trader_name = TRADER_ID_TO_NAME.get(trader_id)
        if not trader_name or trader_name == "Fence":
            continue
        currency  = entry.get("currency", "")
        price_rub = entry.get("priceRUB") or 0
        if currency not in ("RUB", "") or price_rub <= 0:
            continue
        min_level = entry.get("minTraderLevel") or 1
        if trader_levels is not None:
            user_level = trader_levels.get(trader_name, 1)
            if min_level > user_level:
                continue
        if best_price is None or price_rub < best_price:
            best_price = price_rub
            best_name  = trader_name
    return (best_name, best_price)


def _all_buy_prices_by_level(buy_list: list[dict]) -> dict[str, dict[str, int]]:
    result: dict[str, dict[int, int]] = {}
    for entry in buy_list:
        trader_id   = entry.get("trader", "")
        trader_name = TRADER_ID_TO_NAME.get(trader_id)
        currency    = entry.get("currency", "")
        price_rub   = entry.get("priceRUB") or 0
        if not trader_name or trader_name == "Fence":
            continue
        if currency not in ("RUB", "") or price_rub <= 0:
            continue
        min_level = int(entry.get("minTraderLevel") or 1)
        trader_dict = result.setdefault(trader_name, {})
        if price_rub < trader_dict.get(min_level, float("inf")):
            trader_dict[min_level] = price_rub
    return {
        trader: {str(lvl): price for lvl, price in levels.items()}
        for trader, levels in result.items()
    }


def _normalize_item(
    item: dict,
    translations: dict[str, dict],  # {"en": {...}, "fr": {...}, ...}
    item_categories: dict,
    mode: str,
) -> dict:
    item_id = item["id"]

    # Construire les dicts de noms localisés
    # Fallback : si la traduction manque pour une langue, on prend l'EN
    en_trans = translations.get("en", {})
    names: dict[str, str] = {}
    short_names: dict[str, str] = {}
    for lang, trans in translations.items():
        name  = trans.get(f"{item_id} Name", "") or en_trans.get(f"{item_id} Name", "")
        short = trans.get(f"{item_id} ShortName", "") or en_trans.get(f"{item_id} ShortName", "")
        if name:
            names[lang] = name
        if short:
            short_names[lang] = short

    category_slug = None
    for cat_id in item.get("categories", []):
        cat = item_categories.get(cat_id)
        if cat:
            category_slug = cat.get("normalizedName")
            break

    sell_list = item.get("sellToTrader", [])
    best_trader, best_trader_price = _best_sell_to_trader(sell_list)
    trader_prices_json = _json.dumps(_all_sell_prices(sell_list))

    buy_list = item.get("buyFor") or item.get("buyFromTrader") or []
    buy_list_traders = [
        e for e in buy_list
        if TRADER_ID_TO_NAME.get(e.get("trader", "")) not in (None, "Fence")
    ]
    best_buy_trader, best_buy_trader_price = _best_buy_from_trader(
        buy_list_traders, trader_levels={t: 1 for t in TRADER_ID_TO_NAME.values()}
    )
    trader_buy_prices_by_level = _all_buy_prices_by_level(buy_list_traders)
    trader_buy_prices_json = _json.dumps(trader_buy_prices_by_level)

    last_offer_count = item.get("lastOfferCount")
    if last_offer_count is None:
        last_offer_count = item.get("offerCount")

    return {
        "id":               item_id,
        "mode":             mode,
        "names":            _json.dumps(names, ensure_ascii=False),
        "short_names":      _json.dumps(short_names, ensure_ascii=False),
        "normalized_name":  item.get("normalizedName"),
        "category":         category_slug,
        "types":            ",".join(item.get("types", [])),
        "icon_link":        item.get("iconLink"),
        "wiki_link":        item.get("wikiLink") or item.get("link"),
        "avg24h_price":     item.get("avg24hPrice"),
        "low24h_price":     item.get("low24hPrice"),
        "high24h_price":    item.get("high24hPrice"),
        "last_low_price":   item.get("lastLowPrice"),
        "last_offer_count": last_offer_count,
        "change_48h":       item.get("changeLast48h"),
        "change_48h_pct":   item.get("changeLast48hPercent"),
        "min_level_flea":   item.get("minLevelForFlea"),
        "base_price":       item.get("basePrice"),
        "width":            item.get("width"),
        "height":           item.get("height"),
        "weight":           item.get("weight"),
        "best_trader":           best_trader,
        "best_trader_price":     best_trader_price,
        "trader_prices":         trader_prices_json,
        "best_trader_buy":       best_buy_trader,
        "best_trader_buy_price": best_buy_trader_price,
        "trader_buy_prices":     trader_buy_prices_json,
        "api_updated_at":        item.get("updated"),
    }


async def _fetch_one_mode(client: httpx.AsyncClient, mode: str) -> list[dict]:
    # Fetch items + toutes les langues en parallèle
    items_resp, *lang_resps = await asyncio.gather(
        client.get(f"{BASE_URL}/{mode}/items",    headers={"Accept": "application/json"}),
        *[
            client.get(f"{BASE_URL}/{mode}/items_{lang}", headers={"Accept": "application/json"})
            for lang in LANG_CODES
        ],
    )
    items_resp.raise_for_status()
    for resp in lang_resps:
        resp.raise_for_status()

    data            = _get_data(items_resp.json())
    items_dict      = data.get("items", {})
    item_categories = data.get("itemCategories", {})

    translations: dict[str, dict] = {
        lang: _get_data(resp.json())
        for lang, resp in zip(LANG_CODES, lang_resps)
    }

    if not items_dict:
        raise ValueError(f"[tarkov_api] Mode '{mode}': items_dict est vide. Clés: {list(data.keys())}")

    result = [
        _normalize_item(item, translations, item_categories, mode)
        for item in items_dict.values()
    ]

    with_offer_count = sum(1 for x in result if x.get("last_offer_count") is not None)
    if with_offer_count == 0:
        logger.warning("[tarkov_api] Mode '%s': aucun item avec last_offer_count/offerCount renseigné", mode)
    else:
        logger.info("[tarkov_api] Mode '%s': %s items avec offer count", mode, with_offer_count)

    logger.info(f"[tarkov_api] Mode '{mode}': {len(result)} items récupérés (langs: {LANG_CODES})")
    return result


async def fetch_items(modes: list[str] | None = None) -> list[dict]:
    global last_api_source
    if modes is None:
        modes = GAME_MODES

    async with httpx.AsyncClient(timeout=90) as client:
        results = await asyncio.gather(
            *[_fetch_one_mode(client, mode) for mode in modes],
            return_exceptions=True,
        )

    last_api_source = "rest"
    all_items: list[dict] = []
    for mode, res in zip(modes, results):
        if isinstance(res, Exception):
            logger.error(f"[tarkov_api] Mode '{mode}' a échoué: {res}")
        else:
            all_items.extend(res)

    logger.info(f"[tarkov_api] Total: {len(all_items)} items ({len(modes)} modes, langs: {LANG_CODES})")
    return all_items
