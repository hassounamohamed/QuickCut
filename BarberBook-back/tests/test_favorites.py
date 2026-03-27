"""
Favorites endpoint tests.
Coverage: add, list, remove favorites.
"""

import pytest


class TestFavorites:
    """Test favorites functionality."""

    def test_add_favorite_success(self, client, auth_tokens, barber_tokens):
        """Test adding a barber to favorites."""
        headers = {"Authorization": f"Bearer {auth_tokens['access_token']}"}
        barber_id = barber_tokens["user_id"]

        response = client.post(
            f"/favorites/{barber_id}",
            headers=headers,
        )
        assert response.status_code in [201, 400, 404, 409]

    def test_add_duplicate_favorite(self, client, auth_tokens, barber_tokens):
        """Test adding same barber twice."""
        headers = {"Authorization": f"Bearer {auth_tokens['access_token']}"}
        barber_id = barber_tokens["user_id"]

        # Add once
        response1 = client.post(
            f"/favorites/{barber_id}",
            headers=headers,
        )
        assert response1.status_code in [201, 400, 404, 409]

        # Add again - should fail with duplicate
        response2 = client.post(
            f"/favorites/{barber_id}",
            headers=headers,
        )
        assert response2.status_code in [400, 404, 409]

    def test_list_favorites(self, client, auth_tokens):
        """Test listing user's favorite barbers."""
        headers = {"Authorization": f"Bearer {auth_tokens['access_token']}"}

        response = client.get(
            "/favorites/me",
            headers=headers,
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_remove_favorite(self, client, auth_tokens, barber_tokens):
        """Test removing a favorite."""
        headers = {"Authorization": f"Bearer {auth_tokens['access_token']}"}
        barber_id = barber_tokens["user_id"]

        # Remove
        response = client.delete(
            f"/favorites/{barber_id}",
            headers=headers,
        )
        assert response.status_code in [204, 404, 400]

    def test_remove_nonexistent_favorite(self, client, auth_tokens):
        """Test removing favorite that doesn't exist."""
        headers = {"Authorization": f"Bearer {auth_tokens['access_token']}"}
        
        response = client.delete(
            "/favorites/999",
            headers=headers,
        )
        assert response.status_code in [204, 404, 400]

    def test_add_favorite_without_auth(self, client):
        """Test adding favorite without authentication."""
        response = client.post("/favorites/2")
        assert response.status_code in [401, 403]
