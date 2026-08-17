from datetime import datetime, timezone

import redis.asyncio as redis

from app.core.config import settings

redis_client = redis.Redis(
    host=settings.redis_host,
    port=settings.redis_port,
    db=settings.redis_db,
    decode_responses=True,
)


async def is_token_blacklisted(jti: str | None) -> bool:
    result = await redis_client.get(f"refresh_token:{jti}")
    return True if result else False


async def send_token_to_blacklist(payload: dict):
    exp = payload["exp"]
    jti = payload["jti"]

    ttl_seconds = int(exp - datetime.now(timezone.utc).timestamp())

    if ttl_seconds > 0:
        await redis_client.set(f"refresh_token:{jti}", "1", ex=ttl_seconds)
