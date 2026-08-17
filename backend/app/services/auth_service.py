from argon2.exceptions import VerifyMismatchError
from jwt import InvalidTokenError
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession

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


async def check_refresh_token_payload(payload: dict, session: AsyncSession) -> dict:
    is_valid_version = await user_service.is_user_token_version_valid(
        int(payload["sub"]), int(payload["version"]), session
    )

    if not is_valid_version:
        raise InvalidTokenError("Incorret refresh token's version")
    return payload
