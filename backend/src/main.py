from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from .database import engine, Base
from .routes import items, traders, market, refresh
from .scheduler import start_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ready.")
    scheduler = start_scheduler()
    logger.info("Background scheduler started.")
    yield
    scheduler.shutdown()
    logger.info("Scheduler stopped.")


app = FastAPI(
    title="Tarkov Money Maker 2",
    description="Compare EFT item prices between traders and the Flea Market.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(items.router, prefix="/items", tags=["Items"])
app.include_router(traders.router, prefix="/traders", tags=["Traders"])
app.include_router(market.router, prefix="/market", tags=["Market"])
app.include_router(refresh.router, prefix="/refresh", tags=["Refresh"])


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
