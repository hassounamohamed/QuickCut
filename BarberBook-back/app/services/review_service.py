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

    async def _sync_barber_rating(self, barber_id: int) -> None:
        barber = await self.barber_repository.get_by_id(barber_id)
        if not barber:
            return

        avg_rating = await self.review_repository.get_average_rating_for_barber(barber_id)
        await self.barber_repository.update_rating(barber, avg_rating)

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

        barber = await self.barber_repository.get_by_id(reservation.barber_id)
        if not barber:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber not found",
            )

        created_review = await self.review_repository.create(
            client_id=client_id,
            barber_id=reservation.barber_id,
            rating=payload.rating,
            comment=payload.comment,
        )

        await self._sync_barber_rating(reservation.barber_id)

        return created_review

    async def list_feedback_for_barber_user(self, barber_user_id: int):
        barber = await self.barber_repository.get_by_user_id(barber_user_id)
        if not barber:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber profile not found",
            )

        reviews = await self.review_repository.list_by_barber(barber.id)
        await self._sync_barber_rating(barber.id)
        return reviews

    async def list_feedback_for_barber(self, barber_id: int):
        barber = await self.barber_repository.get_by_id(barber_id)
        if not barber:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber not found",
            )

        reviews = await self.review_repository.list_by_barber(barber_id)
        await self._sync_barber_rating(barber_id)
        return reviews
