# 🎯 Tarkov Money Maker 2

A Dockerized web tool that compares **Escape from Tarkov** item prices between traders (Prapor, Therapist, etc.) and the Flea Market to identify profit opportunities.

---

## 🚀 Quick Start

```bash
git clone https://github.com/VULCHOK/Tarkov-Money-Maker-2.git
cd Tarkov-Money-Maker-2
cp docker/.env.example docker/.env
docker compose -f docker/docker-compose.yml up --build
```

The app will be available at:
- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000
- **API Docs (Swagger):** http://localhost:3000/docs

---

## 📐 Architecture

```
Tarkov-Money-Maker-2/
├── backend/          # Python FastAPI — data fetching, price diff calculations
├── frontend/         # React + TailwindCSS — interactive table, filters, export
├── database/         # PostgreSQL schema + migrations
├── docker/           # Dockerfile + docker-compose.yml + .env.example
├── docs/             # Additional documentation
└── .github/workflows # CI/CD (GitHub Actions)
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/items` | All items with trader + flea prices |
| GET | `/items/{id}` | Single item details |
| GET | `/traders` | All trader price lists |
| GET | `/market` | Flea Market prices |
| POST | `/refresh` | Force data refresh from tarkov.dev |
| GET | `/health` | Health check |

### Example Response (`/items`)

```json
[
  {
    "id": "5c0a840b86f7742ffa4f2482",
    "name": "Sugar",
    "category": "Provisions",
    "trader_prices": {
      "Therapist": 5000,
      "Prapor": 6000
    },
    "flea_price": 12000,
    "best_trader_price": 5000,
    "best_trader": "Therapist",
    "difference": 7000,
    "difference_pct": 140.0,
    "recommendation": "BUY_FROM_TRADER"
  }
]
```

---

## 🗄️ Database Schema

```sql
CREATE TABLE items (
  id          VARCHAR(24) PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  category    VARCHAR(100),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE trader_prices (
  item_id     VARCHAR(24) REFERENCES items(id),
  trader_name VARCHAR(50),
  price       INT,
  currency    VARCHAR(3) DEFAULT 'RUB',
  updated_at  TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (item_id, trader_name)
);

CREATE TABLE market_prices (
  item_id     VARCHAR(24) PRIMARY KEY REFERENCES items(id),
  price       INT,
  updated_at  TIMESTAMP DEFAULT NOW()
);
```

---

## ⚙️ Configuration

Copy `docker/.env.example` to `docker/.env` and adjust:

```env
DATABASE_URL=postgresql://user:pass@db:5432/tarkov
TARKOV_API_URL=https://api.tarkov.dev/graphql
REFRESH_INTERVAL_MINUTES=10
PROFIT_THRESHOLD_PCT=20
```

---

## 🧪 Running Tests

```bash
# Backend tests
cd backend && pip install -r requirements-dev.txt && pytest --cov

# Frontend tests
cd frontend && npm test
```

---

## 🛠️ Useful Commands

```bash
# Stop all containers
docker compose -f docker/docker-compose.yml down

# Stop and wipe database volume
docker compose -f docker/docker-compose.yml down -v

# View backend logs
docker compose -f docker/docker-compose.yml logs -f backend

# Force data refresh
curl -X POST http://localhost:3000/refresh/
```

---

## 📄 License

MIT — see [LICENSE](LICENSE)
