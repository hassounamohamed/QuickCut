from datetime import date

from fastapi import HTTPException, status

from app.repositories.barber_repository import BarberRepository
from app.repositories.booking_repository import BookingRepository

CLIENT_CANCELLABLE_STATUSES = {"pending", "accepted"}
BARBER_MANAGEABLE_STATUSES = {"pending", "accepted"}


class BookingService:
    def __init__(
        self,
        booking_repository: BookingRepository,
        barber_repository: BarberRepository,
    ):
        self.booking_repository = booking_repository
        self.barber_repository = barber_repository

    async def create_reservation(self, client_id: int, barber_id: int, booking_date, booking_time):
        barber_exists = await self.booking_repository.barber_exists(barber_id)
        if not barber_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber not found",
            )

        conflict = await self.booking_repository.find_conflict(
            barber_id=barber_id,
            booking_date=booking_date,
            booking_time=booking_time,
        )
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This slot is already booked",
            )

        return await self.booking_repository.create(
            client_id=client_id,
            barber_id=barber_id,
            booking_date=booking_date,
            booking_time=booking_time,
        )

    async def cancel_by_client(self, client_id: int, reservation_id: int):
        reservation = await self.booking_repository.get_by_id(reservation_id)
        if not reservation or reservation.client_id != client_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found",
            )

        if reservation.status not in CLIENT_CANCELLABLE_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reservation cannot be cancelled",
            )

        return await self.booking_repository.update_status(reservation, "cancelled_by_client")

    async def manage_by_barber(self, barber_user_id: int, reservation_id: int, action: str):
        barber = await self.barber_repository.get_by_user_id(barber_user_id)
        if not barber:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber profile not found",
            )

        reservation = await self.booking_repository.get_by_id(reservation_id)
        if not reservation or reservation.barber_id != barber.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found",
            )

        if action == "accept":
            if reservation.status != "pending":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Only pending reservations can be accepted",
                )
            return await self.booking_repository.update_status(reservation, "accepted")

        if action == "cancel":
            if reservation.status not in BARBER_MANAGEABLE_STATUSES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Reservation cannot be cancelled",
                )
            return await self.booking_repository.update_status(reservation, "cancelled_by_barber")

        if action == "complete":
            if reservation.status != "accepted":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Only accepted reservations can be marked as completed",
                )
            return await self.booking_repository.update_status(reservation, "completed")

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported action",
        )

    async def list_barber_daily_schedule(self, barber_user_id: int, target_date: date):
        barber = await self.barber_repository.get_by_user_id(barber_user_id)
        if not barber:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber profile not found",
            )

        bookings = await self.booking_repository.list_by_barber_and_date(barber.id, target_date)

        waiting_statuses = {"pending", "accepted"}
        waiting_bookings = [booking for booking in bookings if booking.status in waiting_statuses]

        return {
            "barber_id": barber.id,
            "date": target_date,
            "total_reservations": len(bookings),
            "accepted_reservations": len([b for b in bookings if b.status == "accepted"]),
            "pending_reservations": len([b for b in bookings if b.status == "pending"]),
            "waiting_count": len(waiting_bookings),
            "schedule": [
                {
                    "reservation_id": booking.id,
                    "client_id": booking.client_id,
                    "booking_time": booking.booking_time,
                    "status": booking.status,
                }
                for booking in bookings
            ],
        }

    async def live_queue(self, barber_id: int, target_date: date):
        barber_exists = await self.booking_repository.barber_exists(barber_id)
        if not barber_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber not found",
            )

        bookings = await self.booking_repository.list_by_barber_and_date(barber_id, target_date)
        queue = [
            {
                "reservation_id": booking.id,
                "client_id": booking.client_id,
                "booking_time": booking.booking_time,
                "status": booking.status,
            }
            for booking in bookings
            if booking.status in {"pending", "accepted"}
        ]

        return {
            "barber_id": barber_id,
            "date": target_date,
            "waiting_count": len(queue),
            "queue": queue,
        }

    async def client_history(self, client_id: int):
        return await self.booking_repository.list_client_history(client_id)
