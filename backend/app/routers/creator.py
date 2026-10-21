from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db import get_db
from backend.app.models import Creator
from backend.app.schemas import CreatorProfile

router = APIRouter(prefix="/api/creator", tags=["creator"])

@router.get("", response_model=CreatorProfile)
async def get_creator_profile(db: AsyncSession = Depends(get_db)):
    creator = await db.get(Creator, 1)
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found. Please run seed script.")
    return creator
