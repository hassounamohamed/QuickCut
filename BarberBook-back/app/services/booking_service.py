from datetime import date, datetime

from fastapi import HTTPException, status

from app.repositories.barber_availability_repository import BarberAvailabilityRepository
from app.repositories.barber_repository import BarberRepository
from app.repositories.booking_repository import BookingRepository
from app.services.notification_service import NotificationService

CLIENT_CANCELLABLE_STATUSES = {"pending", "accepted"}
BARBER_MANAGEABLE_STATUSES = {"pending", "accepted"}


class BookingService:
    def __init__(
        self,
        booking_repository: BookingRepository,
        barber_repository: BarberRepository,
        barber_availability_repository: BarberAvailabilityRepository,
        notification_service: NotificationService | None = None,
    ):
        self.booking_repository = booking_repository
        self.barber_repository = barber_repository
        self.barber_availability_repository = barber_availability_repository
        self.notification_service = notification_service

    async def _auto_cancel_expired_pending(self, barber_id: int) -> None:
        expired = await self.booking_repository.cancel_expired_pending(barber_id, datetime.now())
        if not expired or not self.notification_service:
            return

        for booking in expired:
            await self.notification_service.notify_users(
                [booking.client_id],
                "Reservation expired",
                (
                    f"Your reservation on {booking.booking_date} at "
                    f"{booking.booking_time.strftime('%H:%M')} expired because it was not confirmed in time."
                ),
            )

    async def create_reservation(self, client_id: int, barber_id: int, booking_date, booking_time):
        barber_exists = await self.booking_repository.barber_exists(barber_id)
        if not barber_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber not found",
            )

        today = datetime.now().date()
        if booking_date < today:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot book a past date",
            )

        if booking_date == today and booking_time <= datetime.now().time():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot book a past time",
            )

        day_of_week = booking_date.weekday()
        availabilities = await self.barber_availability_repository.list_by_barber_and_day(
            barber_id,
            day_of_week,
        )
        if not availabilities:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Barber is not available on this day",
            )

        matching = [
            slot
            for slot in availabilities
            if booking_time >= slot.start_time and booking_time < slot.end_time
        ]
        if not matching:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected time is outside barber working hours",
            )

        interval_slot = matching[0]
        slot_minutes = max(15, int(interval_slot.slot_minutes or 30))
        start_total = interval_slot.start_time.hour * 60 + interval_slot.start_time.minute
        booking_total = booking_time.hour * 60 + booking_time.minute
        if (booking_total - start_total) % slot_minutes != 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Selected time must match barber interval ({slot_minutes} min)",
            )

        await self._auto_cancel_expired_pending(barber_id)

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

        reservation = await self.booking_repository.create(
            client_id=client_id,
            barber_id=barber_id,
            booking_date=booking_date,
            booking_time=booking_time,
        )

        if self.notification_service:
            barber = await self.barber_repository.get_by_id(barber_id)
            if barber:
                await self.notification_service.notify_users(
                    [barber.user_id],
                    "New booking request",
                    (
                        f"You have a new booking request for {booking_date} at "
                        f"{booking_time.strftime('%H:%M')}."
                    ),
                )

            await self.notification_service.notify_users(
                [client_id],
                "Booking request sent",
                (
                    f"Your booking request for {booking_date} at "
                    f"{booking_time.strftime('%H:%M')} was sent successfully."
                ),
            )

        return reservation

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

        updated = await self.booking_repository.update_status(reservation, "cancelled_by_client")

        if self.notification_service:
            barber = await self.barber_repository.get_by_id(reservation.barber_id)
            if barber:
                await self.notification_service.notify_users(
                    [barber.user_id],
                    "Reservation cancelled by client",
                    (
                        f"A client cancelled the reservation on {reservation.booking_date} at "
                        f"{reservation.booking_time.strftime('%H:%M')}."
                    ),
                )

            await self.notification_service.notify_users(
                [client_id],
                "Reservation cancelled",
                (
                    f"Your reservation on {reservation.booking_date} at "
                    f"{reservation.booking_time.strftime('%H:%M')} was cancelled."
                ),
            )

        return updated

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
            updated = await self.booking_repository.update_status(reservation, "accepted")
            if self.notification_service:
                await self.notification_service.notify_users(
                    [reservation.client_id],
                    "Reservation accepted",
                    (
                        f"Your reservation on {reservation.booking_date} at "
                        f"{reservation.booking_time.strftime('%H:%M')} has been accepted."
                    ),
                )
            return updated

        if action == "cancel":
            if reservation.status not in BARBER_MANAGEABLE_STATUSES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Reservation cannot be cancelled",
                )
            updated = await self.booking_repository.update_status(reservation, "cancelled_by_barber")
            if self.notification_service:
                await self.notification_service.notify_users(
                    [reservation.client_id],
                    "Reservation cancelled by barber",
                    (
                        f"Your reservation on {reservation.booking_date} at "
                        f"{reservation.booking_time.strftime('%H:%M')} was cancelled by the barber."
                    ),
                )
            return updated

        if action == "complete":
            if reservation.status != "accepted":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Only accepted reservations can be marked as completed",
                )
            updated = await self.booking_repository.update_status(reservation, "completed")
            if self.notification_service:
                await self.notification_service.notify_users(
                    [reservation.client_id],
                    "Reservation completed",
                    (
                        f"Your reservation on {reservation.booking_date} at "
                        f"{reservation.booking_time.strftime('%H:%M')} is marked as completed."
                    ),
                )
            return updated

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

        await self._auto_cancel_expired_pending(barber.id)

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
                    "client_name": booking.client.username if booking.client else None,
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

        await self._auto_cancel_expired_pending(barber_id)

        bookings = await self.booking_repository.list_by_barber_and_date(barber_id, target_date)
        queue = [
            {
                "reservation_id": booking.id,
                "client_id": booking.client_id,
                "client_name": booking.client.username if booking.client else None,
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

    async def occupied_times(self, barber_id: int, target_date: date):
        barber_exists = await self.booking_repository.barber_exists(barber_id)
        if not barber_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber not found",
            )

        await self._auto_cancel_expired_pending(barber_id)
        occupied = await self.booking_repository.list_occupied_times(barber_id, target_date)

        return {
            "barber_id": barber_id,
            "date": target_date,
            "occupied_times": occupied,
        }

    async def client_history(self, client_id: int):
        return await self.booking_repository.list_client_history(client_id)
