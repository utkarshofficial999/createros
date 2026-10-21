import asyncio
import json
import uuid
import time
from typing import AsyncGenerator, Dict, Any, Optional
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime, timezone

from backend.app.models import Creator, Post, PostVersion, GenerationRun, CreatorModelRecord
from backend.app.schemas import (
    Strategy, Review, GeneratedContent, RepurposedContent, CreatorModel
)
from backend.app.services.llm import call_llm
from backend.app.services.features import extract_features
from backend.app.services.vector_store import search_relevant_posts, upsert_post_to_pinecone

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"

def read_prompt(filename: str) -> str:
    path = PROMPTS_DIR / filename
    if path.exists():
        return path.read_text(encoding="utf-8")
    return ""

async def execute_content_pipeline(
    session: AsyncSession,
    creator_id: int,
    topic: str,
    goal: str = "growth",
    platform: str = "linkedin",
    selected_hook: Optional[str] = None,
    requested_model_version: Optional[int] = None
) -> AsyncGenerator[str, None]:
    """
    Executes the 4-stage pipeline and streams real-time Server-Sent Events (SSE).
    Stages:
    1. Strategist -> Angle, Hooks, Structure, why_this_works
    2. Writer <-> Reviewer (with autonomous retry loop if review < 7.5)
    3. Repurposer -> LinkedIn, X Thread, Instagram
    4. Database persistence -> Post, PostVersion, GenerationRun
    """
    start_time = time.time()
    run_id = f"run_{uuid.uuid4().hex[:8]}"

    # Fetch Creator Profile
    creator = await session.get(Creator, creator_id)
    if not creator:
        yield f"event: error\ndata: {json.dumps({'error': 'Creator not found'})}\n\n"
        return

    # Fetch Creator Model (requested version or latest active)
    if requested_model_version is not None:
        stmt = select(CreatorModelRecord).where(
            CreatorModelRecord.creator_id == creator_id,
            CreatorModelRecord.version == requested_model_version
        )
        model_rec = (await session.execute(stmt)).scalars().first()
    else:
        stmt = (
            select(CreatorModelRecord)
            .where(CreatorModelRecord.creator_id == creator_id)
            .order_by(desc(CreatorModelRecord.version))
        )
        model_rec = (await session.execute(stmt)).scalars().first()

    model_dict = model_rec.model_json if model_rec else {}
    model_version = model_rec.version if model_rec else 1

    # =========================================================================
    # STAGE 1: STRATEGIST (Grounding via Pinecone Vector RAG + Creator Model)
    # =========================================================================
    yield f"event: stage\ndata: {json.dumps({'stage': 'strategy', 'status': 'running', 'run_id': run_id, 'info': 'Querying Pinecone vector memory...'})}\n\n"
    await asyncio.sleep(0.4)

    # Pinecone Semantic Retrieval
    pinecone_matches = search_relevant_posts(topic, top_k=2)

    strategist_prompt = (
        f"Topic: {topic}\n"
        f"Goal: {goal}\n"
        f"Target Platform: {platform}\n"
        f"Creator Profile: {creator.name}, Tone: {creator.tone}, Audience: {creator.audience}\n"
        f"Pinecone RAG Memory (Semantically Similar Top Performing Posts):\n{json.dumps(pinecone_matches, indent=2)}\n"
        f"Creator Model (v{model_version}):\n{json.dumps(model_dict, indent=2)}\n"
    )

    strategy_res: Strategy = await call_llm(
        prompt=strategist_prompt,
        system_prompt=read_prompt("strategist.md"),
        response_model=Strategy,
        stage_name="strategist",
        context_data={"topic": topic, "model_version": model_version}
    )

    # Use user-selected hook if provided, otherwise top hook
    chosen_hook = selected_hook if selected_hook else strategy_res.hooks[0]

    yield f"event: stage\ndata: {json.dumps({'stage': 'strategy', 'status': 'done', 'preview': strategy_res.angle, 'strategy': strategy_res.model_dump(), 'chosen_hook': chosen_hook})}\n\n"
    await asyncio.sleep(0.3)

    # =========================================================================
    # STAGE 2: WRITER & REVIEWER (VISIBLE RETRY LOOP)
    # =========================================================================
    max_retries = 1
    feedback_notes = []
    final_draft = ""
    final_review: Optional[Review] = None
    retries_count = 0

    for attempt in range(1, max_retries + 2):
        yield f"event: stage\ndata: {json.dumps({'stage': 'writing', 'status': 'running', 'attempt': attempt})}\n\n"
        await asyncio.sleep(0.5)

        writer_prompt = (
            f"Topic: {topic}\n"
            f"Strategy Angle: {strategy_res.angle}\n"
            f"Chosen Hook: {chosen_hook}\n"
            f"Structure: {strategy_res.structure}\n"
            f"Creator Voice Guidelines: {model_dict.get('voice', {})}\n"
            f"Attempt Number: {attempt}\n"
        )
        if feedback_notes:
            writer_prompt += f"\nPrevious Reviewer Feedback to fix:\n" + "\n".join(f"- {f}" for f in feedback_notes)

        draft_content: str = await call_llm(
            prompt=writer_prompt,
            system_prompt=read_prompt("writer.md"),
            response_model=None,
            stage_name="writer",
            context_data={"topic": topic, "model_version": model_version, "attempt": attempt, "feedback": feedback_notes}
        )
        final_draft = draft_content

        yield f"event: stage\ndata: {json.dumps({'stage': 'writing', 'status': 'done', 'attempt': attempt})}\n\n"
        await asyncio.sleep(0.3)

        # Reviewer Step
        yield f"event: stage\ndata: {json.dumps({'stage': 'review', 'status': 'running', 'attempt': attempt})}\n\n"
        await asyncio.sleep(0.4)

        reviewer_prompt = f"Draft Content for Review:\n\n{draft_content}\n\nTarget Goal: {goal}\nTopic: {topic}"
        review_res: Review = await call_llm(
            prompt=reviewer_prompt,
            system_prompt=read_prompt("reviewer.md"),
            response_model=Review,
            stage_name="reviewer",
            context_data={"topic": topic, "attempt": attempt, "model_version": model_version}
        )
        final_review = review_res

        yield f"event: stage\ndata: {json.dumps({'stage': 'review', 'status': 'done', 'attempt': attempt, 'score': review_res.overall, 'review': review_res.model_dump()})}\n\n"

        if review_res.overall >= 7.5 or attempt > max_retries:
            break

        # Quality gate triggers visible retry
        retries_count += 1
        feedback_notes = review_res.feedback
        await asyncio.sleep(0.4)

    # =========================================================================
    # STAGE 3: REPURPOSER (PARALLEL DISTRIBUTION FORMATS)
    # =========================================================================
    yield f"event: stage\ndata: {json.dumps({'stage': 'repurposing', 'status': 'running'})}\n\n"
    await asyncio.sleep(0.4)

    repurpose_prompt = f"Approved Main Content:\n\n{final_draft}\n\nPlatform: {platform}"
    repurposed: RepurposedContent = await call_llm(
        prompt=repurpose_prompt,
        system_prompt=read_prompt("repurposer.md"),
        response_model=RepurposedContent,
        stage_name="repurposer",
        context_data={"topic": topic, "model_version": model_version}
    )

    yield f"event: stage\ndata: {json.dumps({'stage': 'repurposing', 'status': 'done', 'repurposed': repurposed.model_dump()})}\n\n"
    await asyncio.sleep(0.2)

    # =========================================================================
    # STAGE 4: PERSISTENCE & FINALIZATION
    # =========================================================================
    features = extract_features(final_draft, default_format=strategy_res.format, default_topic=topic)
    
    post = Post(
        creator_id=creator.id,
        title=chosen_hook,
        topic_tag=topic,
        platform=platform,
        format=features["format"],
        body=final_draft,
        status="draft",
        published_at=None,
        word_count=features["word_count"],
        hook_type=features["hook_type"],
        has_personal_story=features["has_personal_story"],
        has_code_example=features["has_code_example"],
        created_at=datetime.now(timezone.utc)
    )
    session.add(post)
    await session.flush()

    # Save initial version
    version_1 = PostVersion(
        post_id=post.id,
        version_number=1,
        content=final_draft,
        source="ai",
        quality_score=final_review.overall if final_review else 8.0,
        created_at=datetime.now(timezone.utc)
    )
    session.add(version_1)

    # Save Generation Run log
    latency = int((time.time() - start_time) * 1000)
    gen_run = GenerationRun(
        id=run_id,
        creator_id=creator.id,
        topic=topic,
        creator_model_version=model_version,
        strategy_json=strategy_res.model_dump(),
        quality_score=final_review.overall if final_review else 8.0,
        retries=retries_count,
        latency_ms=latency,
        created_at=datetime.now(timezone.utc)
    )
    session.add(gen_run)
    await session.commit()

    # Automatically index newly generated post into Pinecone
    try:
        upsert_post_to_pinecone(
            post_id=post.id,
            title=post.title,
            body=final_draft,
            topic_tag=topic,
            format_type=strategy_res.format,
            engagement_score=final_review.overall if final_review else 5.0,
            features=features
        )
    except Exception as e:
        print(f"[Pinecone] Auto-upsert notice: {e}")

    # Emit Completion
    final_payload = {
        "post_id": post.id,
        "run_id": run_id,
        "title": post.title,
        "main_content": final_draft,
        "linkedin_post": repurposed.linkedin_post,
        "x_thread": repurposed.x_thread,
        "instagram_caption": repurposed.instagram_caption,
        "strategy": strategy_res.model_dump(),
        "review": final_review.model_dump() if final_review else None,
        "features": features
    }
    yield f"event: done\ndata: {json.dumps(final_payload)}\n\n"
