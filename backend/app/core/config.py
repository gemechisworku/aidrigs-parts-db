"""
Application Configuration
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings"""
    
    # API Settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_VERSION: str = "v1"
    
    # Database Settings
    DATABASE_URL: str = "postgresql://aidrigs:aidrigs_dev_password@localhost:5432/aidrigs_parts_db"
    
    # Security Settings
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS Settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:5175",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
        
    ]
    
    # Application Settings
    PROJECT_NAME: str = "AidRigs Parts Database"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    
    # Webhook Settings
    EXTRACTED_QUOTES_WEBHOOK_URL: str = "https://n8n.dev.tas.coopaifoundry.com/webhook/upload-file"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="allow"
    )


settings = Settings()
