from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """App settings, read from environment variables or the .env file."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    llm_provider: Literal["offline", "anthropic", "openai_compatible"] = "offline"
    llm_model: str = "claude-haiku-5-5"
    llm_timeout_seconds: float = 30

    # Anthropic
    anthropic_api_key: str | None = None

    # Any OpenAI-compatible API: Groq, OpenRouter, Gemini, Ollama
    llm_api_key: str | None = None
    llm_base_url: str = "https://api.groq.com/openai/v1"


@lru_cache  # read the settings once, then reuse them
def get_settings() -> Settings:
    return Settings()