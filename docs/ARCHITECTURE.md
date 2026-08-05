# Architecture

## Data Flow

```
tarkov.dev GraphQL API
        │
        ▼
  BackgroundScheduler (every 10 min)
        │
        ▼
   data_sync.py ──► price_calculator.py
        │
        ▼
   PostgreSQL DB
        │
        ▼
  FastAPI backend (/items, /traders, /market)
        │
        ▼
  React frontend (ItemTable + Filters)
```

## Key Design Decisions

### Why FastAPI over Node.js?
- Native async/await matches the httpx async fetching pattern.
- Pydantic models give free validation and OpenAPI docs at /docs.
- pytest is simpler to set up than Jest for pure logic tests.

### Why SQLite in dev, PostgreSQL in prod?
- SQLite requires zero config for local testing.
- Switch via `DATABASE_URL` env var — SQLAlchemy handles both dialects.

### Price Logic
- `buyFor` entries from tarkov.dev = what traders charge YOU.
- `avg24hPrice` = 24h average Flea Market price in RUB.
- Difference = `avg24hPrice - min(trader buyFor prices)`.
- Positive difference → buying from trader is cheaper → `BUY_FROM_TRADER`.

### Currencies
- All prices stored in RUB. tarkov.dev provides `priceRUB` pre-converted.
- USD/EUR items (Peacekeeper/Skier) are already converted by the API.

### Barters
- Not included in v1. Planned for v2 as a separate `barters` table.
