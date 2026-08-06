-- Tarkov Money Maker 2 — PostgreSQL Schema
-- v2: flat items table with EN/FR names, trader prices as JSONB, no separate trader_prices/market_prices tables
-- This file is only executed on first DB init (docker-entrypoint-initdb.d).
-- SQLAlchemy Base.metadata.create_all() handles subsequent schema updates.

CREATE TABLE IF NOT EXISTS items (
    id                VARCHAR(24)   PRIMARY KEY,
    name_en           VARCHAR(255)  NOT NULL,
    name_fr           VARCHAR(255),
    short_name_en     VARCHAR(50),
    short_name_fr     VARCHAR(50),
    category          VARCHAR(100),
    icon_link         TEXT,
    wiki_link         TEXT,

    -- Raw prices from tarkov.dev
    avg24h_price      INTEGER,
    low24h_price      INTEGER,
    high24h_price     INTEGER,
    last_low_price    INTEGER,
    base_price        INTEGER,
    change_48h_pct    FLOAT,

    -- Computed by price_calculator
    flea_price        INTEGER,
    best_trader       VARCHAR(50),
    best_trader_price INTEGER,
    difference        INTEGER,
    difference_pct    FLOAT,
    recommendation    VARCHAR(20),
    trader_prices     TEXT,          -- JSON string {"Prapor": 1234, ...}

    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_category       ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_recommendation ON items(recommendation);
CREATE INDEX IF NOT EXISTS idx_items_difference_pct ON items(difference_pct DESC NULLS LAST);
