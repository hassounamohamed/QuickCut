from datetime import date, datetime

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.barber import Barber
from app.models.booking import Booking

ACTIVE_BOOKING_STATUSES = ["pending", "accepted", "completed"]


class BookingRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def barber_exists(self, barber_id: int) -> bool:
        result = await self.db.execute(select(Barber.id).where(Barber.id == barber_id))
        return result.scalar_one_or_none() is not None

    async def create(self, client_id: int, barber_id: int, booking_date, booking_time) -> Booking:
        booking = Booking(
            client_id=client_id,
            barber_id=barber_id,
            booking_date=booking_date,
            booking_time=booking_time,
            status="pending",
        )
        self.db.add(booking)
        await self.db.commit()
        await self.db.refresh(booking)
        return booking

    async def get_by_id(self, booking_id: int) -> Booking | None:
        result = await self.db.execute(select(Booking).where(Booking.id == booking_id))
        return result.scalars().first()

    async def find_conflict(self, barber_id: int, booking_date, booking_time) -> Booking | None:
        result = await self.db.execute(
            select(Booking).where(
                and_(
                    Booking.barber_id == barber_id,
                    Booking.booking_date == booking_date,
                    Booking.booking_time == booking_time,
                    Booking.status.in_(ACTIVE_BOOKING_STATUSES),
                )
            )
        )
        return result.scalars().first()

    async def update_status(self, booking: Booking, status: str) -> Booking:
        booking.status = status
        await self.db.commit()
        await self.db.refresh(booking)
        return booking

    async def list_by_barber_and_date(self, barber_id: int, target_date: date) -> list[Booking]:
        result = await self.db.execute(
            select(Booking)
            .options(selectinload(Booking.client))
            .where(Booking.barber_id == barber_id, Booking.booking_date == target_date)
            .order_by(Booking.booking_time.asc())
        )
        return list(result.scalars().all())

    async def list_client_history(self, client_id: int) -> list[Booking]:
        result = await self.db.execute(
            select(Booking)
            .where(Booking.client_id == client_id)
            .order_by(Booking.booking_date.desc(), Booking.booking_time.desc())
        )
        return list(result.scalars().all())

    async def list_occupied_times(self, barber_id: int, target_date: date) -> list[str]:
        result = await self.db.execute(
            select(Booking.booking_time)
            .where(
                Booking.barber_id == barber_id,
                Booking.booking_date == target_date,
                Booking.status.in_(ACTIVE_BOOKING_STATUSES),
            )
            .order_by(Booking.booking_time.asc())
        )
        times = []
        for value in result.scalars().all():
            if value is None:
                continue
            times.append(value.strftime("%H:%M:%S"))
        return times

    async def cancel_expired_pending(self, barber_id: int, now_value: datetime) -> list[Booking]:
        result = await self.db.execute(
            select(Booking)
            .options(selectinload(Booking.client), selectinload(Booking.barber))
            .where(
                Booking.barber_id == barber_id,
                Booking.status == "pending",
                or_(
                    Booking.booking_date < now_value.date(),
                    and_(
                        Booking.booking_date == now_value.date(),
                        Booking.booking_time < now_value.time(),
                    ),
                ),
            )
        )
        expired = list(result.scalars().all())

        for booking in expired:
            booking.status = "cancelled_by_barber"

        await self.db.commit()
        return expired
