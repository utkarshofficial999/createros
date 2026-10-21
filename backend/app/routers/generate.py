import uuid
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db import get_db, AsyncSessionLocal
from backend.app.schemas import PipelineStartRequest, PipelineStartResponse
from backend.app.services.pipeline import execute_content_pipeline

router = APIRouter(prefix="/api/generate", tags=["generate"])

# In-memory registry for pending pipeline runs
PENDING_RUNS: Dict[str, Dict[str, Any]] = {}

@router.post("", response_model=PipelineStartResponse)
async def start_pipeline(req: PipelineStartRequest):
    run_id = f"run_{uuid.uuid4().hex[:8]}"
    PENDING_RUNS[run_id] = {
        "topic": req.topic,
        "goal": req.goal or "growth",
        "platform": req.platform or "linkedin",
        "selected_hook": req.selected_hook,
        "model_version": req.model_version
    }
    return PipelineStartResponse(
        run_id=run_id,
        status="initiated",
        message="Pipeline initiated. Connect to /api/generate/{run_id}/stream to receive live SSE events."
    )

@router.get("/{run_id}/stream")
async def stream_pipeline(run_id: str):
    if run_id not in PENDING_RUNS:
        raise HTTPException(status_code=404, detail=f"Run ID '{run_id}' not found or already completed.")

    params = PENDING_RUNS.pop(run_id)

    async def event_stream():
        async with AsyncSessionLocal() as session:
            async for chunk in execute_content_pipeline(
                session=session,
                creator_id=1,
                topic=params["topic"],
                goal=params["goal"],
                platform=params["platform"],
                selected_hook=params["selected_hook"],
                requested_model_version=params["model_version"]
            ):
                yield chunk

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/direct-stream")
async def stream_direct(req: PipelineStartRequest):
    """Direct streaming endpoint for convenience."""
    async def event_stream():
        async with AsyncSessionLocal() as session:
            async for chunk in execute_content_pipeline(
                session=session,
                creator_id=1,
                topic=req.topic,
                goal=req.goal or "growth",
                platform=req.platform or "linkedin",
                selected_hook=req.selected_hook,
                requested_model_version=req.model_version
            ):
                yield chunk

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
