from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.barber import Barber
from app.models.barber_availability import BarberAvailability
from app.models.favorite import Favorite


class FavoriteRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_relation(self, client_id: int, barber_id: int) -> Favorite | None:
        result = await self.db.execute(
            select(Favorite).where(Favorite.client_id == client_id, Favorite.barber_id == barber_id)
        )
        return result.scalars().first()

    async def create(self, client_id: int, barber_id: int) -> Favorite:
        relation = Favorite(client_id=client_id, barber_id=barber_id)
        self.db.add(relation)
        await self.db.commit()
        await self.db.refresh(relation)
        return relation

    async def delete(self, relation: Favorite) -> None:
        await self.db.delete(relation)
        await self.db.commit()

    async def list_followed_barbers(self, client_id: int) -> list[Barber]:
        result = await self.db.execute(
            select(Barber)
            .join(Favorite, Favorite.barber_id == Barber.id)
            .where(Favorite.client_id == client_id)
            .order_by(Barber.rating.desc(), Barber.id.desc())
        )
        return list(result.scalars().all())

    async def list_followed_slots(self, client_id: int):
        result = await self.db.execute(
            select(BarberAvailability, Barber.shop_name)
            .join(Barber, Barber.id == BarberAvailability.barber_id)
            .join(Favorite, Favorite.barber_id == Barber.id)
            .where(Favorite.client_id == client_id)
            .order_by(BarberAvailability.day_of_week, BarberAvailability.start_time)
        )
        return result.all()

    async def list_follower_ids(self, barber_id: int) -> list[int]:
        result = await self.db.execute(select(Favorite.client_id).where(Favorite.barber_id == barber_id))
        return list(result.scalars().all())
