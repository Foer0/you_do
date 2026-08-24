import asyncio
from collections.abc import Mapping
from typing import Any

from argon2.exceptions import VerifyMismatchError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from jwt import InvalidTokenError
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_passwd,
    verify_passwd,
)
from app.models.user import User
from app.services import user_service


class InvalidCredentialsError(Exception):
    pass


class EmailAlreadyExistsError(Exception):
    pass


class GoogleAccountConflictError(Exception):
    pass


async def register_new_user(data: dict, session: AsyncSession) -> User:
    data["hashed_password"] = hash_passwd(data.pop("password"))
    try:
        return await user_service.create_user(data, session)
    except IntegrityError:
        await session.rollback()
        raise EmailAlreadyExistsError("Email already registered")


async def authenticate_user(data: dict, session: AsyncSession) -> tuple:
    try:
        user: User = await user_service.get_user_by_email(data, session)
    except NoResultFound:
        raise InvalidCredentialsError("Incorrect email or password")

    if user.hashed_password is None:
        raise InvalidCredentialsError("Incorrect email or password")

    try:
        verify_passwd(data["password"], user.hashed_password)
    except VerifyMismatchError:
        raise InvalidCredentialsError("Incorrect email or password")

    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id, user.version)
    return access, refresh


async def authenticate_google_user(
    id_token: str, timezone: str, session: AsyncSession
) -> User:
    idinfo = await verify_google_token(id_token)
    email = idinfo["email"]

    try:
        user = await user_service.get_user_by_email({"email": email}, session)
        if not user.is_another_auth:
            raise GoogleAccountConflictError(
                "The user is already registered using a password"
            )
        return user
    except NoResultFound:
        data = {
            "timezone": timezone,
            "email": email,
            "hashed_password": None,
            "is_another_auth": True,
        }
        return await user_service.create_user(data, session)


async def check_refresh_token_payload(payload: dict, session: AsyncSession) -> dict:
    is_valid_version = await user_service.is_user_token_version_valid(
        int(payload["sub"]), int(payload["version"]), session
    )

    if not is_valid_version:
        raise InvalidTokenError("Incorret refresh token's version")
    return payload


async def verify_google_token(token: str) -> Mapping[str, Any]:
    return await asyncio.to_thread(
        id_token.verify_oauth2_token,
        token,
        google_requests.Request(),
        settings.google_client_id,
    )
