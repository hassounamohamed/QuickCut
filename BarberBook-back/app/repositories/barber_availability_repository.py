from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.barber import Barber
from app.models.barber_availability import BarberAvailability


class BarberAvailabilityRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def barber_exists(self, barber_id: int) -> bool:
        result = await self.db.execute(select(Barber.id).where(Barber.id == barber_id))
        return result.scalar_one_or_none() is not None

    async def create(
        self,
        barber_id: int,
        day_of_week: int,
        start_time,
        end_time,
    ) -> BarberAvailability:
        availability = BarberAvailability(
            barber_id=barber_id,
            day_of_week=day_of_week,
            start_time=start_time,
            end_time=end_time,
        )
        self.db.add(availability)
        await self.db.commit()
        await self.db.refresh(availability)
        return availability

    async def get_by_id(self, availability_id: int) -> BarberAvailability | None:
        result = await self.db.execute(
            select(BarberAvailability).where(BarberAvailability.id == availability_id)
        )
        return result.scalars().first()

    async def list_by_barber(self, barber_id: int) -> list[BarberAvailability]:
        result = await self.db.execute(
            select(BarberAvailability)
            .where(BarberAvailability.barber_id == barber_id)
            .order_by(BarberAvailability.day_of_week, BarberAvailability.start_time)
        )
        return list(result.scalars().all())

    async def update(self, availability: BarberAvailability, data: dict) -> BarberAvailability:
        for key, value in data.items():
            setattr(availability, key, value)

        await self.db.commit()
        await self.db.refresh(availability)
        return availability

    async def delete(self, availability: BarberAvailability) -> None:
        await self.db.delete(availability)
        await self.db.commit()
