from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE_PATH = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ENV_FILE_PATH, env_file_encoding="utf-8")

    db_user: str = Field(default=...)
    db_passwd: str = Field(default=...)
    db_host: str = Field(default=...)
    db_port: int = Field(default=...)
    db_name: str = Field(default=...)
    database_url: str = Field(default=...)

    secret_key: str = Field(default=...)


settings = Settings()
