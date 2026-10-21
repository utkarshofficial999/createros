import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.seed.seed import seed_database
from backend.app.services.scheduler import start_scheduler, shutdown_scheduler
from backend.app.routers import (
    creator, ideas, generate, posts, analytics, learning, compare
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-seed database if running for first time
    await seed_database(reset=False)
    # Start background job scheduler for queueing and scheduled posts
    start_scheduler()
    try:
        yield
    finally:
        shutdown_scheduler()

app = FastAPI(
    title="CreatorOS API",
    description="AI Content Studio that learns from analytics to iteratively produce better content.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local development & deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(creator.router)
app.include_router(ideas.router)
app.include_router(generate.router)
app.include_router(posts.router)
app.include_router(analytics.router)
app.include_router(learning.router)
app.include_router(compare.router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "llm_provider": settings.LLM_PROVIDER
    }

@app.get("/api/pinecone/status")
async def pinecone_status():
    from backend.app.services.vector_store import get_pinecone_index
    idx = get_pinecone_index()
    if not idx:
        return {"connected": False, "message": "Pinecone not connected"}
    stats = idx.describe_index_stats()
    return {
        "connected": True,
        "index_name": settings.PINECONE_INDEX_NAME,
        "dimension": stats.dimension,
        "total_vector_count": stats.total_vector_count,
        "namespaces": stats.namespaces
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
