from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./tarkov.db"
    tarkov_api_url: str = "https://api.tarkov.dev/graphql"
    refresh_interval_minutes: int = 10
    profit_threshold_pct: float = 20.0

    class Config:
        env_file = ".env"


settings = Settings()
