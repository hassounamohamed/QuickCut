from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import LoginRequest, Token, UserCreate, UserResponse, UserUpdate
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(UserRepository(db))
    return await auth_service.register(payload)


@router.post("/login", response_model=Token)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(UserRepository(db))
    return await auth_service.login(payload)


@router.get('/me', response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch('/me', response_model=UserResponse)
async def update_me(
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    auth_service = AuthService(UserRepository(db))
    return await auth_service.update_profile(current_user, payload)
