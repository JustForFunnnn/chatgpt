import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import SecretStr

class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

    AI_MODEL_NAME: str
    DATABASE_URL: SecretStr
    PASSWORD_SECRET_KEY: SecretStr

    AZURE_API_VERSION: str | None = None
    AZURE_ENDPOINT: str | None = None
    AZURE_API_KEY: SecretStr | None = None

# Environment Variables > .env > default value
settings  = AppSettings()
