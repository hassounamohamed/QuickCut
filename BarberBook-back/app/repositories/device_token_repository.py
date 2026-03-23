from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.device_token import DeviceToken


class DeviceTokenRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_token(self, token: str) -> DeviceToken | None:
        result = await self.db.execute(select(DeviceToken).where(DeviceToken.token == token))
        return result.scalars().first()

    async def register(self, user_id: int, token: str) -> DeviceToken:
        existing = await self.get_by_token(token)
        if existing:
            existing.user_id = user_id
            existing.is_active = True
            await self.db.commit()
            await self.db.refresh(existing)
            return existing

        device_token = DeviceToken(user_id=user_id, token=token, is_active=True)
        self.db.add(device_token)
        await self.db.commit()
        await self.db.refresh(device_token)
        return device_token

    async def deactivate(self, user_id: int, token: str) -> bool:
        existing = await self.get_by_token(token)
        if not existing or existing.user_id != user_id:
            return False
        existing.is_active = False
        await self.db.commit()
        return True

    async def list_active_tokens_for_users(self, user_ids: list[int]) -> list[str]:
        if not user_ids:
            return []
        result = await self.db.execute(
            select(DeviceToken.token).where(
                DeviceToken.user_id.in_(user_ids),
                DeviceToken.is_active.is_(True),
            )
        )
        return list(result.scalars().all())
