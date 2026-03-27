from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.barber import Barber
from app.models.barber_photo import BarberPhoto
from app.models.user import User


class BarberRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def user_exists(self, user_id: int) -> bool:
        result = await self.db.execute(select(User.id).where(User.id == user_id))
        return result.scalar_one_or_none() is not None

    async def get_by_user_id(self, user_id: int) -> Barber | None:
        result = await self.db.execute(
            select(Barber)
            .options(selectinload(Barber.photos))
            .where(Barber.user_id == user_id)
        )
        return result.scalars().first()

    async def create(
        self,
        user_id: int,
        shop_name: str | None,
        address: str | None,
        latitude: float | None,
        longitude: float | None,
    ) -> Barber:
        barber = Barber(
            user_id=user_id,
            shop_name=shop_name,
            address=address,
            latitude=latitude,
            longitude=longitude,
        )
        self.db.add(barber)
        await self.db.commit()
        return await self.get_by_id(barber.id)

    async def get_by_id(self, barber_id: int) -> Barber | None:
        result = await self.db.execute(
            select(Barber)
            .options(selectinload(Barber.photos))
            .where(Barber.id == barber_id)
        )
        return result.scalars().first()

    async def update_profile(self, barber: Barber, data: dict) -> Barber:
        for key, value in data.items():
            setattr(barber, key, value)
        await self.db.commit()
        return await self.get_by_id(barber.id)

    async def update_rating(self, barber: Barber, rating: float) -> Barber:
        barber.rating = rating
        await self.db.commit()
        return await self.get_by_id(barber.id)

    async def add_photo(self, barber_id: int, photo_url: str) -> BarberPhoto:
        photo = BarberPhoto(barber_id=barber_id, photo_url=photo_url)
        self.db.add(photo)
        await self.db.commit()
        await self.db.refresh(photo)
        return photo

    async def list_photos(self, barber_id: int) -> list[BarberPhoto]:
        result = await self.db.execute(
            select(BarberPhoto).where(BarberPhoto.barber_id == barber_id).order_by(BarberPhoto.id.desc())
        )
        return list(result.scalars().all())

    async def get_photo(self, photo_id: int) -> BarberPhoto | None:
        result = await self.db.execute(select(BarberPhoto).where(BarberPhoto.id == photo_id))
        return result.scalars().first()

    async def delete_photo(self, photo: BarberPhoto) -> None:
        await self.db.delete(photo)
        await self.db.commit()

    async def list_all(self) -> list[Barber]:
        result = await self.db.execute(
            select(Barber)
            .options(selectinload(Barber.photos))
            .order_by(Barber.id.desc())
        )
        return list(result.scalars().all())
