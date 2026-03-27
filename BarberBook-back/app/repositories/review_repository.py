from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.review import Review


class ReviewRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_by_barber(self, barber_id: int) -> list[Review]:
        result = await self.db.execute(
            select(Review)
            .options(selectinload(Review.client))
            .where(Review.barber_id == barber_id)
            .order_by(Review.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_client_and_reservation_context(
        self,
        client_id: int,
        barber_id: int,
        rating: int,
        comment: str | None,
    ) -> Review | None:
        result = await self.db.execute(
            select(Review).where(
                and_(
                    Review.client_id == client_id,
                    Review.barber_id == barber_id,
                    Review.rating == rating,
                    Review.comment == comment,
                )
            )
        )
        return result.scalars().first()

    async def create(self, client_id: int, barber_id: int, rating: int, comment: str | None) -> Review:
        review = Review(
            client_id=client_id,
            barber_id=barber_id,
            rating=rating,
            comment=comment,
        )
        self.db.add(review)
        await self.db.commit()
        await self.db.refresh(review)
        return review

    async def get_average_rating_for_barber(self, barber_id: int) -> float:
        result = await self.db.execute(
            select(func.avg(Review.rating)).where(Review.barber_id == barber_id)
        )
        avg_value = result.scalar_one_or_none()
        return float(avg_value) if avg_value is not None else 0.0
