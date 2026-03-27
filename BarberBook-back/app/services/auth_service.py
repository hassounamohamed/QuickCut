from fastapi import HTTPException, status

from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.user_repository import UserRepository
from app.schemas.user import LoginRequest, Token, UserCreate, UserUpdate


class AuthService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    async def register(self, payload: UserCreate):
        if payload.role not in {"user", "barber"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be either 'user' or 'barber'",
            )

        if payload.password != payload.confirme_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password and confirme_password do not match",
            )

        existing_by_email = await self.user_repository.get_by_email(payload.email)
        if existing_by_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already in use",
            )

        existing_by_username = await self.user_repository.get_by_username(payload.username)
        if existing_by_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already in use",
            )

        hashed_password = hash_password(payload.password)

        return await self.user_repository.create_user(
            email=payload.email,
            username=payload.username,
            hashed_password=hashed_password,
            role=payload.role,
        )

    async def login(self, payload: LoginRequest) -> Token:
        user = await self.user_repository.get_by_email(payload.identifier)
        if not user:
            user = await self.user_repository.get_by_username(payload.identifier)

        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username/email or password",
            )

        token = create_access_token(
            data={
                "sub": str(user.id),
                "email": user.email,
                "username": user.username,
                "role": user.role,
            }
        )

        return Token(access_token=token)

    async def update_profile(self, current_user, payload: UserUpdate):
        next_email = payload.email.strip() if payload.email is not None else None
        next_username = payload.username.strip() if payload.username is not None else None

        if next_email is not None and next_email != current_user.email:
            existing_by_email = await self.user_repository.get_by_email(next_email)
            if existing_by_email and existing_by_email.id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email is already in use",
                )

        if next_username is not None and next_username != current_user.username:
            existing_by_username = await self.user_repository.get_by_username(next_username)
            if existing_by_username and existing_by_username.id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username is already in use",
                )

        return await self.user_repository.update_user(
            current_user,
            email=next_email,
            username=next_username,
        )
