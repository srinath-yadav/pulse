from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """App settings, read from environment variables or the .env file."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    llm_provider: Literal["offline", "anthropic"] = "offline"
    anthropic_api_key: str | None = None
    llm_model: str = "claude-haiku-5-5"
    llm_timeout_seconds: float = 30


@lru_cache  # read the settings once, then reuse them
def get_settings() -> Settings:
    return Settings()