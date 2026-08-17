from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.task import Task
    from app.models.user_daily_stat import UserDailyStat
    from app.models.user_setting import UserSetting


class User(Base):
    __tablename__ = "users"

    __table_args__ = (
        CheckConstraint("email LIKE '%@%'", name="check_email_format"),
        CheckConstraint(
            "(is_another_auth = TRUE AND hashed_password IS NULL) OR (is_another_auth = FALSE AND hashed_password IS NOT NULL)",
            name="check_password_presence_by_auth_type",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    hashed_password: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[date] = mapped_column(Date, server_default=func.current_date())
    is_another_auth: Mapped[bool] = mapped_column(Boolean, default=False)
    timezone: Mapped[str] = mapped_column(Text, server_default="UTC")
    version: Mapped[int] = mapped_column(Integer, server_default="1")

    tasks: Mapped[list["Task"]] = relationship(back_populates="user", lazy="raise")
    user_stats: Mapped[list["UserDailyStat"]] = relationship(
        back_populates="user", lazy="raise"
    )
    settings: Mapped["UserSetting"] = relationship(back_populates="user", lazy="raise")
