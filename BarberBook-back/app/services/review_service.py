from fastapi import HTTPException, status

from app.repositories.barber_repository import BarberRepository
from app.repositories.booking_repository import BookingRepository
from app.repositories.review_repository import ReviewRepository
from app.schemas.review import ReviewCreate


class ReviewService:
    def __init__(
        self,
        review_repository: ReviewRepository,
        barber_repository: BarberRepository,
        booking_repository: BookingRepository,
    ):
        self.review_repository = review_repository
        self.barber_repository = barber_repository
        self.booking_repository = booking_repository

    async def create_for_client(self, client_id: int, payload: ReviewCreate):
        reservation = await self.booking_repository.get_by_id(payload.reservation_id)
        if not reservation or reservation.client_id != client_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found",
            )

        if reservation.status != "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only completed reservations can be reviewed",
            )

        return await self.review_repository.create(
            client_id=client_id,
            barber_id=reservation.barber_id,
            rating=payload.rating,
            comment=payload.comment,
        )

    async def list_feedback_for_barber_user(self, barber_user_id: int):
        barber = await self.barber_repository.get_by_user_id(barber_user_id)
        if not barber:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber profile not found",
            )

        return await self.review_repository.list_by_barber(barber.id)

    async def list_feedback_for_barber(self, barber_id: int):
        barber = await self.barber_repository.get_by_id(barber_id)
        if not barber:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber not found",
            )

        return await self.review_repository.list_by_barber(barber_id)
