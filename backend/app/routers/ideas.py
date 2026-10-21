from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.db import get_db
from backend.app.models import CreatorModelRecord
from backend.app.schemas import GenerateIdeasRequest, GenerateIdeasResponse
from backend.app.services.llm import call_llm

router = APIRouter(prefix="/api/ideas", tags=["ideas"])

@router.post("/generate", response_model=GenerateIdeasResponse)
async def generate_ideas(req: GenerateIdeasRequest, db: AsyncSession = Depends(get_db)):
    # Fetch active Creator Model
    stmt = select(CreatorModelRecord).where(CreatorModelRecord.creator_id == 1).order_by(desc(CreatorModelRecord.version))
    model_rec = (await db.execute(stmt)).scalars().first()
    model_version = model_rec.version if model_rec else 1
    model_json = model_rec.model_json if model_rec else {}

    topic = req.topic.strip() if req.topic else "AI Engineering & Production Architecture"

    prompt = (
        f"Generate 5 high-converting post ideas for a tech creator on the topic: '{topic}'.\n"
        f"Platform: {req.platform}\n"
        f"Goal: {req.goal}\n"
        f"Creator Model Version: {model_version}\n"
        f"Creator Model Guidelines:\n{model_json}\n"
    )

    res: GenerateIdeasResponse = await call_llm(
        prompt=prompt,
        system_prompt="You are an AI Content Strategist. Generate 5 distinct post ideas adhering to the creator's winning patterns.",
        response_model=GenerateIdeasResponse,
        stage_name="ideas",
        context_data={"topic": topic, "model_version": model_version}
    )
    return res
