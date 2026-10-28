import os
from pydantic_settings import BaseSettings
from typing import Optional

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DB_FILE = BASE_DIR / "creatoros.db"
_env_db_url = os.getenv("DATABASE_URL", "")
if not _env_db_url or _env_db_url == "sqlite+aiosqlite:///./creatoros.db":
    RESOLVED_DB_URL = f"sqlite+aiosqlite:///{DEFAULT_DB_FILE.as_posix()}"
else:
    RESOLVED_DB_URL = _env_db_url

class Settings(BaseSettings):
    APP_NAME: str = "CreatorOS"
    DATABASE_URL: str = RESOLVED_DB_URL
    
    # Mesh API (Official Sponsor Gateway - Mandatory for Agent Arena 2026)
    # Base URL: https://api.meshapi.ai or https://api.meshapi.ai/v1
    MESH_API_KEY: Optional[str] = os.getenv("MESH_API_KEY", None)
    MESH_BASE_URL: str = os.getenv("MESH_BASE_URL", "https://api.meshapi.ai/v1")
    
    # Model routing per agent role via Mesh API gateway
    MESH_MODEL_DEFAULT: str = os.getenv("MESH_MODEL_DEFAULT", "openai/gpt-4o")
    MESH_MODEL_ANALYST: str = os.getenv("MESH_MODEL_ANALYST", "openai/gpt-4o")
    MESH_MODEL_STRATEGIST: str = os.getenv("MESH_MODEL_STRATEGIST", "openai/gpt-4o")
    MESH_MODEL_WRITER: str = os.getenv("MESH_MODEL_WRITER", "openai/gpt-4o-mini")
    MESH_MODEL_CRITIC: str = os.getenv("MESH_MODEL_CRITIC", "openai/gpt-4o")
    MESH_MODEL_JUDGE: str = os.getenv("MESH_MODEL_JUDGE", "openai/gpt-4o")
    MESH_MODEL_REPURPOSER: str = os.getenv("MESH_MODEL_REPURPOSER", "openai/gpt-4o-mini")
    MESH_MODEL_FALLBACK: str = os.getenv("MESH_MODEL_FALLBACK", "openai/gpt-4o-mini")
    MESH_EMBEDDING_MODEL: str = os.getenv("MESH_EMBEDDING_MODEL", "openai/text-embedding-3-small")
    
    # Provider selection: "mesh" is mandatory; "mock" for local offline tests
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "mesh")
    
    # Pinecone Vector Database (optional cloud storage for embeddings)
    PINECONE_API_KEY: Optional[str] = os.getenv("PINECONE_API_KEY", None)
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME", "creatoros-posts")
    PINECONE_ENVIRONMENT: str = os.getenv("PINECONE_ENVIRONMENT", "us-east-1")

    # Quality gate configuration
    QUALITY_GATE_THRESHOLD: float = 7.5
    MAX_REVISE_ITERATIONS: int = 2

    model_config = {"env_file": ".env", "extra": "allow"}

settings = Settings()
