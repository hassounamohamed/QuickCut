from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile, status
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
UPLOADS_DIR = Path(__file__).resolve().parents[1] / "static" / "uploads"
MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024


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


@router.post("/me/photos/upload", response_model=BarberPhotoResponse, status_code=status.HTTP_201_CREATED)
async def upload_my_barber_photo(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("barber")),
):
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed",
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image is too large. Max size is 5MB",
        )

    suffix = Path(file.filename or "").suffix or ".jpg"
    filename = f"{uuid4().hex}{suffix}"
    file_path = UPLOADS_DIR / filename
    file_path.write_bytes(content)

    photo_url = f"{str(request.base_url).rstrip('/')}/uploads/{filename}"
    service = BarberService(BarberRepository(db))
    return await service.add_photo_for_user(current_user.id, photo_url)


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
