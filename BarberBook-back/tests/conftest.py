"""
Test configuration and fixtures for BarberBook backend tests.
Run: pytest
"""

import asyncio
import os
from typing import AsyncGenerator

import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from fastapi.testclient import TestClient


# Test database setup
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    """Create test database and yield session."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

    async with async_session() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
def client(test_db):
    """Create test client with test database."""
    async def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)


@pytest.fixture
def auth_tokens(client):
    """Register test user and return auth tokens."""
    # Register
    register_response = client.post(
        "/auth/register",
        json={
            "email": "testuser@example.com",
            "username": "testuser",
            "password": "password123",
            "confirme_password": "password123",
            "role": "user",
        },
    )
    assert register_response.status_code == 201
    user_data = register_response.json()

    # Login
    login_response = client.post(
        "/auth/login",
        json={
            "identifier": "testuser",
            "password": "password123",
        },
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    
    return {
        "access_token": token_data["access_token"],
        "user_id": user_data["id"],
    }


@pytest.fixture
def barber_tokens(client):
    """Register test barber and return auth tokens."""
    # Register as barber
    register_response = client.post(
        "/auth/register",
        json={
            "email": "testbarber@example.com",
            "username": "testbarber",
            "password": "password123",
            "confirme_password": "password123",
            "role": "barber",
        },
    )
    assert register_response.status_code == 201
    user_data = register_response.json()

    # Login
    login_response = client.post(
        "/auth/login",
        json={
            "identifier": "testbarber",
            "password": "password123",
        },
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    
    return {
        "access_token": token_data["access_token"],
        "user_id": user_data["id"],
    }
