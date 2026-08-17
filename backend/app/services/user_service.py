from argon2.exceptions import VerifyMismatchError
from sqlalchemy import insert, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_passwd, verify_passwd
from app.models.user import User
from app.models.user_setting import UserSetting
from app.services import auth_service


def create_user_default_settings(user_id: int, session: AsyncSession) -> UserSetting:
    default_settings = UserSetting(user_id=user_id)
    session.add(default_settings)
    return default_settings


async def create_user(user_data: dict, session: AsyncSession) -> User:
    stmt = insert(User).values(user_data).returning(User)
    user = (await session.execute(stmt)).scalars().one()
    create_user_default_settings(user.id, session)

    await session.commit()
    return user


async def get_user_by_email(user_data: dict, session: AsyncSession) -> User:
    stmt = select(User).where(User.email == user_data["email"])
    user_obj = (await session.execute(stmt)).scalars().one()
    return user_obj


async def get_user_settings(user_id: int, session: AsyncSession) -> UserSetting:
    result = await session.execute(
        select(UserSetting).where(UserSetting.user_id == user_id)
    )
    settings = result.scalar_one_or_none()
    if settings is None:
        settings = create_user_default_settings(user_id, session)

    await session.commit()
    return settings


async def change_settings(
    data: dict, user_id: int, session: AsyncSession
) -> UserSetting:
    result = await session.execute(
        update(UserSetting)
        .where(UserSetting.user_id == user_id)
        .values(data)
        .returning(UserSetting)
    )
    await session.commit()
    return result.scalars().one()


async def change_password(data: dict, user: User, session: AsyncSession) -> User:
    if user.hashed_password is None:
        raise auth_service.InvalidCredentialsError("Incorrect email or password")
    try:
        verify_passwd(data["current_password"], user.hashed_password)
    except VerifyMismatchError:
        raise auth_service.InvalidCredentialsError("Incorrect password")
    new_hash_passwd = hash_passwd(data["new_password"])
    stmt = (
        update(User)
        .where(User.id == user.id)
        .values(hashed_password=new_hash_passwd, version=User.version + 1)
        .returning(User)
    )
    user = (await session.execute(stmt)).scalars().one()
    await session.commit()
    return user


async def is_user_token_version_valid(
    user_id: int, version: int, session: AsyncSession
) -> bool:
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalars().one()
    return True if version == user.version else False
