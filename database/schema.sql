-- Tarkov Money Maker 2 — PostgreSQL Schema
-- v4: support multi-mode (regular / pve / pvp-season)
-- PK devient (id, mode) pour stocker les 3 modes en parallèle.

CREATE TABLE IF NOT EXISTS items (
    -- Identity
    id                VARCHAR(24)   NOT NULL,
    mode              VARCHAR(20)   NOT NULL DEFAULT 'regular',  -- regular | pve | pvp-season
    normalized_name   VARCHAR(255),
    name_en           VARCHAR(255)  NOT NULL DEFAULT '',
    name_fr           VARCHAR(255),
    short_name_en     VARCHAR(50),
    short_name_fr     VARCHAR(50),
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

    -- Base / trader data
    base_price        INTEGER,
    best_trader       VARCHAR(50),
    best_trader_price INTEGER,
    trader_prices     TEXT,

    -- Computed
    flea_price        INTEGER,
    difference        INTEGER,
    difference_pct    FLOAT,
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
