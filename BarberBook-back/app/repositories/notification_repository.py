from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


class NotificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_bulk(self, user_ids: list[int], title: str, body: str) -> None:
        if not user_ids:
            return
        notifications = [Notification(user_id=user_id, title=title, body=body) for user_id in user_ids]
        self.db.add_all(notifications)
        await self.db.commit()

    async def list_for_user(self, user_id: int) -> list[Notification]:
        result = await self.db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc(), Notification.id.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, notification_id: int) -> Notification | None:
        result = await self.db.execute(select(Notification).where(Notification.id == notification_id))
        return result.scalars().first()

    async def mark_read(self, notification: Notification) -> Notification:
        notification.is_read = True
        await self.db.commit()
        await self.db.refresh(notification)
        return notification
