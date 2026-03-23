from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_role
from app.db.session import get_db
from app.models.user import User
from app.repositories.barber_repository import BarberRepository
from app.repositories.booking_repository import BookingRepository
from app.repositories.review_repository import ReviewRepository
from app.schemas.review import ReviewCreate, ReviewResponse
from app.services.review_service import ReviewService

router = APIRouter(prefix="/reviews", tags=["Reviews"])


def build_service(db: AsyncSession) -> ReviewService:
    return ReviewService(
        review_repository=ReviewRepository(db),
        barber_repository=BarberRepository(db),
        booking_repository=BookingRepository(db),
    )


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    payload: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("user")),
):
    service = build_service(db)
    return await service.create_for_client(current_user.id, payload)


@router.get("/barber/{barber_id}", response_model=list[ReviewResponse])
async def list_feedback_for_barber(
    barber_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = build_service(db)
    return await service.list_feedback_for_barber(barber_id)


@router.get("/barber/me", response_model=list[ReviewResponse])
async def list_feedback_for_my_barber_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("barber")),
):
    service = build_service(db)
    return await service.list_feedback_for_barber_user(current_user.id)
