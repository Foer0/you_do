from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import inspect
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import SOUNDS
from app.core.dependencies import get_current_user, get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    set_refresh_cookie,
)
from app.models.user import User
from app.schemas.user_setting import (
    PasswordResponse,
    PasswordUpdate,
    SettingResponse,
    SettingUpdate,
)
from app.services import auth_service, user_service

router = APIRouter(tags=["settings"])


@router.get("/users/me/settings", response_model=SettingResponse)
async def get_session_settings(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    settings = await user_service.get_user_settings(user.id, db)
    settings_dict = {
        col.key: getattr(settings, col.key)
        for col in inspect(settings).mapper.column_attrs
    }
    return SettingResponse(**settings_dict, email=user.email)


@router.patch("/users/me/settings", response_model=SettingResponse)
async def update_base_settings(
    data_in: SettingUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    user_data = data_in.model_dump(exclude_unset=True)
    if "session_secs" in user_data and user_data["session_secs"] is None:
        del user_data["session_secs"]
    if "break_secs" in user_data and user_data["break_secs"] is None:
        del user_data["break_secs"]
    if len(user_data) == 0:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "Your request could not be processed. Please ensure all information is entered correctly.",
        )

    updated_settings = await user_service.change_settings(user_data, user.id, db)
    settings_dict = {
        col.key: getattr(updated_settings, col.key)
        for col in inspect(updated_settings).mapper.column_attrs
    }
    return SettingResponse(**settings_dict, email=user.email)


@router.get("/users/me/settings/sounds")
def get_available_sounds() -> list[dict]:
    return SOUNDS


@router.patch("/users/me/settings/password", response_model=PasswordResponse)
async def update_password(
    data_in: PasswordUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    response: Response,
):
    user_data = data_in.model_dump()
    try:
        usr = await user_service.change_password(user_data, user, db)
    except auth_service.InvalidCredentialsError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Incorrect password")
    except NoResultFound:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "Something went wrong, try again later",
        )

    new_access = create_access_token(usr.id)
    new_refresh = create_refresh_token(usr.id, usr.version)

    set_refresh_cookie(response, new_refresh)

    return {
        "msg": "The password has been changed successfully",
        "token": {"access_token": new_access, "token_type": "bearer"},
    }
