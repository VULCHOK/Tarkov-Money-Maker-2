"""
schemas.py  –  Pydantic response models

ItemOut expose :
  - names       : JSON brut  {"en": "...", "fr": "..."}  (nouveau schéma)
  - short_names : JSON brut  {"en": "...", "fr": "..."}
  - name_en / name_fr / short_name_en / short_name_fr : propriétés calculées
    pour rétro-compatibilité frontend pendant la transition.
    À supprimer quand le frontend lira directement names[lang].
"""

import json
from pydantic import BaseModel, model_validator
from typing import Optional
from datetime import datetime


class ItemOut(BaseModel):
    id:               str
    mode:             str
    normalized_name:  Optional[str]   = None

    # Noms localisés — nouveau format
    names:       Optional[str] = None  # JSON {"en": "...", "fr": "..."}
    short_names: Optional[str] = None  # JSON {"en": "...", "fr": "..."}

    # Champs calculés injectés par model_validator — rétro-compat frontend
    name_en:       Optional[str] = None
    name_fr:       Optional[str] = None
    short_name_en: Optional[str] = None
    short_name_fr: Optional[str] = None

    category:  Optional[str] = None
    types:     Optional[str] = None
    icon_link: Optional[str] = None
    wiki_link: Optional[str] = None

    width:  Optional[int]   = None
    height: Optional[int]   = None
    weight: Optional[float] = None

    avg24h_price:     Optional[int]   = None
    low24h_price:     Optional[int]   = None
    high24h_price:    Optional[int]   = None
    last_low_price:   Optional[int]   = None
    last_offer_count: Optional[int]   = None
    change_48h:       Optional[int]   = None
    change_48h_pct:   Optional[float] = None
    min_level_flea:   Optional[int]   = None
    base_price:       Optional[int]   = None

    # Trader SELL (trader rachète AU joueur)
    best_trader:       Optional[str] = None
    best_trader_price: Optional[int] = None
    trader_prices:     Optional[str] = None

    # Trader BUY (trader VEND au joueur)
    best_trader_buy:       Optional[str] = None
    best_trader_buy_price: Optional[int] = None
    trader_buy_prices:     Optional[str] = None

    # Computed
    flea_price:     Optional[int]   = None
    difference:     Optional[int]   = None
    difference_pct: Optional[float] = None
    flea_fee:       Optional[int]   = None
    recommendation: Optional[str]   = None

    api_updated_at: Optional[str]      = None
    updated_at:     Optional[datetime] = None

    @model_validator(mode="after")
    def _expand_names(self) -> "ItemOut":
        """Injecte name_en/fr/short_name_en/fr depuis les JSON names/short_names."""
        try:
            n = json.loads(self.names or "{}")
        except Exception:
            n = {}
        try:
            s = json.loads(self.short_names or "{}")
        except Exception:
            s = {}

        self.name_en       = n.get("en", "")
        self.name_fr       = n.get("fr") or n.get("en", "")
        self.short_name_en = s.get("en", "")
        self.short_name_fr = s.get("fr") or s.get("en", "")
        return self

    class Config:
        from_attributes = True
