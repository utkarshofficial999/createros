from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from backend.app.db import get_db
from backend.app.models import Post, PostVersion, Metric
from backend.app.schemas import (
    PostResponse, PostDetailResponse, PostVersionResponse, CreateVersionRequest, MetricResponse
)
from backend.app.services.features import extract_features
from backend.app.services.simulator import simulate_metrics_for_post

router = APIRouter(prefix="/api/posts", tags=["posts"])

@router.get("", response_model=List[PostResponse])
async def list_posts(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Post)
        .options(selectinload(Post.metric))
        .order_by(desc(Post.created_at))
    )
    result = await db.execute(stmt)
    posts = result.scalars().all()
    return posts

@router.get("/{post_id}", response_model=PostDetailResponse)
async def get_post_detail(post_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Post)
        .options(selectinload(Post.versions), selectinload(Post.metric))
        .where(Post.id == post_id)
    )
    post = (await db.execute(stmt)).scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.post("/{post_id}/versions", response_model=PostVersionResponse)
async def save_post_version(post_id: int, req: CreateVersionRequest, db: AsyncSession = Depends(get_db)):
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Count existing versions
    v_stmt = select(PostVersion).where(PostVersion.post_id == post_id).order_by(desc(PostVersion.version_number))
    latest_v = (await db.execute(v_stmt)).scalars().first()
    new_version_num = (latest_v.version_number + 1) if latest_v else 1

    # Extract features on the newly edited text
    features = extract_features(req.content, default_format=post.format, default_topic=post.topic_tag)
    post.body = req.content
    post.word_count = features["word_count"]
    post.hook_type = features["hook_type"]
    post.has_personal_story = features["has_personal_story"]
    post.has_code_example = features["has_code_example"]

    new_version = PostVersion(
        post_id=post_id,
        version_number=new_version_num,
        content=req.content,
        source="creator_edit",
        quality_score=9.0, # Human edits are high fidelity learning signals
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_version)
    await db.commit()
    await db.refresh(new_version)
    return new_version

@router.post("/{post_id}/publish", response_model=PostResponse)
async def publish_post(post_id: int, db: AsyncSession = Depends(get_db)):
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.status = "published"
    post.published_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(post)
    return post

@router.post("/{post_id}/simulate-engagement", response_model=MetricResponse)
async def simulate_engagement(post_id: int, db: AsyncSession = Depends(get_db)):
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Generate metrics tailored to post features
    sim_data = simulate_metrics_for_post({
        "format": post.format,
        "word_count": post.word_count,
        "hook_type": post.hook_type,
        "has_personal_story": post.has_personal_story,
        "has_code_example": post.has_code_example
    })

    # Upsert metric
    m_stmt = select(Metric).where(Metric.post_id == post_id)
    metric = (await db.execute(m_stmt)).scalars().first()

    if metric:
        metric.impressions = sim_data["impressions"]
        metric.likes = sim_data["likes"]
        metric.comments = sim_data["comments"]
        metric.shares = sim_data["shares"]
        metric.saves = sim_data["saves"]
        metric.clicks = sim_data["clicks"]
        metric.engagement_score = sim_data["engagement_score"]
        metric.is_simulated = True
        metric.updated_at = datetime.now(timezone.utc)
    else:
        metric = Metric(
            post_id=post_id,
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
        db.add(metric)

    post.status = "published"
    if not post.published_at:
        post.published_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(metric)
    return metric
