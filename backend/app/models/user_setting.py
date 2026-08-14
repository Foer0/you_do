from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, CheckConstraint, Date, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class UserSetting(Base):
    __tablename__ = "user_settings"
    __table_args__ = (
        CheckConstraint("birth_date <= CURRENT_DATE", name="check_birth_date"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    session_secs: Mapped[int] = mapped_column(Integer, server_default="1500")
    break_secs: Mapped[int] = mapped_column(Integer, server_default="300")
    long_break_secs: Mapped[int | None] = mapped_column(Integer)
    long_break_trigger_session: Mapped[int | None] = mapped_column(Integer)
    birth_date: Mapped[date | None] = mapped_column(Date)
    sound_effect: Mapped[str | None] = mapped_column(Text)
    sound_duration_secs: Mapped[int | None] = mapped_column(Integer, server_default="3")
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )

    user: Mapped["User"] = relationship(back_populates="settings", lazy="raise")
