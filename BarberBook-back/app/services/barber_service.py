import base64
from io import BytesIO

from fastapi import HTTPException, status

from app.repositories.barber_repository import BarberRepository
from app.schemas.barber import BarberCreate


class BarberService:
    def __init__(self, repository: BarberRepository):
        self.repository = repository

    async def create(self, payload: BarberCreate):
        user_exists = await self.repository.user_exists(payload.user_id)
        if not user_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        existing = await self.repository.get_by_user_id(payload.user_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This user is already linked to a barber profile",
            )

        return await self.repository.create(
            user_id=payload.user_id,
            shop_name=payload.shop_name,
            address=payload.address,
            latitude=payload.latitude,
            longitude=payload.longitude,
        )

    async def list_all(self):
        return await self.repository.list_all()

    async def update_profile_for_user(self, user_id: int, payload: dict):
        barber = await self.repository.get_by_user_id(user_id)
        if not barber:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber profile not found for this user",
            )

        if not payload:
            return barber

        return await self.repository.update_profile(barber, payload)

    async def add_photo_for_user(self, user_id: int, photo_url: str):
        barber = await self.repository.get_by_user_id(user_id)
        if not barber:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber profile not found for this user",
            )

        return await self.repository.add_photo(barber.id, photo_url)

    async def list_photos_for_user(self, user_id: int):
        barber = await self.repository.get_by_user_id(user_id)
        if not barber:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber profile not found for this user",
            )
        return await self.repository.list_photos(barber.id)

    async def delete_photo_for_user(self, user_id: int, photo_id: int):
        barber = await self.repository.get_by_user_id(user_id)
        if not barber:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber profile not found for this user",
            )

        photo = await self.repository.get_photo(photo_id)
        if not photo or photo.barber_id != barber.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photo not found",
            )

        await self.repository.delete_photo(photo)

    async def generate_qr_payload_for_barber(self, barber_id: int, booking_link: str):
        barber = await self.repository.get_by_id(barber_id)
        if not barber:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber not found",
            )

        qr_png_base64 = None
        try:
            import qrcode

            image = qrcode.make(booking_link)
            buffer = BytesIO()
            image.save(buffer, format="PNG")
            qr_png_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        except Exception:
            qr_png_base64 = None

        return {
            "barber_id": barber_id,
            "booking_link": booking_link,
            "qr_png_base64": qr_png_base64,
        }
