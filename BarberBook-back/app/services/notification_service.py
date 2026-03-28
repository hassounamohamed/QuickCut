from fastapi import HTTPException, status

from app.core.expo_push import send_expo_push
from app.repositories.device_token_repository import DeviceTokenRepository
from app.repositories.notification_repository import NotificationRepository


class NotificationService:
    def __init__(
        self,
        notification_repository: NotificationRepository,
        device_token_repository: DeviceTokenRepository | None = None,
    ):
        self.notification_repository = notification_repository
        self.device_token_repository = device_token_repository

    async def notify_users(self, user_ids: list[int], title: str, body: str) -> None:
        unique_ids = list({int(user_id) for user_id in user_ids if user_id})
        if not unique_ids:
            return

        # AsyncSession isn't concurrency-safe; persist and fetch/send push sequentially.
        await self.notification_repository.create_bulk(unique_ids, title, body)
        if self.device_token_repository:
            await self._send_push_to_users(unique_ids, title, body)

    async def notify_followers_new_slot(
        self,
        user_ids: list[int],
        barber_name: str,
        day_of_week: int,
        start_time,
        end_time,
    ):
        day_names = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
        ]
        day_label = day_names[day_of_week] if 0 <= day_of_week < len(day_names) else str(day_of_week)

        title = "New slot available"
        body = (
            f"Barber {barber_name} added a new slot on {day_label} "
            f"from {start_time.strftime('%H:%M')} to {end_time.strftime('%H:%M')}"
        )
        # AsyncSession isn't concurrency-safe; persist and fetch/send push sequentially.
        await self.notification_repository.create_bulk(user_ids, title, body)
        if self.device_token_repository:
            await self._send_push_to_users(user_ids, title, body)

    async def _send_push_to_users(self, user_ids: list[int], title: str, body: str) -> None:
        if not self.device_token_repository or not user_ids:
            return
        tokens = await self.device_token_repository.list_active_tokens_for_users(user_ids)
        await send_expo_push(tokens, title, body)

    async def list_for_user(self, user_id: int):
        return await self.notification_repository.list_for_user(user_id)

    async def mark_read(self, user_id: int, notification_id: int):
        notification = await self.notification_repository.get_by_id(notification_id)
        if not notification or notification.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found",
            )

        return await self.notification_repository.mark_read(notification)
