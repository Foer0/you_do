from datetime import date
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.local_date import get_local_date
from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.models.user import User

security_scheme = HTTPBearer()


async def get_db():
    async with SessionLocal() as session:
        yield session


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    try:
        token = credentials.credentials
        user_id = decode_access_token(token)
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")

    try:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()
    except NoResultFound:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user


async def get_user_local_date(user: Annotated[User, Depends(get_current_user)]) -> date:
    return get_local_date(user.timezone)
