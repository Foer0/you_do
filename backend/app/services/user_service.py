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


async def change_password(data: dict, user: User, session: AsyncSession):
    # todo: реализация будет после наличия реализации refresh-токена
    """
    получить прошлый пароль (хеш) из БД
    сравнить присланный прошлый пароль с хешом
    отправить новый пароль делать хеш
    запись в БД
    """
    if user.hashed_password is None:
        raise auth_service.InvalidCredentialsError("Incorrect email or password")

    verify_passwd(data["current_password"], user.hashed_password)
    """ОБработать исключение"""
    new_hash_passwd = hash_passwd(data["new_password"])
    # stmt = update(User).where(User.id == user.id).values(...)
