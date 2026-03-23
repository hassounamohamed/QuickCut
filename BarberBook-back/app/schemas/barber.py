from pydantic import BaseModel, ConfigDict, Field


class BarberPhotoCreate(BaseModel):
    photo_url: str


class BarberPhotoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    barber_id: int
    photo_url: str


class BarberCreate(BaseModel):
    user_id: int
    shop_name: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class BarberUpdate(BaseModel):
    shop_name: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class BarberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    shop_name: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    rating: float
    photos: list[BarberPhotoResponse] = Field(default_factory=list)
