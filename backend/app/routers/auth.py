from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.security import create_access_token
from app.schemas.user import Token, UserLogin, UserRegister
from app.services import auth_service

router = APIRouter(tags=["auth"])


@router.post(
    "/auth/register", status_code=status.HTTP_201_CREATED, response_model=Token
)
async def register(data_in: UserRegister, db: Annotated[AsyncSession, Depends(get_db)]):
    data = data_in.model_dump()
    try:
        user = await auth_service.register_new_user(data, db)
        token = create_access_token(user.id)
    except auth_service.EmailAlreadyExistsError:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "A user with that email address already exists"
        )
    return {"access_token": token, "token_type": "bearer"}


@router.post("/auth/login", response_model=Token)
async def login(data_in: UserLogin, db: Annotated[AsyncSession, Depends(get_db)]):
    data = data_in.model_dump()
    try:
        token = await auth_service.authenticate_user(data, db)
    except auth_service.InvalidCredentialsError:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"access_token": token, "token_type": "bearer"}
