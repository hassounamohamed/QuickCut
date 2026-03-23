from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.device_token_repository import DeviceTokenRepository
from app.repositories.notification_repository import NotificationRepository
from app.schemas.device_token import DeviceTokenRegister, DeviceTokenResponse
from app.schemas.notification import NotificationResponse
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.post("/device-token", response_model=DeviceTokenResponse, status_code=status.HTTP_201_CREATED)
async def register_device_token(
    payload: DeviceTokenRegister,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register an Expo push token for the authenticated user's device."""
    repo = DeviceTokenRepository(db)
    return await repo.register(user_id=current_user.id, token=payload.token)


@router.delete("/device-token", status_code=status.HTTP_204_NO_CONTENT)
async def deregister_device_token(
    payload: DeviceTokenRegister,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove an Expo push token when the user logs out or disables notifications."""
    repo = DeviceTokenRepository(db)
    await repo.deactivate(user_id=current_user.id, token=payload.token)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=list[NotificationResponse])
async def list_my_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = NotificationService(NotificationRepository(db))
    return await service.list_for_user(current_user.id)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_as_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = NotificationService(NotificationRepository(db))
    return await service.mark_read(current_user.id, notification_id)
