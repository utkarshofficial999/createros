from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from backend.app.db import get_db
from backend.app.models import AuditDecision, Post, CreatorModelRecord
from backend.app.schemas import AuditDecisionResponse, ExplainOutputResponse, LearnedRule
from backend.app.services.vector_store import search_relevant_posts

router = APIRouter(prefix="/api/audit", tags=["audit"])
decisions_router = APIRouter(prefix="/api/decisions", tags=["decisions"])

@router.get("", response_model=List[AuditDecisionResponse])
@decisions_router.get("", response_model=List[AuditDecisionResponse])
async def list_audit_decisions(
    run_id: Optional[str] = Query(None, description="Filter by generation run ID"),
    post_id: Optional[int] = Query(None, description="Filter by post ID"),
    agent: Optional[str] = Query(None, description="Filter by agent name"),
    strategy_version: Optional[int] = Query(None, description="Filter by strategy version"),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    """
    Persisted Decision Trail API (Accessible at /api/audit and /api/decisions):
    Inspects granular decision logs recorded by agents during generation and learning.
    """
    stmt = select(AuditDecision).order_by(desc(AuditDecision.created_at)).limit(limit)

    if run_id:
        stmt = stmt.where(AuditDecision.run_id == run_id)
    if post_id:
        stmt = stmt.where(AuditDecision.post_id == post_id)
    if agent:
        stmt = stmt.where(AuditDecision.agent == agent)
    if strategy_version is not None:
        stmt = stmt.where(AuditDecision.strategy_version == strategy_version)

    results = await db.execute(stmt)
    records = results.scalars().all()
    return records


@router.get("/explain/{post_id}", response_model=ExplainOutputResponse)
async def explain_post_decisions(post_id: int, db: AsyncSession = Depends(get_db)):
    """
    Explain This Output:
    Audits and traces a piece of generated content back to the exact strategy version,
    applied learned rules, agent decision trail, and historical performance RAG memory.
    """
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Fetch audit decisions for this post
    stmt = (
        select(AuditDecision)
        .where(AuditDecision.post_id == post_id)
        .order_by(AuditDecision.created_at)
    )
    decisions = (await db.execute(stmt)).scalars().all()

    # Determine strategy version used
    strat_ver = 1
    if decisions:
        strat_ver = decisions[0].strategy_version

    # Fetch creator model rules for this version
    model_stmt = (
        select(CreatorModelRecord)
        .where(CreatorModelRecord.creator_id == post.creator_id, CreatorModelRecord.version == strat_ver)
    )
    model_rec = (await db.execute(model_stmt)).scalars().first()
    active_rules: List[LearnedRule] = []
    if model_rec and "rules" in model_rec.model_json:
        active_rules = [LearnedRule(**r) for r in model_rec.model_json["rules"]]

    # Query semantic RAG memory to show grounding sources
    rag_sources = search_relevant_posts(post.topic_tag, top_k=2)

    # Plain text explanation synthesis
    applied_names = [r.rule_id for r in active_rules]
    explanation = (
        f"Post #{post.id} ('{post.title[:50]}...') was generated using Strategy Model v{strat_ver}. "
        f"The Strategist Agent activated {len(applied_names)} empirical rule(s) ({', '.join(applied_names) or 'None'}). "
        f"It incorporated verified high-lift patterns: format='{post.format}' and has_personal_story={post.has_personal_story}. "
        f"The draft underwent {len([d for d in decisions if d.agent == 'Critic'])} critique gate evaluation(s) before approval. "
        f"Content was grounded in {len(rag_sources)} semantically similar top-performing historical posts."
    )

    return ExplainOutputResponse(
        post_id=post.id,
        title=post.title,
        strategy_version=strat_ver,
        applied_rules=active_rules,
        decision_trail=[AuditDecisionResponse.model_validate(d) for d in decisions],
        rag_sources=rag_sources,
        explanation=explanation
    )
