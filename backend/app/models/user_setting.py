from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class UserSetting(Base):
    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    session_secs: Mapped[int] = mapped_column(Integer, server_default="1500")
    break_secs: Mapped[int] = mapped_column(Integer, server_default="300")
    long_break_secs: Mapped[int | None] = mapped_column(Integer)
    sound_effect: Mapped[str | None] = mapped_column(Text)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )

    user: Mapped["User"] = relationship(back_populates="settings", lazy="raise")
