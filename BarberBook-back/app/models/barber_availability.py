from sqlalchemy import Column, Integer, Time, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class BarberAvailability(Base):
    __tablename__ = "barber_availability"

    id = Column(Integer, primary_key=True, index=True)
    barber_id = Column(Integer, ForeignKey("barbers.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday ... 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    barber = relationship("Barber", back_populates="availability")
