from typing import Annotated
from zoneinfo import available_timezones

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRegister(BaseModel):
    email: EmailStr
    password: Annotated[str, Field(min_length=8)]
    timezone: str

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, v: str) -> str:
        if v not in available_timezones():
            raise ValueError("Unknown timezone")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: Annotated[str, Field(min_length=8)]


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
