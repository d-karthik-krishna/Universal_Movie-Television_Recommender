from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    TMDB_API_KEY: str
    TMDB_ACCESS_TOKEN: str
    DATABASE_URL: str = "postgresql+asyncpg://cinesphere:cinesphere@localhost:5432/cinesphere"
    REDIS_URL: str = "redis://localhost:6379/0"
    AUTH_SECRET: str = "change-me"
    CORS_ORIGINS: str = "http://localhost:3000"
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(env_file="../../.env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

@lru_cache()
def get_settings():
    return Settings()
