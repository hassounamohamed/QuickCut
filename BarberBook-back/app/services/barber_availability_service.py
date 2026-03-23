from fastapi import HTTPException, status

from app.repositories.barber_availability_repository import BarberAvailabilityRepository
from app.schemas.barber_availability import (
    BarberAvailabilityCreate,
    BarberAvailabilityUpdate,
)


class BarberAvailabilityService:
    def __init__(self, repository: BarberAvailabilityRepository):
        self.repository = repository

    def _validate_time_range(self, start_time, end_time):
        if start_time >= end_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="start_time must be before end_time",
            )

    async def create(self, payload: BarberAvailabilityCreate):
        exists = await self.repository.barber_exists(payload.barber_id)
        if not exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber not found",
            )

        self._validate_time_range(payload.start_time, payload.end_time)
        return await self.repository.create(
            barber_id=payload.barber_id,
            day_of_week=payload.day_of_week,
            start_time=payload.start_time,
            end_time=payload.end_time,
        )

    async def list_by_barber(self, barber_id: int):
        exists = await self.repository.barber_exists(barber_id)
        if not exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barber not found",
            )

        return await self.repository.list_by_barber(barber_id)

    async def update(self, availability_id: int, payload: BarberAvailabilityUpdate):
        availability = await self.repository.get_by_id(availability_id)
        if not availability:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Availability not found",
            )

        update_data = payload.model_dump(exclude_unset=True)
        if not update_data:
            return availability

        start_time = update_data.get("start_time", availability.start_time)
        end_time = update_data.get("end_time", availability.end_time)
        self._validate_time_range(start_time, end_time)

        return await self.repository.update(availability, update_data)

    async def delete(self, availability_id: int):
        availability = await self.repository.get_by_id(availability_id)
        if not availability:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Availability not found",
            )

        await self.repository.delete(availability)
