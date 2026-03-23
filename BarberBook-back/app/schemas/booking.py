from datetime import date, datetime, time
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ReservationStatus = Literal[
    "pending",
    "accepted",
    "cancelled_by_client",
    "cancelled_by_barber",
    "completed",
]


class ReservationCreate(BaseModel):
    barber_id: int
    booking_date: date
    booking_time: time


class ReservationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_id: int
    barber_id: int
    booking_date: date
    booking_time: time
    status: str


class ReservationStatusUpdate(BaseModel):
    status: ReservationStatus


class DailyScheduleItem(BaseModel):
    reservation_id: int
    client_id: int
    booking_time: time
    status: str


class BarberDashboardResponse(BaseModel):
    barber_id: int
    date: date
    total_reservations: int
    accepted_reservations: int
    pending_reservations: int
    waiting_count: int
    schedule: list[DailyScheduleItem]


class QueueEntryResponse(BaseModel):
    reservation_id: int
    client_id: int
    booking_time: time
    status: str


class LiveQueueResponse(BaseModel):
    barber_id: int
    date: date
    waiting_count: int
    queue: list[QueueEntryResponse]


class BarberQrResponse(BaseModel):
    barber_id: int
    booking_link: str
    qr_png_base64: str | None = None


class ReservationActionResponse(BaseModel):
    message: str
    reservation: ReservationResponse
