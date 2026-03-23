from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.db.session import engine
from app.db.base import Base
from app.api.auth import router as auth_router
from app.api.barber import router as barber_router
from app.api.barber_availability import router as barber_availability_router
from app.api.reservation import router as reservation_router
from app.api.review import router as review_router
from app.api.favorite import router as favorite_router
from app.api.notification import router as notification_router
import app.models  # noqa: F401 – registers all models with Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="BarberBook API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8081",
        "http://localhost:19006",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
