from pathlib import Path

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api.auth import router as auth_router
from app.api.barber import router as barber_router
from app.api.barber_availability import router as barber_availability_router
from app.api.favorite import router as favorite_router
from app.api.notification import router as notification_router
from app.api.reservation import router as reservation_router
from app.api.review import router as review_router
from app.core.config import CORS_ORIGINS
from app.core.monitoring import init_sentry, setup_logging
from app.core.metrics import metrics
from app.db.base import Base
from app.db.session import engine
import app.models  # noqa: F401 - registers all models with Base


UPLOADS_DIR = Path(__file__).resolve().parent / "static" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Initialize monitoring
setup_logging()
init_sentry()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # Keep compatibility with existing DBs created before slot_minutes existed.
        try:
            await conn.execute(
                text(
                    "ALTER TABLE barber_availability "
                    "ADD COLUMN IF NOT EXISTS slot_minutes INTEGER NOT NULL DEFAULT 30"
                )
            )
        except Exception:
            pass

        # Remove legacy confirm-password column if present.
        try:
            await conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS confirme_password"))
        except Exception:
            pass

    yield


app = FastAPI(title="BarberBook API", version="1.0.0", lifespan=lifespan)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def track_metrics(request: Request, call_next):
    """Middleware to track request metrics."""
    response = await call_next(request)
    metrics.record_request(response.status_code)
    return response

app.include_router(auth_router)
app.include_router(barber_router)
app.include_router(barber_availability_router)
app.include_router(reservation_router)
app.include_router(review_router)
app.include_router(favorite_router)
app.include_router(notification_router)


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "BarberBook API is running"}


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check with metrics."""
    return metrics.to_dict()
