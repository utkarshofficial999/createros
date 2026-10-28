import asyncio
import json
import uuid
import time
from typing import AsyncGenerator, Dict, Any, Optional, List
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime, timezone

from backend.app.models import Creator, Post, PostVersion, GenerationRun, CreatorModelRecord, AuditDecision
from backend.app.schemas import (
    Strategy, Review, GeneratedContent, RepurposedContent, CreatorModel, VisualDirection, LearnedRule
)
from backend.app.services.llm import call_llm, clean_json_string
from backend.app.services.features import extract_features
from backend.app.services.vector_store import search_relevant_posts, upsert_post_to_pinecone
from backend.app.config import settings

def unwrap_content_string(text: str) -> str:
    """Extracts raw markdown text if LLM wrapped it inside a JSON structure like {'draft': '...'}."""
    if not text:
        return ""
    trimmed = text.strip()
    if (trimmed.startswith("{") and trimmed.endswith("}")) or (trimmed.startswith("```") and "{" in trimmed):
        try:
            cleaned = clean_json_string(trimmed)
            data = json.loads(cleaned)
            if isinstance(data, dict):
                for k in ["draft", "content", "body", "post", "markdown", "text"]:
                    if k in data and isinstance(data[k], str) and len(data[k]) > 20:
                        return data[k].strip()
        except Exception:
            pass
    return text

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
    Executes the multi-agent content orchestration pipeline with a real, observable feedback loop:
    1. Strategist (conditioned on versioned Creator Model rules & vector RAG)
    2. Writer <-> Critic/Verifier (iterative revision loop with max-iteration cap)
    3. Visual Director (stopping-power asset direction)
    4. Repurposer (multi-platform translation)
    5. Persistence & Auditable Decision Trail (relational AuditDecision table & Post)
    """
    start_time = time.time()
    run_id = f"run_{uuid.uuid4().hex[:8]}"

    # 1. Fetch Creator Profile
    creator = await session.get(Creator, creator_id)
    if not creator:
        yield f"event: error\ndata: {json.dumps({'error': 'Creator not found'})}\n\n"
        return

    # 2. Fetch Creator Model (requested version or latest active)
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
    active_rules: List[Dict[str, Any]] = model_dict.get("rules", [])

    # Memory list for decisions
    decision_trail: List[Dict[str, Any]] = []
    audit_records: List[AuditDecision] = []

    # =========================================================================
    # STAGE 1: STRATEGIST (Grounding via Mesh-Vector RAG + Creator Model Rules)
    # =========================================================================
    yield f"event: stage\ndata: {json.dumps({'stage': 'strategy', 'status': 'running', 'run_id': run_id, 'info': f'Querying vector memory and applying Strategy v{model_version}...'})}\n\n"
    await asyncio.sleep(0.3)

    # Semantic Retrieval
    vector_matches = search_relevant_posts(topic, top_k=2)

    strategist_prompt = (
        f"Topic: {topic}\n"
        f"Goal: {goal}\n"
        f"Target Platform: {platform}\n"
        f"Creator Profile: {creator.name}, Tone: {creator.tone}, Audience: {creator.audience}\n"
        f"Semantic Vector Memory (Top Performing Historical Posts):\n{json.dumps(vector_matches, indent=2)}\n"
        f"Active Strategy Version: v{model_version}\n"
        f"Active Learned Rules:\n{json.dumps(active_rules, indent=2)}\n"
        f"Creator Model Guidelines:\n{json.dumps(model_dict, indent=2)}\n"
    )

    strategy_res: Strategy = await call_llm(
        prompt=strategist_prompt,
        system_prompt=read_prompt("strategist.md") or "You are an AI Content Strategist. Return JSON matching Strategy schema.",
        response_model=Strategy,
        stage_name="strategist",
        context_data={"topic": topic, "model_version": model_version}
    )

    # Determine applied rule IDs
    applied_rules = strategy_res.applied_rule_ids
    if not applied_rules and active_rules:
        applied_rules = [r["rule_id"] for r in active_rules[:2]]

    chosen_hook = selected_hook if selected_hook else strategy_res.hooks[0]

    # Record Strategist Decision
    strat_log = {
        "agent": "Strategist",
        "model_used": settings.MESH_MODEL_STRATEGIST,
        "strategy_version": model_version,
        "applied_rules": applied_rules,
        "decision": f"Angle: '{strategy_res.angle}' | Chosen Hook: '{chosen_hook}'",
        "reason": strategy_res.why_this_works,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    decision_trail.append(strat_log)

    yield f"event: stage\ndata: {json.dumps({'stage': 'strategy', 'status': 'done', 'preview': strategy_res.angle, 'strategy': strategy_res.model_dump(), 'chosen_hook': chosen_hook, 'applied_rules': applied_rules})}\n\n"
    await asyncio.sleep(0.2)

    # =========================================================================
    # STAGE 2: WRITER & CRITIC (OBSERVABLE ITERATIVE REVISION LOOP)
    # =========================================================================
    max_retries = settings.MAX_REVISE_ITERATIONS
    feedback_notes: List[str] = []
    final_draft = ""
    final_review: Optional[Review] = None
    retries_count = 0
    draft_history: List[Dict[str, Any]] = []

    for attempt in range(1, max_retries + 2):
        yield f"event: stage\ndata: {json.dumps({'stage': 'writing', 'status': 'running', 'attempt': attempt, 'strategy_version': model_version})}\n\n"
        await asyncio.sleep(0.3)

        writer_prompt = (
            f"Topic: {topic}\n"
            f"Strategy Angle: {strategy_res.angle}\n"
            f"Chosen Hook: {chosen_hook}\n"
            f"Structure: {strategy_res.structure}\n"
            f"Applied Learned Rule Directives: {json.dumps(applied_rules)}\n"
            f"Creator Voice Guidelines: {json.dumps(model_dict.get('voice', {}))}\n"
            f"Attempt Number: {attempt}\n"
        )
        if feedback_notes:
            writer_prompt += f"\nCRITICAL: You are revising based on the Critic's feedback:\n" + "\n".join(f"- {f}" for f in feedback_notes)

        draft_content: str = await call_llm(
            prompt=writer_prompt,
            system_prompt=read_prompt("writer.md") or "You are a senior ghostwriter. Return high quality markdown.",
            response_model=None,
            stage_name="writer",
            context_data={"topic": topic, "model_version": model_version, "attempt": attempt, "feedback": feedback_notes}
        )
        draft_content = unwrap_content_string(draft_content)
        final_draft = draft_content

        yield f"event: stage\ndata: {json.dumps({'stage': 'writing', 'status': 'done', 'attempt': attempt})}\n\n"
        await asyncio.sleep(0.2)

        # Critic / Verifier Step
        yield f"event: stage\ndata: {json.dumps({'stage': 'review', 'status': 'running', 'attempt': attempt})}\n\n"
        await asyncio.sleep(0.3)

        reviewer_prompt = (
            f"Target Topic: {topic}\n"
            f"Strategy Angle: {strategy_res.angle}\n"
            f"Applied Rules: {json.dumps(applied_rules)}\n"
            f"Draft Content for Review (Attempt {attempt}):\n\n{draft_content}"
        )
        review_res: Review = await call_llm(
            prompt=reviewer_prompt,
            system_prompt=read_prompt("reviewer.md") or "You are an expert editorial critic. Return JSON matching Review schema.",
            response_model=Review,
            stage_name="critic",
            context_data={"topic": topic, "attempt": attempt, "model_version": model_version}
        )
        final_review = review_res

        passed = review_res.overall >= settings.QUALITY_GATE_THRESHOLD
        feedback_list = review_res.feedback if isinstance(review_res.feedback, list) else [str(review_res.feedback)]

        draft_history.append({
            "attempt": attempt,
            "content": draft_content,
            "score": review_res.overall,
            "passed": passed,
            "feedback": feedback_list
        })

        critic_log = {
            "agent": "Critic",
            "model_used": settings.MESH_MODEL_CRITIC,
            "strategy_version": model_version,
            "applied_rules": applied_rules,
            "decision": f"Attempt {attempt} Score: {review_res.overall}/10 (Passed: {passed})",
            "reason": "; ".join(feedback_list) if feedback_list else "Draft met editorial quality standards.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        decision_trail.append(critic_log)

        yield f"event: stage\ndata: {json.dumps({'stage': 'review', 'status': 'done', 'attempt': attempt, 'score': review_res.overall, 'passed': passed, 'review': review_res.model_dump()})}\n\n"

        if passed or attempt > max_retries:
            break

        # Quality gate triggers revision
        retries_count += 1
        feedback_notes = feedback_list
        await asyncio.sleep(0.3)

    # =========================================================================
    # STAGE 3: VISUAL DIRECTOR (STOPPING-POWER ASSET DIRECTION)
    # =========================================================================
    yield f"event: stage\ndata: {json.dumps({'stage': 'visual', 'status': 'running'})}\n\n"
    await asyncio.sleep(0.3)

    visual_prompt = f"Topic: {topic}\nAngle: {strategy_res.angle}\nHook: {chosen_hook}\nPlatform: {platform}"
    visual_res: VisualDirection = await call_llm(
        prompt=visual_prompt,
        system_prompt=read_prompt("visual.md") or "You are an art director. Return JSON matching VisualDirection schema.",
        response_model=VisualDirection,
        stage_name="visual",
        context_data={"topic": topic, "model_version": model_version}
    )

    decision_trail.append({
        "agent": "Visual Director",
        "model_used": settings.MESH_MODEL_WRITER,
        "strategy_version": model_version,
        "applied_rules": applied_rules,
        "decision": f"Style: {visual_res.style}",
        "reason": visual_res.visual_rationale,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    yield f"event: stage\ndata: {json.dumps({'stage': 'visual', 'status': 'done', 'visual': visual_res.model_dump()})}\n\n"
    await asyncio.sleep(0.2)

    # =========================================================================
    # STAGE 4: REPURPOSER (PARALLEL DISTRIBUTION FORMATS)
    # =========================================================================
    yield f"event: stage\ndata: {json.dumps({'stage': 'repurposing', 'status': 'running'})}\n\n"
    await asyncio.sleep(0.3)

    repurpose_prompt = f"Approved Main Content:\n\n{final_draft}\n\nPlatform: {platform}"
    repurposed: RepurposedContent = await call_llm(
        prompt=repurpose_prompt,
        system_prompt=read_prompt("repurposer.md") or "You are a content repurposing specialist. Return JSON matching RepurposedContent.",
        response_model=RepurposedContent,
        stage_name="repurposer",
        context_data={"topic": topic, "model_version": model_version}
    )

    yield f"event: stage\ndata: {json.dumps({'stage': 'repurposing', 'status': 'done', 'repurposed': repurposed.model_dump()})}\n\n"
    await asyncio.sleep(0.2)

    # =========================================================================
    # STAGE 5: PERSISTENCE & AUDIT DECISION TRAIL
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
        scheduled_for=None,
        image_url=visual_res.image_url,
        image_prompt=visual_res.prompt,
        word_count=features["word_count"],
        hook_type=features["hook_type"],
        has_personal_story=features["has_personal_story"],
        has_code_example=features["has_code_example"],
        decision_trail=decision_trail,
        repurposed_content=repurposed.model_dump(),
        created_at=datetime.now(timezone.utc)
    )
    session.add(post)
    await session.flush()

    # Save each draft iteration to PostVersion table
    for idx, d_info in enumerate(draft_history):
        version_rec = PostVersion(
            post_id=post.id,
            version_number=idx + 1,
            content=d_info["content"],
            source=f"ai_attempt_{d_info['attempt']}",
            quality_score=d_info["score"],
            created_at=datetime.now(timezone.utc)
        )
        session.add(version_rec)

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
        decision_trail=decision_trail,
        created_at=datetime.now(timezone.utc)
    )
    session.add(gen_run)

    # Persist relational AuditDecision records for each step
    for d in decision_trail:
        audit_record = AuditDecision(
            run_id=run_id,
            post_id=post.id,
            agent=d["agent"],
            model_used=d.get("model_used", settings.MESH_MODEL_DEFAULT),
            strategy_version=model_version,
            applied_rules=applied_rules,
            inputs_summary=f"Topic: {topic} | Platform: {platform}",
            decision=d["decision"],
            reason=d["reason"],
            outcome_score=final_review.overall if final_review else None,
            created_at=datetime.now(timezone.utc)
        )
        session.add(audit_record)

    await session.commit()

    # Automatically index newly generated post into vector store via Mesh embeddings
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
        print(f"[Vector Store] Auto-index notice: {e}")

    # Emit Completion Payload
    final_payload = {
        "post_id": post.id,
        "run_id": run_id,
        "title": post.title,
        "main_content": final_draft,
        "linkedin_post": repurposed.linkedin_post,
        "x_thread": repurposed.x_thread,
        "instagram_caption": repurposed.instagram_caption,
        "image_url": visual_res.image_url,
        "image_prompt": visual_res.prompt,
        "visual": visual_res.model_dump(),
        "strategy": strategy_res.model_dump(),
        "review": final_review.model_dump() if final_review else None,
        "decision_trail": decision_trail,
        "features": features,
        "strategy_version": model_version,
        "applied_rules": applied_rules,
        "revision_count": retries_count,
        "draft_history": [
            {"attempt": d["attempt"], "score": d["score"], "passed": d["passed"]}
            for d in draft_history
        ]
    }
    yield f"event: done\ndata: {json.dumps(final_payload)}\n\n"
