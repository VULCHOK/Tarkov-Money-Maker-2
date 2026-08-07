-- Tarkov Money Maker 2 — PostgreSQL Schema
-- v6: i18n — remplace name_en/fr + short_name_en/fr par names/short_names (JSON TEXT)
--     Format: {"en": "...", "fr": "...", <future langs>}
--     Extensible à toutes les langues tarkov.dev sans migration.
-- PK = (id, mode) pour stocker les 3 modes en parallèle.

CREATE TABLE IF NOT EXISTS items (
    -- Identity
    id                VARCHAR(24)   NOT NULL,
    mode              VARCHAR(20)   NOT NULL DEFAULT 'regular',  -- regular | pve | pvp-season
    normalized_name   VARCHAR(255),

    -- Noms localisés — JSON {"en": "...", "fr": "...", <future langs>}
    names             TEXT          NOT NULL DEFAULT '{}',
    short_names       TEXT                   DEFAULT '{}',

    category          VARCHAR(100),
    types             VARCHAR(255),
    icon_link         TEXT,
    wiki_link         TEXT,

    -- Physical
    width             INTEGER,
    height            INTEGER,
    weight            FLOAT,

    -- Flea market prices
    avg24h_price      INTEGER,
    low24h_price      INTEGER,
    high24h_price     INTEGER,
    last_low_price    INTEGER,
    last_offer_count  INTEGER,
    change_48h        INTEGER,
    change_48h_pct    FLOAT,
    min_level_flea    INTEGER,

    -- Trader SELL data (trader rachète AU joueur)
    base_price            INTEGER,
    best_trader           VARCHAR(50),
    best_trader_price     INTEGER,
    trader_prices         TEXT,         -- JSON: {"Prapor": 1234, ...}

    -- Trader BUY data (trader VEND au joueur)
    best_trader_buy       VARCHAR(50),  -- trader le moins cher
    best_trader_buy_price INTEGER,      -- prix RUB le moins cher
    trader_buy_prices     TEXT,         -- JSON: {"Mechanic": {"1": 5000}, ...}

    -- Computed
    flea_price        INTEGER,
    difference        INTEGER,
    difference_pct    FLOAT,
    flea_fee          INTEGER,          -- taxe flea si BUY_TRADER_SELL_FLEA
    recommendation    VARCHAR(20),

    -- Sync metadata
    api_updated_at    VARCHAR(32),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    PRIMARY KEY (id, mode)
);

CREATE INDEX IF NOT EXISTS idx_items_mode              ON items(mode);
CREATE INDEX IF NOT EXISTS idx_items_normalized_name   ON items(normalized_name);
CREATE INDEX IF NOT EXISTS idx_items_category          ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_recommendation    ON items(recommendation);
CREATE INDEX IF NOT EXISTS idx_items_difference_pct    ON items(difference_pct DESC NULLS LAST);
