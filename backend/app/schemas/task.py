from datetime import date

from pydantic import BaseModel, ConfigDict

from app.models.task import TaskStatus


class Base(BaseModel):
    content: str | None
    status: TaskStatus


class TaskCreate(Base):
    created_at: date | None = None


class TaskResponse(Base):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: date


class TaskUpdate(BaseModel):
    content: str | None = None
    status: TaskStatus | None = None
