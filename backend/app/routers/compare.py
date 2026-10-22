from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.db import get_db
from backend.app.models import CreatorModelRecord
from backend.app.schemas import CompareRequest, CompareResponse, Strategy, Review
from backend.app.services.llm import call_llm
from backend.app.services.features import extract_features

router = APIRouter(prefix="/api/compare", tags=["compare"])

@router.post("", response_model=CompareResponse)
async def compare_model_generations(req: CompareRequest, db: AsyncSession = Depends(get_db)):
    topic = req.topic.strip() if req.topic else "AI Engineering in Production"

    # Fetch Base Model (defaults to v0 or lowest)
    v_base = req.v_base if req.v_base is not None else 0
    v_target = req.v_target if req.v_target is not None else 1

    base_stmt = select(CreatorModelRecord).where(
        CreatorModelRecord.creator_id == 1,
        CreatorModelRecord.version == v_base
    )
    base_rec = (await db.execute(base_stmt)).scalars().first()

    target_stmt = select(CreatorModelRecord).where(
        CreatorModelRecord.creator_id == 1,
        CreatorModelRecord.version == v_target
    )
    target_rec = (await db.execute(target_stmt)).scalars().first()

    # Generate with Base Model (v0 - generic)
    base_strat: Strategy = await call_llm(
        prompt=f"Topic: {topic}\nCreator Model (v{v_base}):\n{base_rec.model_json if base_rec else {}}",
        system_prompt="Generate strategy with generic tone",
        response_model=Strategy,
        stage_name="strategist",
        context_data={"topic": topic, "model_version": v_base}
    )

    base_content: str = await call_llm(
        prompt=f"Topic: {topic}\nStrategy: {base_strat.angle}",
        system_prompt="Write standard article",
        response_model=None,
        stage_name="writer",
        context_data={"topic": topic, "model_version": v_base, "attempt": 1}
    )

    base_review: Review = await call_llm(
        prompt=base_content,
        system_prompt="Review draft",
        response_model=Review,
        stage_name="reviewer",
        context_data={"topic": topic, "attempt": 1, "model_version": v_base}
    )

    # Generate with Learned Target Model (v1/v2 - pattern optimized)
    target_strat: Strategy = await call_llm(
        prompt=f"Topic: {topic}\nCreator Model (v{v_target}):\n{target_rec.model_json if target_rec else {}}",
        system_prompt="Generate strategy adhering to winning patterns",
        response_model=Strategy,
        stage_name="strategist",
        context_data={"topic": topic, "model_version": v_target}
    )

    target_content: str = await call_llm(
        prompt=f"Topic: {topic}\nStrategy: {target_strat.angle}",
        system_prompt="Write technical practitioner story with code and metrics",
        response_model=None,
        stage_name="writer",
        context_data={"topic": topic, "model_version": v_target, "attempt": 2}
    )

    target_review: Review = await call_llm(
        prompt=target_content,
        system_prompt="Review draft",
        response_model=Review,
        stage_name="reviewer",
        context_data={"topic": topic, "attempt": 2, "model_version": v_target}
    )

    base_feat = extract_features(base_content, default_format=base_strat.format, default_topic=topic)
    target_feat = extract_features(target_content, default_format=target_strat.format, default_topic=topic)

    score_diff = round(target_review.overall - base_review.overall, 1)
    word_diff = target_feat["word_count"] - base_feat["word_count"]

    differences_summary = [
        f"Hook Angle: Changed from '{base_feat['hook_type']}' ('{base_strat.hooks[0][:40]}...') to high-engagement '{target_feat['hook_type']}' ('{target_strat.hooks[0][:40]}...')",
        f"Quality Scorecard: Increased from {base_review.overall}/10 to {target_review.overall}/10 ({'+' if score_diff >= 0 else ''}{score_diff} pts)",
        f"Evidence Injection: Code block detected = {target_feat['has_code_example']} (Base = {base_feat['has_code_example']}), Personal story = {target_feat['has_personal_story']} (Base = {base_feat['has_personal_story']})",
        f"Content Depth: {target_feat['word_count']} words vs {base_feat['word_count']} words ({'+' if word_diff >= 0 else ''}{word_diff} words)"
    ]

    return CompareResponse(
        topic=topic,
        base_version=v_base,
        target_version=v_target,
        base_generation={
            "strategy": base_strat.model_dump(),
            "content": base_content,
            "review": base_review.model_dump()
        },
        target_generation={
            "strategy": target_strat.model_dump(),
            "content": target_content,
            "review": target_review.model_dump()
        },
        differences_summary=differences_summary
    )
