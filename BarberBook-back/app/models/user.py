from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  # client or barber

    barber = relationship("Barber", back_populates="user", uselist=False)
    bookings = relationship("Booking", back_populates="client", foreign_keys="Booking.client_id")
    reviews = relationship("Review", back_populates="client", foreign_keys="Review.client_id")
    favorites = relationship("Favorite", back_populates="client", foreign_keys="Favorite.client_id")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    device_tokens = relationship("DeviceToken", back_populates="user", cascade="all, delete-orphan")
