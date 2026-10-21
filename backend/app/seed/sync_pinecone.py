import asyncio
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.app.db import AsyncSessionLocal
from backend.app.models import Post, Metric
from backend.app.services.vector_store import upsert_post_to_pinecone, get_pinecone_client

async def sync_posts_to_pinecone():
    print("Connecting to Pinecone...")
    pc = get_pinecone_client()
    if not pc:
        print("Pinecone client failed to initialize.")
        return

    async with AsyncSessionLocal() as session:
        stmt = select(Post).options(selectinload(Post.metric)).order_by(Post.id)
        posts = (await session.execute(stmt)).scalars().all()
        print(f"Found {len(posts)} posts to embed and sync to Pinecone...")

        synced = 0
        for p in posts:
            score = p.metric.engagement_score if p.metric else 3.5
            success = upsert_post_to_pinecone(
                post_id=p.id,
                title=p.title,
                body=p.body,
                topic_tag=p.topic_tag,
                format_type=p.format,
                engagement_score=score,
                features={
                    "has_personal_story": p.has_personal_story,
                    "has_code_example": p.has_code_example,
                    "hook_type": p.hook_type,
                    "word_count": p.word_count
                }
            )
            if success:
                synced += 1
                print(f"Synced post #{p.id} ({p.title[:40]}...) -> Pinecone (Score: {score}%)")

        print(f"Successfully synced {synced}/{len(posts)} posts into Pinecone index 'creatoros-posts'!")

if __name__ == "__main__":
    asyncio.run(sync_posts_to_pinecone())
