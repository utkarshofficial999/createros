import asyncio
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from backend.app.db import AsyncSessionLocal
from backend.app.models import Post, Metric
from backend.app.services.simulator import simulate_metrics_for_post
from backend.app.services.vector_store import upsert_post_to_pinecone

scheduler = AsyncIOScheduler()

async def publish_scheduled_post_job(post_id: int):
    """Background task executed by APScheduler when publication time arrives."""
    print(f"[APScheduler] Executing publication for Post #{post_id}...")
    async with AsyncSessionLocal() as session:
        post = await session.get(Post, post_id)
        if not post:
            return

        post.status = "published"
        post.published_at = datetime.now(timezone.utc)

        # Generate realistic metrics
        sim_data = simulate_metrics_for_post({
            "format": post.format,
            "word_count": post.word_count,
            "hook_type": post.hook_type,
            "has_personal_story": post.has_personal_story,
            "has_code_example": post.has_code_example
        })

        m_stmt = select(Metric).where(Metric.post_id == post_id)
        metric = (await session.execute(m_stmt)).scalars().first()
        if not metric:
            metric = Metric(
                post_id=post.id,
                impressions=sim_data["impressions"],
                likes=sim_data["likes"],
                comments=sim_data["comments"],
                shares=sim_data["shares"],
                saves=sim_data["saves"],
                clicks=sim_data["clicks"],
                engagement_score=sim_data["engagement_score"],
                is_simulated=True,
                updated_at=datetime.now(timezone.utc)
            )
            session.add(metric)
        else:
            metric.impressions = sim_data["impressions"]
            metric.likes = sim_data["likes"]
            metric.comments = sim_data["comments"]
            metric.shares = sim_data["shares"]
            metric.saves = sim_data["saves"]
            metric.clicks = sim_data["clicks"]
            metric.engagement_score = sim_data["engagement_score"]
            metric.updated_at = datetime.now(timezone.utc)

        await session.commit()

        # Update Pinecone with newly published status
        try:
            upsert_post_to_pinecone(
                post_id=post.id,
                title=post.title,
                body=post.body,
                topic_tag=post.topic_tag,
                format_type=post.format,
                engagement_score=sim_data["engagement_score"],
                features={
                    "has_personal_story": post.has_personal_story,
                    "has_code_example": post.has_code_example,
                    "hook_type": post.hook_type,
                    "word_count": post.word_count
                }
            )
        except Exception as e:
            print(f"[APScheduler] Notice: {e}")

        print(f"[APScheduler] Successfully published Post #{post_id} with score {sim_data['engagement_score']}%!")

def schedule_post_publication(post_id: int, run_at: datetime):
    """Enqueues post for scheduled publication using APScheduler."""
    job_id = f"publish_post_{post_id}"
    # Replace existing if already scheduled
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)

    scheduler.add_job(
        publish_scheduled_post_job,
        trigger="date",
        run_date=run_at,
        args=[post_id],
        id=job_id,
        replace_existing=True
    )
    print(f"[APScheduler] Enqueued Post #{post_id} for {run_at.isoformat()}")

def start_scheduler():
    if not scheduler.running:
        scheduler.start()
        print("[APScheduler] Background job scheduler running.")

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("[APScheduler] Background job scheduler stopped.")
