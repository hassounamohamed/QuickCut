from pydantic import BaseModel, ConfigDict, Field


class DeviceTokenRegister(BaseModel):
    token: str = Field(..., min_length=10, max_length=300)


class DeviceTokenResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    token: str
    is_active: bool
