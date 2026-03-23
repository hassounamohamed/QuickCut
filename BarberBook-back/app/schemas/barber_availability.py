from datetime import time

from pydantic import BaseModel, ConfigDict, Field


class BarberAvailabilityBase(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    start_time: time
    end_time: time


class BarberAvailabilityCreate(BarberAvailabilityBase):
    barber_id: int


class BarberAvailabilityUpdate(BaseModel):
    day_of_week: int | None = Field(default=None, ge=0, le=6)
    start_time: time | None = None
    end_time: time | None = None


class BarberAvailabilityResponse(BarberAvailabilityBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    barber_id: int
