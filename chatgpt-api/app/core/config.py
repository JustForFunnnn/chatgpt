from typing import List

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: SecretStr
    JWT_SECRET_KEY: SecretStr

    BACKEND_CORS_ORIGINS: List[str] = []

    # OPENAI
    OPENAI_MODEL_NAME: str | None = None
    OPENAI_API_KEY: SecretStr | None = None

    # GEMINI
    GEMINI_MODEL_NAME: str | None = None
    GEMINI_API_KEY: SecretStr | None = None

    # Azure
    AZUREAI_MODEL_NAME: str | None = None
    AZUREAI_API_KEY: SecretStr | None = None
    AZUREAI_ENDPOINT: str | None = None
    AZURE_API_VERSION: str | None = None


# Environment Variables > .env > default value
settings = AppSettings()
