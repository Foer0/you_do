from datetime import date
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Date, ForeignKey, Text, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class TaskStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    DONE = "done"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    content: Mapped[str | None] = mapped_column(Text)
    status: Mapped[TaskStatus] = mapped_column(
        SAEnum(TaskStatus, name="task_status"), default=TaskStatus.IN_PROGRESS
    )
    created_at: Mapped[date] = mapped_column(Date, server_default=func.current_date())
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE")
    )

    user: Mapped["User"] = relationship(back_populates="tasks", lazy="raise")
