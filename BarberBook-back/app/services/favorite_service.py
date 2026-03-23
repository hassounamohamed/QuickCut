from fastapi import HTTPException, status

from app.repositories.barber_repository import BarberRepository
from app.repositories.favorite_repository import FavoriteRepository


class FavoriteService:
    def __init__(self, favorite_repository: FavoriteRepository, barber_repository: BarberRepository):
        self.favorite_repository = favorite_repository
        self.barber_repository = barber_repository

    async def follow(self, client_id: int, barber_id: int):
        barber = await self.barber_repository.get_by_id(barber_id)
        if not barber:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber not found",
            )

        relation = await self.favorite_repository.get_relation(client_id, barber_id)
        if relation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already follow this barber",
            )

        return await self.favorite_repository.create(client_id, barber_id)

    async def unfollow(self, client_id: int, barber_id: int):
        relation = await self.favorite_repository.get_relation(client_id, barber_id)
        if not relation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Follow relation not found",
            )

        await self.favorite_repository.delete(relation)

    async def list_followed_barbers(self, client_id: int):
        barbers = await self.favorite_repository.list_followed_barbers(client_id)
        return [
            {
                "barber_id": barber.id,
                "shop_name": barber.shop_name,
                "address": barber.address,
                "rating": barber.rating,
            }
            for barber in barbers
        ]

    async def list_followed_slots(self, client_id: int):
        rows = await self.favorite_repository.list_followed_slots(client_id)
        return [
            {
                "barber_id": availability.barber_id,
                "shop_name": shop_name,
                "day_of_week": availability.day_of_week,
                "start_time": availability.start_time,
                "end_time": availability.end_time,
            }
            for availability, shop_name in rows
        ]
