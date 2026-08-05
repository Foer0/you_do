from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher

from app.core.config import settings

ALGORITHM = "HS256"


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=60)
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
