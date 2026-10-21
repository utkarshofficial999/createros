from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from backend.app.db import get_db
from backend.app.models import CreatorModelRecord
from backend.app.schemas import CreatorModel, ModelRecordResponse
from backend.app.services.learner import run_learner_service

router = APIRouter(prefix="/api/learning", tags=["learning"])

@router.get("/model", response_model=ModelRecordResponse)
async def get_current_model(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(CreatorModelRecord)
        .where(CreatorModelRecord.creator_id == 1)
        .order_by(desc(CreatorModelRecord.version))
    )
    rec = (await db.execute(stmt)).scalars().first()
    if not rec:
        raise HTTPException(status_code=404, detail="No Creator Model found. Run database seed first.")
    
    return ModelRecordResponse(
        id=rec.id,
        version=rec.version,
        based_on_n_posts=rec.based_on_n_posts,
        created_at=rec.created_at,
        model=CreatorModel.model_validate(rec.model_json)
    )

@router.get("/model/history", response_model=List[ModelRecordResponse])
async def get_model_history(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(CreatorModelRecord)
        .where(CreatorModelRecord.creator_id == 1)
        .order_by(desc(CreatorModelRecord.version))
    )
    records = (await db.execute(stmt)).scalars().all()
    return [
        ModelRecordResponse(
            id=r.id,
            version=r.version,
            based_on_n_posts=r.based_on_n_posts,
            created_at=r.created_at,
            model=CreatorModel.model_validate(r.model_json)
        )
        for r in records
    ]

@router.post("/relearn", response_model=ModelRecordResponse)
async def relearn_from_analytics(db: AsyncSession = Depends(get_db)):
    """
    Executes the learning loop: computes stats across all existing posts & metrics,
    synthesizes a new Creator Model version (e.g. v2), and persists it.
    """
    new_record = await run_learner_service(session=db, creator_id=1)
    return ModelRecordResponse(
        id=new_record.id,
        version=new_record.version,
        based_on_n_posts=new_record.based_on_n_posts,
        created_at=new_record.created_at,
        model=CreatorModel.model_validate(new_record.model_json)
    )
