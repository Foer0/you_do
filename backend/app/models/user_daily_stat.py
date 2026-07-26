from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Date, ForeignKey, Integer, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class UserDailyStat(Base):
    __tablename__ = "user_daily_stats"
    __table_args__ = (
        UniqueConstraint("user_id", "for_date", name="uq_user_daily_stat_user_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    total_duration_secs: Mapped[int] = mapped_column(Integer)
    for_date: Mapped[date] = mapped_column(Date, server_default=func.current_date())
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE")
    )

    user: Mapped["User"] = relationship(back_populates="user_stats", lazy="raise")
