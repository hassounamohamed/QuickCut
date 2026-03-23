from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.review import Review


class ReviewRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_by_barber(self, barber_id: int) -> list[Review]:
        result = await self.db.execute(
            select(Review).where(Review.barber_id == barber_id).order_by(Review.created_at.desc())
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
