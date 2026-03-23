from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_role
from app.core.config import APP_SCHEME
from app.db.session import get_db
from app.models.user import User
from app.repositories.barber_repository import BarberRepository
from app.schemas.barber import (
    BarberCreate,
    BarberPhotoCreate,
    BarberPhotoResponse,
    BarberResponse,
    BarberUpdate,
)
from app.schemas.booking import BarberQrResponse
from app.services.barber_service import BarberService

router = APIRouter(prefix="/barbers", tags=["Barbers"])


@router.post("", response_model=BarberResponse, status_code=status.HTTP_201_CREATED)
async def create_barber(payload: BarberCreate, db: AsyncSession = Depends(get_db)):
    service = BarberService(BarberRepository(db))
    return await service.create(payload)


@router.get("", response_model=list[BarberResponse])
async def list_barbers(db: AsyncSession = Depends(get_db)):
    service = BarberService(BarberRepository(db))
    return await service.list_all()


@router.patch("/me", response_model=BarberResponse)
async def update_my_barber_profile(
    payload: BarberUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("barber")),
):
    service = BarberService(BarberRepository(db))
    return await service.update_profile_for_user(
        user_id=current_user.id,
        payload=payload.model_dump(exclude_unset=True),
    )


@router.post("/me/photos", response_model=BarberPhotoResponse, status_code=status.HTTP_201_CREATED)
async def add_my_barber_photo(
    payload: BarberPhotoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("barber")),
):
    service = BarberService(BarberRepository(db))
    return await service.add_photo_for_user(current_user.id, payload.photo_url)


@router.get("/me/photos", response_model=list[BarberPhotoResponse])
async def list_my_barber_photos(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("barber")),
):
    service = BarberService(BarberRepository(db))
    return await service.list_photos_for_user(current_user.id)


@router.delete("/me/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_barber_photo(
    photo_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("barber")),
):
    service = BarberService(BarberRepository(db))
    await service.delete_photo_for_user(current_user.id, photo_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{barber_id}/qr", response_model=BarberQrResponse)
async def generate_barber_qr(
    barber_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = BarberService(BarberRepository(db))
    booking_link = f"{APP_SCHEME}://book?barber_id={barber_id}"
    return await service.generate_qr_payload_for_barber(barber_id, booking_link)
