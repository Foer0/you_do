from datetime import date
from enum import Enum
from typing import Annotated

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    computed_field,
    model_validator,
)

from app.constants import SOUNDS


class SoundEffect(str, Enum):
    nokia_3310 = "nokia_3310"
    no_sound = "none"


SOUND_URLS = {s["id"]: s["url"] for s in SOUNDS}


class SettingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    email: EmailStr
    birth_date: date | None
    session_secs: int
    break_secs: int
    long_break_secs: int | None
    sound_effect: SoundEffect | None
    sound_duration_secs: int | None

    @computed_field
    @property
    def sound_url(self) -> str | None:
        if self.sound_effect is None:
            return None
        return SOUND_URLS.get(self.sound_effect.value)


class SettingUpdate(BaseModel):
    birth_date: date | None = None
    session_secs: int | None = Field(gt=0, default=None)
    break_secs: int | None = Field(gt=0, default=None)
    long_break_secs: int | None = None
    sound_effect: SoundEffect | None = None
    sound_duration_secs: int | None = None


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: Annotated[str, Field(min_length=8)]
    confirm_password: str

    @model_validator(mode="after")
    def check_password_match(self):
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self
