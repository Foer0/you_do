from collections.abc import Sequence
from datetime import date

from dateutil.relativedelta import relativedelta
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task


async def get_tasks(
    target_date: date, session: AsyncSession, user_id: int
) -> Sequence[Task]:
    stmt = select(Task).where(Task.user_id == user_id, Task.created_at == target_date)
    result = await session.scalars(stmt)
    return result.all()


async def add_new_task(data: dict, session: AsyncSession, user_id: int) -> Task:
    data["user_id"] = user_id
    task = Task(**data)
    session.add(task)
    await session.commit()
    return task


async def delete_task(task_id: int, session: AsyncSession, user_id: int) -> None:
    result = await session.execute(
        select(Task).where(Task.user_id == user_id, Task.id == task_id)
    )
    task = result.scalars().one()
    await session.delete(task)
    await session.commit()


async def update_task(
    data: dict, task_id: int, session: AsyncSession, user_id: int
) -> Task:
    stmt = (
        update(Task)
        .where(Task.id == task_id, Task.user_id == user_id)
        .values(**data)
        .returning(Task)
    )
    result = await session.execute(stmt)
    task = result.scalars().one()
    await session.commit()
    return task


async def get_daily_monthly_tasks(
    date_: date, session: AsyncSession, user_id: int
) -> list[Task]:
    start = date_.replace(day=1)
    end = start + relativedelta(months=1)

    stmt = select(Task).where(
        Task.user_id == user_id, Task.created_at >= start, Task.created_at < end
    )

    result = (await session.execute(stmt)).scalars()
    return [obj for obj in result]
