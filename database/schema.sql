-- Tarkov Money Maker 2 — PostgreSQL Schema

CREATE TABLE IF NOT EXISTS items (
    id          VARCHAR(24)  PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    category    VARCHAR(100),
    updated_at  TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trader_prices (
    item_id     VARCHAR(24)  NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    trader_name VARCHAR(50)  NOT NULL,
    price       INTEGER      NOT NULL,
    currency    VARCHAR(3)   NOT NULL DEFAULT 'RUB',
    updated_at  TIMESTAMP    DEFAULT NOW(),
    PRIMARY KEY (item_id, trader_name)
);

CREATE TABLE IF NOT EXISTS market_prices (
    item_id     VARCHAR(24)  PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
    price       INTEGER      NOT NULL,
    updated_at  TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_market_price   ON market_prices(price DESC);
CREATE INDEX IF NOT EXISTS idx_trader_price   ON trader_prices(price ASC);
