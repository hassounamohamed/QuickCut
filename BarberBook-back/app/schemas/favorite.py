from datetime import time

from pydantic import BaseModel, ConfigDict


class FavoriteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_id: int
    barber_id: int


class FollowedBarberResponse(BaseModel):
    barber_id: int
    shop_name: str | None = None
    address: str | None = None
    rating: float


class FollowedBarberSlotResponse(BaseModel):
    barber_id: int
    shop_name: str | None = None
    day_of_week: int
    start_time: time
    end_time: time
