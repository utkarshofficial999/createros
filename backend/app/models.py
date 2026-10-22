from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, JSON, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from backend.app.db import Base

def utc_now():
    return datetime.now(timezone.utc)

class Creator(Base):
    __tablename__ = "creators"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    niche = Column(String(150), nullable=False)
    audience = Column(String(250), nullable=False)
    tone = Column(String(150), nullable=False)
    platforms = Column(JSON, default=list)  # e.g. ["linkedin", "x", "instagram"]
    created_at = Column(DateTime(timezone=True), default=utc_now)

    posts = relationship("Post", back_populates="creator", cascade="all, delete-orphan")
    models = relationship("CreatorModelRecord", back_populates="creator", cascade="all, delete-orphan")
    generation_runs = relationship("GenerationRun", back_populates="creator", cascade="all, delete-orphan")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("creators.id"), nullable=False)
    title = Column(String(250), nullable=False)
    topic_tag = Column(String(100), nullable=False, index=True)
    platform = Column(String(50), default="linkedin")
    format = Column(String(50), default="story")  # tutorial, story, opinion, listicle
    body = Column(Text, nullable=False)
    status = Column(String(50), default="draft")  # draft, published
    published_at = Column(DateTime(timezone=True), nullable=True)
    
    # Feature extraction columns
    word_count = Column(Integer, default=0)
    hook_type = Column(String(50), default="statement")  # question, listicle, story, statement
    has_personal_story = Column(Boolean, default=False)
    has_code_example = Column(Boolean, default=False)
    
    # Visual and Scheduling fields
    image_url = Column(Text, nullable=True)
    image_prompt = Column(Text, nullable=True)
    scheduled_for = Column(DateTime(timezone=True), nullable=True)
    decision_trail = Column(JSON, default=list)
    repurposed_content = Column(JSON, default=dict)

    created_at = Column(DateTime(timezone=True), default=utc_now)

    creator = relationship("Creator", back_populates="posts")
    versions = relationship("PostVersion", back_populates="post", cascade="all, delete-orphan", order_by="PostVersion.version_number", lazy="selectin")
    metric = relationship("Metric", back_populates="post", uselist=False, cascade="all, delete-orphan", lazy="selectin")


class PostVersion(Base):
    __tablename__ = "post_versions"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    source = Column(String(50), default="ai")  # ai, creator_edit
    quality_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    post = relationship("Post", back_populates="versions")


class Metric(Base):
    __tablename__ = "metrics"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), unique=True, nullable=False)
    impressions = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    saves = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    engagement_score = Column(Float, default=0.0)
    is_simulated = Column(Boolean, default=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    post = relationship("Post", back_populates="metric")


class CreatorModelRecord(Base):
    __tablename__ = "creator_models"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("creators.id"), nullable=False)
    version = Column(Integer, nullable=False)  # 0, 1, 2...
    model_json = Column(JSON, nullable=False)
    based_on_n_posts = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    creator = relationship("Creator", back_populates="models")


class GenerationRun(Base):
    __tablename__ = "generation_runs"

    id = Column(String(50), primary_key=True, index=True)  # UUID or run id
    creator_id = Column(Integer, ForeignKey("creators.id"), nullable=False)
    topic = Column(String(250), nullable=False)
    creator_model_version = Column(Integer, default=1)
    strategy_json = Column(JSON, nullable=True)
    quality_score = Column(Float, nullable=True)
    retries = Column(Integer, default=0)
    latency_ms = Column(Integer, default=0)
    decision_trail = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    creator = relationship("Creator", back_populates="generation_runs")


class AuditDecision(Base):
    __tablename__ = "audit_decisions"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String(50), nullable=False, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="SET NULL"), nullable=True, index=True)
    agent = Column(String(50), nullable=False)  # "Strategist", "Writer", "Critic", "Analyst", "Visual", "Repurposer"
    model_used = Column(String(100), nullable=False)  # via Mesh API e.g. openai/gpt-4o
    strategy_version = Column(Integer, default=1)
    applied_rules = Column(JSON, default=list)  # ["RULE-STORY-01", "RULE-CODE-02"]
    inputs_summary = Column(Text, nullable=True)
    decision = Column(Text, nullable=False)
    reason = Column(Text, nullable=False)
    outcome_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class EvalRunRecord(Base):
    __tablename__ = "eval_runs"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String(50), unique=True, index=True)
    benchmark_name = Column(String(100), nullable=False)
    total_items = Column(Integer, default=0)
    baseline_score = Column(Float, default=0.0)
    learned_score = Column(Float, default=0.0)
    score_delta = Column(Float, default=0.0)
    win_rate = Column(Float, default=0.0)
    results_json = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
