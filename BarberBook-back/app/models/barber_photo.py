from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class BarberPhoto(Base):
    __tablename__ = "barber_photos"

    id = Column(Integer, primary_key=True, index=True)
    barber_id = Column(Integer, ForeignKey("barbers.id"), nullable=False)
    photo_url = Column(String(500), nullable=False)

    barber = relationship("Barber", back_populates="photos")
