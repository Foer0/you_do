from collections.abc import Sequence
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.core.local_date import get_local_date
from app.models.user import User
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.services import task_service

router = APIRouter()


@router.get("/tasks", response_model=Sequence[TaskResponse])
async def display_tasks(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    for_date: Annotated[date | None, Query()] = None,
):
    if for_date is None:
        for_date = get_local_date(user.timezone)
    tasks_out = await task_service.get_tasks(for_date, db, user.id)
    return tasks_out


@router.post("/tasks", response_model=TaskResponse)
async def add_task(
    task_in: TaskCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    body = task_in.model_dump()
    if "created_at" in body and body["created_at"] is None:
        body["created_at"] = get_local_date(user.timezone)
    task_out = await task_service.add_new_task(body, db, user.id)
    return task_out


@router.delete("/tasks/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_task(
    id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    try:
        await task_service.delete_task(id, db, user.id)
    except NoResultFound:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not Found")


@router.patch("/tasks/{id}", response_model=TaskResponse)
async def change_task(
    id: int,
    task_in: TaskUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    body = task_in.model_dump(exclude_unset=True)
    if body.get("status") is None and "status" in body:
        del body["status"]
    if len(body) == 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Nothing to Update")
    try:
        updated_task = await task_service.update_task(body, id, db, user.id)
    except NoResultFound:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not Found")
    return updated_task


@router.get("/statistics/tasks", response_model=list[TaskResponse])
async def display_stats(
    date_: Annotated[date, Query()],
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    tasks = await task_service.get_daily_monthly_tasks(date_, db, user.id)
    return tasks
