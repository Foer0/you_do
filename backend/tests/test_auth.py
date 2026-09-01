from datetime import datetime, timedelta, timezone

import jwt
from httpx import AsyncClient
from redis.asyncio import Redis

from app.core.redis_client import is_token_blacklisted, send_token_to_blacklist
from app.core.security import ALGORITHM, decode_refresh_token
from tests.conftest import test_settings


async def test_register_success(client: AsyncClient, register_payload: dict):
    response = await client.post("/auth/register", json=register_payload)
    assert response.status_code == 201

    body = response.json()

    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert "refresh_token" in response.cookies


async def test_register_fail(client: AsyncClient, register_payload: dict):
    await client.post("/auth/register", json=register_payload)
    response = await client.post("/auth/register", json=register_payload)

    assert response.status_code == 409


async def test_login_success(client: AsyncClient, register_payload: dict):
    await client.post("/auth/register", json=register_payload)

    del register_payload["timezone"]
    response = await client.post("/auth/login", json=register_payload)

    assert response.status_code == 200

    body = response.json()

    assert "access_token" in body and "token_type" in body
    assert "refresh_token" in response.cookies


async def test_login_fail_user_not_found(client: AsyncClient, register_payload: dict):
    del register_payload["timezone"]
    response = await client.post("/auth/login", json=register_payload)

    assert response.status_code == 401
    assert "WWW-Authenticate" in response.headers


async def test_login_fail_user_wrong_password(
    client: AsyncClient, register_payload: dict
):
    register_reponse = await client.post("/auth/register", json=register_payload)

    assert register_reponse.status_code == 201

    del register_payload["timezone"]
    register_payload["password"] = "incorrect_password"

    login_response = await client.post("/auth/login", json=register_payload)

    assert login_response.status_code == 401
    assert "WWW-Authenticate" in login_response.headers


async def test_google_auth_new_user(client: AsyncClient, mock_google_verify):
    mock_google_verify({"email": "test_user_1@example.com"})

    response = await client.post(
        "/auth/google", json={"id_token": "valid_token", "timezone": "Europe/Minsk"}
    )

    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert "refresh_token" in response.cookies


async def test_google_auth_conflict_with_password_user(
    client: AsyncClient, register_payload, mock_google_verify
):
    await client.post("/auth/register", json=register_payload)

    mock_google_verify({"email": "test_user_1@example.com"})

    response = await client.post(
        "/auth/google", json={"id_token": "valid_token", "timezone": "Europe/Minsk"}
    )

    assert response.status_code == 409


async def test_google_auth_invalid_token(client: AsyncClient, mock_google_verify):
    response = await client.post(
        "/auth/google", json={"id_token": "invalid_token", "timezone": "Europe/Minsk"}
    )
    assert response.status_code == 401


async def test_refresh_success(
    client: AsyncClient, redis_test_client: Redis, register_payload: dict
):
    register_response = await client.post("/auth/register", json=register_payload)
    old_refresh_token = register_response.cookies["refresh_token"]

    refresh_response = await client.post("/auth/refresh")
    assert refresh_response.status_code == 200

    body = refresh_response.json()
    assert "access_token" in body and "token_type" in body

    payload = decode_refresh_token(old_refresh_token)
    assert await is_token_blacklisted(payload["jti"])

    new_refresh_token = refresh_response.cookies["refresh_token"]
    assert new_refresh_token != old_refresh_token


async def test_refresh_fail_bad_token(client: AsyncClient):
    client.cookies.set("refresh_token", "not_a_valid_jwt")
    refresh_response = await client.post("/auth/refresh")

    assert refresh_response.status_code == 401
    assert refresh_response.json()["detail"] == "Invalid refresh token"


async def test_refresh_fail_token_expired(client: AsyncClient, register_payload: dict):
    register_response = await client.post("/auth/register", json=register_payload)
    token = register_response.cookies["refresh_token"]
    payload = decode_refresh_token(token)
    payload["exp"] = datetime.now(timezone.utc) - timedelta(days=2)
    bad_token = jwt.encode(
        payload, test_settings.refresh_secret_key, algorithm=ALGORITHM
    )

    client.cookies.set("refresh_token", bad_token)
    refresh_response = await client.post("/auth/refresh")

    assert refresh_response.status_code == 401
    assert refresh_response.json()["detail"] == "Refresh token expired"


async def test_refresh_fail_cookie_not_found(client: AsyncClient):
    refresh_response = await client.post("/auth/refresh", cookies=None)
    assert refresh_response.status_code == 401
    assert refresh_response.json()["detail"] == "No refresh token"


async def test_refresh_fail_token_in_blacklist(
    client: AsyncClient, redis_test_client: Redis, register_payload: dict
):
    register_response = await client.post("/auth/register", json=register_payload)
    token = register_response.cookies["refresh_token"]
    payload = decode_refresh_token(token)
    await send_token_to_blacklist(payload)

    refresh_response = await client.post("/auth/refresh")

    assert refresh_response.status_code == 401
    assert refresh_response.json()["detail"] == "Token has been revoked or blacklisted"


async def test_logout_success(client: AsyncClient, register_payload: dict):
    register_response = await client.post("/auth/register", json=register_payload)
    logout_response = await client.post("/auth/logout")

    token = register_response.cookies["refresh_token"]
    payload = decode_refresh_token(token)

    assert logout_response.status_code == 200
    assert await is_token_blacklisted(payload["jti"])
    assert logout_response.json()["detail"] == "Logged out"
