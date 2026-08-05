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
- **Frontend:** http://YOUR-SERVER-IP-OR-DOMAIN:3001
- **Backend API (direct):** http://YOUR-SERVER-IP-OR-DOMAIN:3000
- **API Docs (Swagger):** http://YOUR-SERVER-IP-OR-DOMAIN:3000/docs

> ℹ️ The frontend talks to the backend via the internal nginx proxy (`/api/`), so **no domain configuration is needed** — it works on any IP or domain out of the box.

---

## 📐 Architecture

```
Tarkov-Money-Maker-2/
├── backend/          # Python FastAPI — data fetching, price diff calculations
├── frontend/         # React + TailwindCSS + nginx proxy
├── database/         # PostgreSQL schema
├── docker/           # docker-compose.yml + .env.example
├── docs/             # Architecture notes
└── .github/workflows # CI/CD (GitHub Actions)
```

### Request Flow
```
Browser → :3001 (nginx)
                ├── /api/*  → proxy → backend:3000 (FastAPI)
                └── /*     → React app (index.html)
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items/` | All items with trader + flea prices |
| GET | `/api/items/{id}` | Single item details |
| GET | `/api/traders/` | All trader price lists |
| GET | `/api/market/` | Flea Market prices |
| POST | `/api/refresh/` | Force data refresh from tarkov.dev |
| GET | `/api/health` | Health check |

---

## ⚙️ Configuration

Copy `docker/.env.example` to `docker/.env`:

```env
DATABASE_URL=postgresql://user:pass@db:5432/tarkov
TARKOV_API_URL=https://api.tarkov.dev/graphql
REFRESH_INTERVAL_MINUTES=10
PROFIT_THRESHOLD_PCT=20
```

---

## 🧪 Running Tests

```bash
# Backend
cd backend && pip install -r requirements-dev.txt && pytest -v

# Frontend
cd frontend && npm install && npm test
```

---

## 🛠️ Useful Commands

```bash
# Stop
docker compose -f docker/docker-compose.yml down

# Wipe DB volume
docker compose -f docker/docker-compose.yml down -v

# Follow backend logs
docker compose -f docker/docker-compose.yml logs -f backend

# Force refresh via API
curl -X POST http://localhost:3000/refresh/
```

---

## 📄 License

MIT — see [LICENSE](LICENSE)
