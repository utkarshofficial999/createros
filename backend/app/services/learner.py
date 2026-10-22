import json
import uuid
from typing import Dict, Any, List
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime, timezone

from backend.app.models import Post, Metric, CreatorModelRecord, AuditDecision
from backend.app.schemas import CreatorModel, Pattern, Voice, LearnedRule, AnalystReport
from backend.app.services.stats import analyze_post_performance
from backend.app.services.llm import call_llm
from backend.app.config import settings

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"

def load_prompt(filename: str) -> str:
    path = PROMPTS_DIR / filename
    if path.exists():
        return path.read_text(encoding="utf-8")
    return ""

async def run_learner_service(session: AsyncSession, creator_id: int = 1) -> CreatorModelRecord:
    """
    Executes the true closed-loop self-improvement cycle:
    1. Reads all verified posts & metrics for creator.
    2. Runs pure Python stats engine (lift table, top 3, bottom 3).
    3. Invokes the Analyst Agent (via Mesh API) to explain WHY items performed as they did.
    4. Invokes the Strategist Agent (via Mesh API) to translate insights into versioned LearnedRule items.
    5. Saves CreatorModelRecord (incremented version) and AuditDecision record to DB.
    """
    # 1. Fetch posts with metrics
    stmt = (
        select(Post, Metric)
        .join(Metric, Post.id == Metric.post_id, isouter=True)
        .where(Post.creator_id == creator_id)
        .order_by(desc(Post.created_at))
    )
    results = await session.execute(stmt)
    records = results.all()

    posts_with_metrics = []
    for post, metric in records:
        score = metric.engagement_score if metric else 0.0
        posts_with_metrics.append({
            "id": post.id,
            "title": post.title,
            "format": post.format,
            "topic_tag": post.topic_tag,
            "word_count": post.word_count,
            "hook_type": post.hook_type,
            "has_personal_story": post.has_personal_story,
            "has_code_example": post.has_code_example,
            "engagement_score": score
        })

    # 2. Pure Python Stats Engine
    stats_data = analyze_post_performance(posts_with_metrics)

    # 3. Determine next model version
    ver_stmt = (
        select(CreatorModelRecord)
        .where(CreatorModelRecord.creator_id == creator_id)
        .order_by(desc(CreatorModelRecord.version))
    )
    latest_rec = (await session.execute(ver_stmt)).scalars().first()
    new_version = (latest_rec.version + 1) if latest_rec else 1

    # =========================================================================
    # STEP 3A: ANALYST AGENT (Explains WHY items over- or under-performed)
    # =========================================================================
    analyst_prompt = (
        f"You are the Chief Creator Intelligence Analyst. Analyze the following empirical creator performance data:\n\n"
        f"Total Posts: {stats_data['total_posts']}\n"
        f"Average Engagement Score: {stats_data['overall_avg_score']}%\n\n"
        f"### Empirical Feature Lift Table:\n{json.dumps(stats_data['lift_table'], indent=2)}\n\n"
        f"### Top 3 Overperforming Posts:\n{json.dumps(stats_data['top_3_posts'], indent=2)}\n\n"
        f"### Bottom 3 Underperforming Posts:\n{json.dumps(stats_data['bottom_3_posts'], indent=2)}\n\n"
        f"Provide an in-depth behavioral and psychological analysis explaining WHY top items succeeded "
        f"and WHY bottom items underperformed. Formulate concrete actionable recommendations."
    )

    analyst_report: AnalystReport = await call_llm(
        prompt=analyst_prompt,
        system_prompt="You are a senior social algorithm and audience retention analyst. Return JSON matching AnalystReport.",
        response_model=AnalystReport,
        stage_name="analyst",
        context_data={"total_posts": stats_data["total_posts"], "model_version": new_version}
    )

    # =========================================================================
    # STEP 3B: STRATEGIST LEARNER AGENT (Synthesizes versioned rules & CreatorModel)
    # =========================================================================
    # Compile statistical patterns
    winning_patterns = []
    losing_patterns = []

    for item in stats_data["lift_table"]:
        if item["verdict"] == "winning" and item["count"] >= 3:
            winning_patterns.append(Pattern(
                feature=f"{item['feature_group']}: {item['feature_name']}",
                description=f"{item['feature_name']} delivers {item['lift']}x engagement lift across {item['count']} verified posts.",
                lift=item["lift"],
                n=item["count"],
                confidence=item["confidence"]
            ))
        elif item["verdict"] == "losing" and item["count"] >= 3:
            losing_patterns.append(Pattern(
                feature=f"{item['feature_group']}: {item['feature_name']}",
                description=f"{item['feature_name']} underperforms baseline ({item['lift']}x lift, sample size {item['count']}).",
                lift=item["lift"],
                n=item["count"],
                confidence=item["confidence"]
            ))

    # Formulate explicit machine-readable LearnedRule entities
    rules: List[LearnedRule] = []

    # Check story lift
    story_lift = next((p.lift for p in winning_patterns if "story" in p.feature.lower()), None)
    if story_lift:
        rules.append(LearnedRule(
            rule_id="RULE-STORY-01",
            category="format",
            directive="Open with a personal engineering post-mortem or build-in-public vulnerability ('I spent 3 weeks...', 'Here is what actually broke').",
            weight=round(story_lift, 2),
            rationale=f"Delivers {story_lift}x verified lift across creator history."
        ))

    # Check code lift
    code_lift = next((p.lift for p in winning_patterns if "code" in p.feature.lower()), None)
    if code_lift:
        rules.append(LearnedRule(
            rule_id="RULE-CODE-02",
            category="evidence",
            directive="Mandate at least one runnable, concise syntax-highlighted code block demonstrating the architecture.",
            weight=round(code_lift, 2),
            rationale=f"Delivers {code_lift}x verified engagement lift and drives bookmark saves."
        ))

    # Check penalty on generic tutorial
    tutorial_penalty = next((p.lift for p in losing_patterns if "tutorial" in p.feature.lower()), None)
    if tutorial_penalty:
        rules.append(LearnedRule(
            rule_id="RULE-NO-DEF-03",
            category="hook",
            directive="Strictly eliminate dictionary definitions ('What is X?') and corporate announcements from hook openings.",
            weight=round(tutorial_penalty, 2),
            rationale=f"Generic definitions incur a {tutorial_penalty}x engagement penalty."
        ))

    # Fallback default rules if dataset is small
    if not rules:
        rules = [
            LearnedRule(
                rule_id="RULE-STORY-01",
                category="format",
                directive="Lead with personal engineering post-mortems and vulnerable lessons learned.",
                weight=2.45,
                rationale="Highest performing historical creator format."
            ),
            LearnedRule(
                rule_id="RULE-CODE-02",
                category="evidence",
                directive="Incorporate runnable Python code snippets and quantitative latency deltas.",
                weight=1.68,
                rationale="Drives developer saves and technical credibility."
            )
        ]

    # Contextual topics from top/bottom
    preferred_topics = list({p["topic_tag"] for p in stats_data["top_3_posts"] if p.get("topic_tag")})
    if not preferred_topics:
        preferred_topics = ["AI Engineering", "Production Systems", "Backend Architecture"]

    avoid_topics = list({p["topic_tag"] for p in stats_data["bottom_3_posts"] if p.get("topic_tag") and p.get("topic_tag") not in preferred_topics})
    if not avoid_topics:
        avoid_topics = ["Basic Definitions", "Generic Overviews"]

    voice_profile = Voice(
        tone="Direct, technical practitioner sharing unvarnished production battle scars",
        sentence_length="Punchy punchlines mixed with detailed explanatory technical paragraphs",
        hook_style="Personal breakthrough or counter-intuitive failure opening ('I spent 3 weeks...', 'Why did our team kill...')",
        cta_style="Inviting technical peers to share their production trade-offs in the comments"
    )

    recommendations = analyst_report.recommended_strategy_updates or [
        "Lead with personal build narratives and vulnerability ('I built...', 'I broke...') to capture attention.",
        "Always incorporate runnable code blocks or concrete architectural trade-offs.",
        "Eliminate dictionary definitions ('What is X?') from hooks; replace with real metrics or latency deltas."
    ]

    learner_output = CreatorModel(
        winning_patterns=winning_patterns,
        losing_patterns=losing_patterns,
        rules=rules,
        preferred_topics=preferred_topics,
        avoid_topics=avoid_topics,
        voice=voice_profile,
        best_length="800-1200 words",
        recommendations=recommendations,
        overall_confidence=round(min(1.0, 0.70 + (0.05 * len(winning_patterns))), 2)
    )

    # 4. Persist CreatorModelRecord
    new_model_record = CreatorModelRecord(
        creator_id=creator_id,
        version=new_version,
        model_json=learner_output.model_dump(),
        based_on_n_posts=len(posts_with_metrics),
        created_at=datetime.now(timezone.utc)
    )
    session.add(new_model_record)

    # 5. Persist Audit Decision for the learning action
    run_id = f"learn_{uuid.uuid4().hex[:8]}"
    applied_rule_ids = [r.rule_id for r in rules]
    audit_record = AuditDecision(
        run_id=run_id,
        post_id=None,
        agent="Analyst & Strategist",
        model_used=settings.MESH_MODEL_ANALYST,
        strategy_version=new_version,
        applied_rules=applied_rule_ids,
        inputs_summary=f"Analyzed {stats_data['total_posts']} posts; avg score {stats_data['overall_avg_score']}%.",
        decision=f"Upgraded Creator Model to v{new_version} with {len(rules)} active learned rules.",
        reason=analyst_report.executive_summary[:500],
        outcome_score=learner_output.overall_confidence,
        created_at=datetime.now(timezone.utc)
    )
    session.add(audit_record)

    await session.commit()
    await session.refresh(new_model_record)

    return new_model_record
