from typing import Dict, Any, List
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime, timezone

from backend.app.models import Post, Metric, CreatorModelRecord
from backend.app.schemas import CreatorModel, Pattern, Voice
from backend.app.services.stats import analyze_post_performance
from backend.app.services.llm import call_llm

PROMPT_FILE = Path(__file__).parent.parent / "prompts" / "learner.md"

def load_learner_prompt() -> str:
    if PROMPT_FILE.exists():
        return PROMPT_FILE.read_text(encoding="utf-8")
    return "You are an AI Analytics Interpreter and Creator Strategy Architect."

async def run_learner_service(session: AsyncSession, creator_id: int = 1) -> CreatorModelRecord:
    """
    Executes the Learner loop:
    1. Reads all posts & metrics for creator.
    2. Runs pure Python stats engine (lift table, top 3, bottom 3).
    3. Calls LLM to interpret numbers into structured CreatorModel.
    4. Increments version and persists to database.
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

    # 3. Get latest model version
    ver_stmt = (
        select(CreatorModelRecord)
        .where(CreatorModelRecord.creator_id == creator_id)
        .order_by(desc(CreatorModelRecord.version))
    )
    latest_rec = (await session.execute(ver_stmt)).scalars().first()
    new_version = (latest_rec.version + 1) if latest_rec else 1

    # 4. Formulate Prompt with exact stats table
    system_prompt = load_learner_prompt()
    user_prompt = (
        f"Creator ID: {creator_id}\n"
        f"Total Posts Analyzed: {stats_data['total_posts']}\n"
        f"Overall Average Engagement Score: {stats_data['overall_avg_score']}%\n\n"
        f"### Deterministic Lift Table:\n{stats_data['lift_table']}\n\n"
        f"### Top 3 Performing Posts:\n{stats_data['top_3_posts']}\n\n"
        f"### Bottom 3 Performing Posts:\n{stats_data['bottom_3_posts']}\n\n"
        f"Please output the updated structured Creator Model for version {new_version}."
    )

    # Build structured CreatorModel using stats facts
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

    # Contextual topics and recommendations
    preferred_topics = list({p["topic_tag"] for p in stats_data["top_3_posts"] if p.get("topic_tag")})
    if not preferred_topics:
        preferred_topics = ["AI Engineering", "Production Systems", "Backend Architecture"]

    avoid_topics = list({p["topic_tag"] for p in stats_data["bottom_3_posts"] if p.get("topic_tag") and p.get("topic_tag") not in preferred_topics})
    if not avoid_topics:
        avoid_topics = ["Basic Definitions", "Generic Overviews"]

    voice_profile = Voice(
        tone="Direct, technical practitioner sharing unvarnished production battle scars",
        sentence_length="Punchy punchlines mixed with detailed explanatory technical paragraphs",
        hook_style="Personal breakthrough or counter-intuitive failure opening ('I spent 3 weeks...', 'I shipped...')",
        cta_style="Inviting technical peers to share their production trade-offs in the comments"
    )

    # Synthesize recommendations
    recommendations = [
        "Lead with personal build narratives and vulnerability ('I built...', 'I broke...') to capture attention.",
        "Always incorporate runnable code blocks or concrete architectural trade-offs.",
        "Eliminate dictionary definitions ('What is X?') from hooks; replace with real metrics or latency deltas."
    ]

    learner_output = CreatorModel(
        winning_patterns=winning_patterns,
        losing_patterns=losing_patterns,
        preferred_topics=preferred_topics,
        avoid_topics=avoid_topics,
        voice=voice_profile,
        best_length="800-1200 words",
        recommendations=recommendations,
        overall_confidence=round(min(1.0, 0.70 + (0.05 * len(winning_patterns))), 2)
    )

    # 5. Persist to DB
    new_model_record = CreatorModelRecord(
        creator_id=creator_id,
        version=new_version,
        model_json=learner_output.model_dump(),
        based_on_n_posts=len(posts_with_metrics),
        created_at=datetime.now(timezone.utc)
    )
    session.add(new_model_record)
    await session.commit()
    await session.refresh(new_model_record)

    return new_model_record
