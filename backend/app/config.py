import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "CreatorOS"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./creatoros.db")
    
    # Mesh API (Official Sponsor - Mandatory)
    MESH_API_KEY: Optional[str] = os.getenv("MESH_API_KEY", None)
    MESH_BASE_URL: str = os.getenv("MESH_BASE_URL", "https://api.meshapi.ai/v1")
    MESH_MODEL: str = os.getenv("MESH_MODEL", "openai/gpt-4o")
    
    # Secondary / Alternative Keys
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY", None)
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    
    # LLM Provider selection: "mesh" (default), "groq", "openai", "gemini", "mock"
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "mesh")
    
    # Pinecone Vector Database
    PINECONE_API_KEY: Optional[str] = os.getenv("PINECONE_API_KEY", None)
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME", "creatoros-posts")
    PINECONE_ENVIRONMENT: str = os.getenv("PINECONE_ENVIRONMENT", "us-east-1")

    # Quality gate configuration
    QUALITY_GATE_THRESHOLD: float = 7.5
    MAX_RETRIES: int = 1

    model_config = {"env_file": ".env", "extra": "allow"}

settings = Settings()
