from typing import Annotated

import jwt
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import redis_client, security
from app.core.dependencies import get_db
from app.schemas.user import Token, UserLogin, UserRegister
from app.services import auth_service

router = APIRouter(tags=["auth"])


@router.post(
    "/auth/register", status_code=status.HTTP_201_CREATED, response_model=Token
)
async def register(
    data_in: UserRegister,
    db: Annotated[AsyncSession, Depends(get_db)],
    response: Response,
):
    data = data_in.model_dump()
    try:
        user = await auth_service.register_new_user(data, db)
    except auth_service.EmailAlreadyExistsError:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "A user with that email address already exists"
        )
    access_token = security.create_access_token(user.id)
    refresh_token = security.create_refresh_token(user.id, user.version)
    security.set_refresh_cookie(response, refresh_token)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/auth/login", response_model=Token)
async def login(
    data_in: UserLogin, db: Annotated[AsyncSession, Depends(get_db)], response: Response
):
    data = data_in.model_dump()
    try:
        access_token, refresh_token = await auth_service.authenticate_user(data, db)
    except auth_service.InvalidCredentialsError:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    security.set_refresh_cookie(response, refresh_token)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/auth/refresh", response_model=Token)
async def refresh(
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    refresh_token: str | None = Cookie(default=None),
):
    if not refresh_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No refresh token")
    try:
        payload = security.decode_refresh_token(refresh_token)
        is_exist = await redis_client.is_token_blacklisted(payload.get("jti"))
        if is_exist:
            raise HTTPException(
                status.HTTP_401_UNAUTHORIZED, "Token has been revoked or blacklisted"
            )
        proven_payload = await auth_service.check_refresh_token_payload(payload, db)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")

    await redis_client.send_token_to_blacklist(proven_payload)

    new_access_token = security.create_access_token(int(proven_payload["sub"]))
    new_refresh_token = security.create_refresh_token(
        int(proven_payload["sub"]), int(proven_payload["version"])
    )

    security.set_refresh_cookie(response, new_refresh_token)
    return {"access_token": new_access_token, "token_type": "bearer"}


@router.post("/auth/logout")
async def logout(
    response: Response, refresh_token: str | None = Cookie(default=None)
) -> dict:
    if refresh_token:
        try:
            payload = security.decode_refresh_token(refresh_token)
            await redis_client.send_token_to_blacklist(payload)
        except jwt.InvalidTokenError:
            pass

    response.delete_cookie("refresh_token")
    return {"detail": "Logged out"}
