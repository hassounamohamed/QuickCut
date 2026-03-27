from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_role
from app.db.session import get_db
from app.models.user import User
from app.repositories.barber_availability_repository import BarberAvailabilityRepository
from app.repositories.barber_repository import BarberRepository
from app.repositories.device_token_repository import DeviceTokenRepository
from app.repositories.favorite_repository import FavoriteRepository
from app.repositories.notification_repository import NotificationRepository
from app.schemas.barber_availability import (
    BarberAvailabilityCreate,
    BarberAvailabilityResponse,
    BarberAvailabilityUpdate,
)
from app.services.barber_availability_service import BarberAvailabilityService
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/barber-availability", tags=["Barber Availability"])


@router.post(
    "",
    response_model=BarberAvailabilityResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_availability(
    payload: BarberAvailabilityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("barber")),
):
    barber_repo = BarberRepository(db)
    barber = await barber_repo.get_by_user_id(current_user.id)
    if not barber or barber.id != payload.barber_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only manage your own availability",
        )

    service = BarberAvailabilityService(BarberAvailabilityRepository(db))
    availability = await service.create(payload)

    follower_ids = await FavoriteRepository(db).list_follower_ids(payload.barber_id)
    notification_service = NotificationService(
        notification_repository=NotificationRepository(db),
        device_token_repository=DeviceTokenRepository(db),
    )
    await notification_service.notify_followers_new_slot(
        user_ids=follower_ids,
        barber_name=barber.shop_name or current_user.username,
        day_of_week=payload.day_of_week,
        start_time=payload.start_time,
        end_time=payload.end_time,
    )

    return availability


@router.get(
    "/barber/{barber_id}",
    response_model=list[BarberAvailabilityResponse],
)
async def list_barber_availability(
    barber_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = BarberAvailabilityService(BarberAvailabilityRepository(db))
    return await service.list_by_barber(barber_id)


@router.put(
    "/{availability_id}",
    response_model=BarberAvailabilityResponse,
)
async def update_availability(
    availability_id: int,
    payload: BarberAvailabilityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("barber")),
):
    barber_repo = BarberRepository(db)
    barber = await barber_repo.get_by_user_id(current_user.id)
    if not barber:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Barber profile not found",
        )

    repo = BarberAvailabilityRepository(db)
    availability = await repo.get_by_id(availability_id)
    if not availability or availability.barber_id != barber.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only manage your own availability",
        )

    service = BarberAvailabilityService(BarberAvailabilityRepository(db))
    return await service.update(availability_id, payload)


@router.delete(
    "/{availability_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_availability(
    availability_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("barber")),
):
    barber_repo = BarberRepository(db)
    barber = await barber_repo.get_by_user_id(current_user.id)
    if not barber:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Barber profile not found",
        )

    repo = BarberAvailabilityRepository(db)
    availability = await repo.get_by_id(availability_id)
    if not availability or availability.barber_id != barber.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only manage your own availability",
        )

    service = BarberAvailabilityService(BarberAvailabilityRepository(db))
    await service.delete(availability_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
