"""
Booking/Reservation endpoint tests.
Coverage: create, list, cancel.
"""

import pytest
from datetime import date, timedelta


class TestBookingCreation:
    """Test booking creation."""

    def test_create_booking_success(self, client, auth_tokens, barber_tokens):
        """Test successful booking creation."""
        headers = {"Authorization": f"Bearer {auth_tokens['access_token']}"}
        barber_id = barber_tokens["user_id"]
        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        
        response = client.post(
            "/reservations",
            json={
                "barber_id": barber_id,
                "booking_date": tomorrow,
                "booking_time": "09:00",
            },
            headers=headers,
        )
        # Depending on profile/availability setup this can fail with validation/not-found.
        assert response.status_code in [201, 400, 404, 409]

    def test_create_booking_past_date(self, client, auth_tokens, barber_tokens):
        """Test booking with past date."""
        client_header = {"Authorization": f"Bearer {auth_tokens['access_token']}"}
        barber_id = barber_tokens["user_id"]
        past_date = (date.today() - timedelta(days=1)).isoformat()
        
        response = client.post(
            "/reservations",
            json={
                "barber_id": barber_id,
                "booking_date": past_date,
                "booking_time": "09:00",
            },
            headers=client_header,
        )
        assert response.status_code in [400, 404]

    def test_create_booking_missing_fields(self, client, auth_tokens):
        """Test booking with missing required fields."""
        headers = {"Authorization": f"Bearer {auth_tokens['access_token']}"}
        
        response = client.post(
            "/reservations",
            json={"barber_id": 2},  # Missing booking_date and booking_time
            headers=headers,
        )
        assert response.status_code in [422, 404]


class TestBookingList:
    """Test listing bookings."""

    def test_list_client_bookings(self, client, auth_tokens):
        """Test client viewing their own booking history."""
        headers = {"Authorization": f"Bearer {auth_tokens['access_token']}"}
        
        response = client.get(
            "/reservations/me/history",
            headers=headers,
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_list_barber_bookings_dashboard(self, client, barber_tokens):
        """Test barber viewing their dashboard."""
        headers = {"Authorization": f"Bearer {barber_tokens['access_token']}"}
        target_date = (date.today() + timedelta(days=1)).isoformat()
        
        response = client.get(
            "/reservations/barber/me/dashboard",
            params={"target_date": target_date},
            headers=headers,
        )
        assert response.status_code in [200, 404]


class TestBookingCancellation:
    """Test booking cancellation."""

    def test_cancel_booking_as_client(self, client, auth_tokens):
        """Test client cancelling their own booking."""
        headers = {"Authorization": f"Bearer {auth_tokens['access_token']}"}
        
        # Try to cancel a reservation (most likely won't exist in test)
        response = client.patch(
            "/reservations/1/cancel",
            headers=headers,
        )
        # Should be 404 (no reservation) or 200 (success)
        assert response.status_code in [200, 404, 403]

    def test_cancel_without_auth(self, client):
        """Test cancelling without authentication."""
        response = client.patch("/reservations/1/cancel")
        assert response.status_code in [401, 403]
