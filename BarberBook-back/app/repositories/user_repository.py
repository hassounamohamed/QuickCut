from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: int) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def get_by_username(self, username: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.username == username))
        return result.scalars().first()

    async def create_user(
        self,
        email: str,
        username: str,
        hashed_password: str,
        role: str = "user",
    ) -> User:
        user = User(
            email=email,
            username=username,
            hashed_password=hashed_password,
            role=role,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_user(self, user: User, *, email: str | None = None, username: str | None = None) -> User:
        if email is not None:
            user.email = email
        if username is not None:
            user.username = username

        await self.db.commit()
        await self.db.refresh(user)
        return user
