import uuid
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from fastapi import Response

from app.core.config import settings

ALGORITHM = "HS256"
REFRESH_EXPIRE_DAYS = 14


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> int:
    payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    return int(payload["sub"])


def hash_passwd(passwd: str) -> str:
    ph = PasswordHasher()
    hashed_passwd = ph.hash(passwd)
    return hashed_passwd


def verify_passwd(passwd: str, hash_passwd: str) -> None:
    ph = PasswordHasher()
    ph.verify(hash_passwd, passwd)


def create_refresh_token(user_id: int, version: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_EXPIRE_DAYS)
    payload = {
        "jti": str(uuid.uuid4()),
        "sub": str(user_id),
        "type": "refresh",
        "exp": expire,
        "version": version,
    }
    return jwt.encode(payload, settings.refresh_secret_key, algorithm=ALGORITHM)


def decode_refresh_token(token: str) -> dict:
    payload = jwt.decode(token, settings.refresh_secret_key, algorithms=[ALGORITHM])

    if payload.get("type") != "refresh":
        raise jwt.InvalidTokenError("Wrong token type")
    return payload


def set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="refresh_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=REFRESH_EXPIRE_DAYS * 24 * 3600,
    )
