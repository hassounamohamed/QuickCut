from datetime import date

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_role
from app.db.session import get_db
from app.models.user import User
from app.repositories.barber_repository import BarberRepository
from app.repositories.booking_repository import BookingRepository
from app.schemas.booking import (
    BarberDashboardResponse,
    LiveQueueResponse,
    ReservationActionResponse,
    ReservationCreate,
    ReservationResponse,
)
from app.services.booking_service import BookingService

router = APIRouter(prefix="/reservations", tags=["Reservations"])


def build_service(db: AsyncSession) -> BookingService:
    return BookingService(
        booking_repository=BookingRepository(db),
        barber_repository=BarberRepository(db),
    )


@router.post("", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
async def create_reservation(
    payload: ReservationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("user")),
):
    service = build_service(db)
    return await service.create_reservation(
        client_id=current_user.id,
        barber_id=payload.barber_id,
        booking_date=payload.booking_date,
        booking_time=payload.booking_time,
    )


@router.patch("/{reservation_id}/cancel", response_model=ReservationActionResponse)
async def cancel_reservation_by_client(
    reservation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("user")),
):
    service = build_service(db)
    reservation = await service.cancel_by_client(current_user.id, reservation_id)
    return {"message": "Reservation cancelled", "reservation": reservation}


@router.get("/me/history", response_model=list[ReservationResponse])
async def my_reservation_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("user")),
):
    service = build_service(db)
    return await service.client_history(current_user.id)


@router.patch("/{reservation_id}/barber/accept", response_model=ReservationActionResponse)
async def accept_reservation(
    reservation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("barber")),
):
    service = build_service(db)
    reservation = await service.manage_by_barber(current_user.id, reservation_id, "accept")
    return {"message": "Reservation accepted", "reservation": reservation}


@router.patch("/{reservation_id}/barber/cancel", response_model=ReservationActionResponse)
async def cancel_reservation_by_barber(
    reservation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("barber")),
):
    service = build_service(db)
    reservation = await service.manage_by_barber(current_user.id, reservation_id, "cancel")
    return {"message": "Reservation cancelled", "reservation": reservation}


@router.patch("/{reservation_id}/barber/complete", response_model=ReservationActionResponse)
async def complete_reservation(
    reservation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("barber")),
):
    service = build_service(db)
    reservation = await service.manage_by_barber(current_user.id, reservation_id, "complete")
    return {"message": "Reservation completed", "reservation": reservation}


@router.get("/barber/me/dashboard", response_model=BarberDashboardResponse)
async def barber_daily_dashboard(
    target_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("barber")),
):
    service = build_service(db)
    return await service.list_barber_daily_schedule(current_user.id, target_date)


@router.get("/barber/{barber_id}/queue", response_model=LiveQueueResponse)
async def barber_live_queue(
    barber_id: int,
    target_date: date,
    db: AsyncSession = Depends(get_db),
):
    service = build_service(db)
    return await service.live_queue(barber_id, target_date)
