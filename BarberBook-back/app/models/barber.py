from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class Barber(Base):
    __tablename__ = "barbers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    shop_name = Column(String(100))
    address = Column(Text)
    latitude = Column(Float)
    longitude = Column(Float)
    rating = Column(Float, default=0)

    user = relationship("User", back_populates="barber")
    bookings = relationship("Booking", back_populates="barber", foreign_keys="Booking.barber_id")
    reviews = relationship("Review", back_populates="barber", foreign_keys="Review.barber_id")
    favorites = relationship("Favorite", back_populates="barber", foreign_keys="Favorite.barber_id")
    availability = relationship("BarberAvailability", back_populates="barber")
    photos = relationship("BarberPhoto", back_populates="barber", cascade="all, delete-orphan")
