from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db, get_user_local_date
from app.models.user import User
from app.schemas.user_daily_stat import (
    DailyStatResponceAfterUpsert,
    DailyStatResponse,
    DailyStatUpsert,
)
from app.services import user_daily_stat_service

router = APIRouter()


@router.put("/sessions/today", response_model=DailyStatResponceAfterUpsert)
async def upsert_daily_stats(
    data_in: DailyStatUpsert,
    curr_date: Annotated[date, Depends(get_user_local_date)],
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    response: Response,
):
    data_out, was_created = await user_daily_stat_service.upsert_new_data(
        data_in.total_duration_secs, curr_date, db, user.id
    )
    response.status_code = (
        status.HTTP_201_CREATED if was_created else status.HTTP_200_OK
    )
    return data_out


@router.get("/sessions/today", response_model=DailyStatResponse)
async def display_sessions_data(
    curr_date: Annotated[date, Depends(get_user_local_date)],
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    data_out = await user_daily_stat_service.get_sessions_data(curr_date, db, user.id)
    return data_out
