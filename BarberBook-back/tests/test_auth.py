"""
Authentication endpoint tests.
Coverage: register, login.
"""

import pytest


class TestRegistration:
    """Test user registration."""

    def test_register_client_success(self, client):
        """Test successful user registration."""
        response = client.post(
            "/auth/register",
            json={
                "email": "newclient@example.com",
                "username": "newclient",
                "password": "securepass123",
                "confirme_password": "securepass123",
                "role": "user",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newclient@example.com"
        assert data["username"] == "newclient"
        assert data["role"] == "user"

    def test_register_barber_success(self, client):
        """Test successful barber registration."""
        response = client.post(
            "/auth/register",
            json={
                "email": "newbarber@example.com",
                "username": "newbarber",
                "password": "securepass123",
                "confirme_password": "securepass123",
                "role": "barber",
            },
        )
        if response.status_code != 201:
            print(f"Response: {response.status_code} - {response.json()}")
        assert response.status_code == 201
        data = response.json()
        assert data["role"] == "barber"

    def test_register_password_mismatch(self, client):
        """Test registration with mismatched passwords."""
        response = client.post(
            "/auth/register",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "password": "password123",
                "confirme_password": "password456",
                "role": "user",
            },
        )
        assert response.status_code == 400

    def test_register_duplicate_email(self, client, auth_tokens):
        """Test registration with duplicate email."""
        response = client.post(
            "/auth/register",
            json={
                "email": "testuser@example.com",  # Already registered in auth_tokens
                "username": "newuser",
                "password": "password123",
                "confirme_password": "password123",
                "role": "user",
            },
        )
        assert response.status_code == 400

    def test_register_duplicate_username(self, client, auth_tokens):
        """Test registration with duplicate username."""
        response = client.post(
            "/auth/register",
            json={
                "email": "newemail@example.com",
                "username": "testuser",  # Already registered in auth_tokens
                "password": "password123",
                "confirme_password": "password123",
                "role": "user",
            },
        )
        assert response.status_code == 400


class TestLogin:
    """Test user login."""

    def test_login_success(self, client, auth_tokens):
        """Test successful login (using fixture which tests login)."""
        assert auth_tokens["access_token"]
        assert auth_tokens["user_id"]

    def test_login_wrong_password(self, client):
        """Test login with wrong password."""
        # First register a user
        client.post(
            "/auth/register",
            json={
                "email": "wrongpass@example.com",
                "username": "wrongpass",
                "password": "password123",
                "confirme_password": "password123",
                "role": "user",
            },
        )
        # Try login with wrong password
        response = client.post(
            "/auth/login",
            json={
                "identifier": "wrongpass",
                "password": "wrongpassword",
            },
        )
        assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        """Test login with non-existent username."""
        response = client.post(
            "/auth/login",
            json={
                "identifier": "nonexistent",
                "password": "password123",
            },
        )
        assert response.status_code == 401
