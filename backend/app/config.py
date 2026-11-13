"""
Application configuration for AgentSocial.
Loads environment variables with robust defaults.
"""

import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "AgentSocial B2B Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./agentsocial.db")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # AI & Routing
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "local")  # 'openai' or 'local'
    DEFAULT_RELEVANCE_THRESHOLD: float = float(os.getenv("DEFAULT_RELEVANCE_THRESHOLD", "0.75"))
    
    # Security
    HMAC_SECRET: str = os.getenv("HMAC_SECRET", "asama-agent-social-shared-hmac-secret-2026")
    API_SECRET_KEY: str = os.getenv("API_SECRET_KEY", "asama-internal-platform-key-2026")
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))

settings = Settings()
