from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_role
from app.db.session import get_db
from app.models.user import User
from app.repositories.barber_repository import BarberRepository
from app.repositories.favorite_repository import FavoriteRepository
from app.schemas.favorite import FavoriteResponse, FollowedBarberResponse, FollowedBarberSlotResponse
from app.services.favorite_service import FavoriteService

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.post("/{barber_id}", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
async def follow_barber(
    barber_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("user")),
):
    service = FavoriteService(FavoriteRepository(db), BarberRepository(db))
    return await service.follow(current_user.id, barber_id)


@router.delete("/{barber_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unfollow_barber(
    barber_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("user")),
):
    service = FavoriteService(FavoriteRepository(db), BarberRepository(db))
    await service.unfollow(current_user.id, barber_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=list[FollowedBarberResponse])
async def list_my_followed_barbers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("user")),
):
    service = FavoriteService(FavoriteRepository(db), BarberRepository(db))
    return await service.list_followed_barbers(current_user.id)


@router.get("/me/slots", response_model=list[FollowedBarberSlotResponse])
async def list_slots_of_followed_barbers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("user")),
):
    service = FavoriteService(FavoriteRepository(db), BarberRepository(db))
    return await service.list_followed_slots(current_user.id)
