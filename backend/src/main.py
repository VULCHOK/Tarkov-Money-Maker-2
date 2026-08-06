import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routes import items, refresh, status
from .scheduler import start_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Tarkov Money Maker 2", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)
    logger.info("[startup] Database tables ready.")
    start_scheduler()


app.include_router(items.router,   prefix="/items")
app.include_router(refresh.router, prefix="/refresh")
app.include_router(status.router,  prefix="/status")


@app.get("/health")
def health():
    return {"status": "ok"}
