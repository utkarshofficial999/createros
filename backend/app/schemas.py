from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

# --- Statistical Pattern Schemas ---
class Pattern(BaseModel):
    feature: str
    description: str
    lift: float
    n: int
    confidence: float

class Voice(BaseModel):
    tone: str
    sentence_length: str
    hook_style: str
    cta_style: str

class CreatorModel(BaseModel):
    winning_patterns: List[Pattern]
    losing_patterns: List[Pattern]
    preferred_topics: List[str]
    avoid_topics: List[str]
    voice: Voice
    best_length: str
    recommendations: List[str]
    overall_confidence: float

# --- Pipeline Schemas ---
class Strategy(BaseModel):
    angle: str
    hooks: List[str] = Field(..., description="3 distinct hook options")
    format: str
    structure: List[str] = Field(..., description="Outline sections")
    why_this_works: str = Field(..., description="Must cite creator model patterns and lift")
    opportunity_score: int = Field(..., ge=1, le=10)

class Review(BaseModel):
    hook_strength: int = Field(..., ge=1, le=10)
    voice_match: int = Field(..., ge=1, le=10)
    clarity: int = Field(..., ge=1, le=10)
    specificity: int = Field(..., ge=1, le=10)
    overall: float = Field(..., ge=1.0, le=10.0)
    feedback: List[str] = []

class RepurposedContent(BaseModel):
    linkedin_post: str
    x_thread: List[str]
    instagram_caption: str

class GeneratedContent(BaseModel):
    main_content: str
    linkedin_post: str
    x_thread: List[str]
    instagram_caption: str
    self_review: Review

# --- API Request & Response Schemas ---
class CreatorProfile(BaseModel):
    id: int
    name: str
    niche: str
    audience: str
    tone: str
    platforms: List[str]

    model_config = ConfigDict(from_attributes=True)

class IdeaItem(BaseModel):
    id: str
    title: str
    angle: str
    target_format: str
    predicted_score: float
    why_it_works: str
    hook_preview: str

class GenerateIdeasRequest(BaseModel):
    topic: Optional[str] = None
    goal: Optional[str] = "growth" # growth, conversion, authority, viral
    platform: Optional[str] = "linkedin"

class GenerateIdeasResponse(BaseModel):
    model_version: int
    ideas: List[IdeaItem]

class PipelineStartRequest(BaseModel):
    topic: str
    goal: Optional[str] = "growth"
    platform: Optional[str] = "linkedin"
    target_format: Optional[str] = "story"
    selected_hook: Optional[str] = None
    model_version: Optional[int] = None

class PipelineStartResponse(BaseModel):
    run_id: str
    status: str
    message: str

class MetricResponse(BaseModel):
    id: int
    post_id: int
    impressions: int
    likes: int
    comments: int
    shares: int
    saves: int
    clicks: int
    engagement_score: float
    is_simulated: bool

    model_config = ConfigDict(from_attributes=True)

class PostVersionResponse(BaseModel):
    id: int
    post_id: int
    version_number: int
    content: str
    source: str
    quality_score: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CreateVersionRequest(BaseModel):
    content: str

class PostResponse(BaseModel):
    id: int
    creator_id: int
    title: str
    topic_tag: str
    platform: str
    format: str
    body: str
    status: str
    published_at: Optional[datetime] = None
    word_count: int
    hook_type: str
    has_personal_story: bool
    has_code_example: bool
    created_at: datetime
    metric: Optional[MetricResponse] = None

    model_config = ConfigDict(from_attributes=True)

class PostDetailResponse(PostResponse):
    versions: List[PostVersionResponse] = []
    strategy: Optional[Dict[str, Any]] = None

class FeatureLiftItem(BaseModel):
    feature_group: str
    feature_name: str
    count: int
    group_avg_score: float
    overall_avg_score: float
    lift: float
    confidence: float
    verdict: str  # "winning", "losing", "neutral"

class AnalyticsOverviewResponse(BaseModel):
    total_posts: int
    overall_avg_score: float
    total_impressions: int
    posts_data: List[Dict[str, Any]]
    lift_table: List[FeatureLiftItem]
    ai_insight: str

class ModelRecordResponse(BaseModel):
    id: int
    version: int
    based_on_n_posts: int
    created_at: datetime
    model: CreatorModel

    model_config = ConfigDict(from_attributes=True)

class CompareRequest(BaseModel):
    topic: str
    prompt: Optional[str] = None
    platform: Optional[str] = "linkedin"
    v_base: Optional[int] = 0
    v_target: Optional[int] = 1

class CompareResponse(BaseModel):
    topic: str
    base_version: int
    target_version: int
    base_generation: Dict[str, Any]
    target_generation: Dict[str, Any]
    differences_summary: List[str]
