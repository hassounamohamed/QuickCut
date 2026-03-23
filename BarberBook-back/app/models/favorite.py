from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    barber_id = Column(Integer, ForeignKey("barbers.id"), nullable=False)

    client = relationship("User", back_populates="favorites", foreign_keys=[client_id])
    barber = relationship("Barber", back_populates="favorites", foreign_keys=[barber_id])
