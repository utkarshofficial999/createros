from typing import List, Optional, Any, Dict, Union
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

# --- Statistical Pattern & Learned Rules Schemas ---
class Pattern(BaseModel):
    feature: str
    description: str
    lift: float
    n: int
    confidence: float

class LearnedRule(BaseModel):
    rule_id: str = Field(..., description="Unique rule identifier e.g. RULE-STORY-01")
    category: str = Field(..., description="hook, format, evidence, tone, or structure")
    directive: str = Field(..., description="Actionable prompt instruction")
    weight: float = Field(1.0, description="Multiplier lift weight")
    rationale: str = Field(..., description="Statistical basis for the rule")

class PerformanceInsight(BaseModel):
    pattern_name: str
    verdict: str
    lift_multiplier: float
    sample_size: int
    why_it_performed: str
    underlying_human_behavior: str
    actionable_rule: str

class AnalystReport(BaseModel):
    executive_summary: str
    top_performing_drivers: List[PerformanceInsight] = []
    underperforming_traps: List[PerformanceInsight] = []
    recommended_strategy_updates: List[str] = []

class Voice(BaseModel):
    tone: str
    sentence_length: str
    hook_style: str
    cta_style: str

class CreatorModel(BaseModel):
    winning_patterns: List[Pattern] = []
    losing_patterns: List[Pattern] = []
    rules: List[LearnedRule] = []
    preferred_topics: List[str] = []
    avoid_topics: List[str] = []
    voice: Voice
    best_length: str = "800-1200 words"
    recommendations: List[str] = []
    overall_confidence: float = 0.50

# --- Pipeline Schemas ---
class Strategy(BaseModel):
    angle: str
    hooks: List[str] = Field(..., description="3 distinct hook options")
    format: str
    structure: List[str] = Field(..., description="Outline sections")
    why_this_works: str = Field(..., description="Must cite creator model patterns and lift")
    opportunity_score: int = Field(..., ge=1, le=10)
    applied_rule_ids: List[str] = Field(default_factory=list, description="IDs of learned rules applied in this strategy")

class Review(BaseModel):
    hook_strength: int = Field(..., ge=1, le=10)
    voice_match: int = Field(..., ge=1, le=10)
    clarity: int = Field(..., ge=1, le=10)
    specificity: int = Field(..., ge=1, le=10)
    overall: float = Field(..., ge=1.0, le=10.0)
    feedback: Union[List[str], str] = []
    passed: bool = Field(False, description="True if overall >= quality threshold")

class RepurposedContent(BaseModel):
    linkedin_post: str
    x_thread: List[str]
    instagram_caption: str

class VisualDirection(BaseModel):
    prompt: str
    style: str
    visual_rationale: str
    image_url: Optional[str] = None

class DecisionLog(BaseModel):
    agent: str  # "Strategist", "Writer", "Critic", "Analyst", "Visual", "Repurposer"
    decision: str
    reason: str
    model_used: Optional[str] = None
    strategy_version: Optional[int] = None
    applied_rules: Optional[List[str]] = None
    confidence: Optional[float] = None
    timestamp: Optional[str] = None

# --- Ingestion Schemas ---
class PostIngestItem(BaseModel):
    title: str
    body: str
    topic_tag: str = "AI Engineering"
    platform: str = "linkedin"
    format: Optional[str] = None
    impressions: int = 1000
    likes: int = 20
    comments: int = 5
    shares: int = 2
    saves: int = 2
    published_at: Optional[datetime] = None

class BatchIngestRequest(BaseModel):
    posts: List[PostIngestItem]

class BatchIngestResponse(BaseModel):
    ingested_count: int
    total_posts: int
    overall_avg_score: float
    message: str

# --- Audit & Decision Schemas ---
class AuditDecisionResponse(BaseModel):
    id: int
    run_id: str
    post_id: Optional[int] = None
    agent: str
    model_used: str
    strategy_version: int
    applied_rules: List[str] = []
    inputs_summary: Optional[str] = None
    decision: str
    reason: str
    outcome_score: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ExplainOutputResponse(BaseModel):
    post_id: int
    title: str
    strategy_version: int
    applied_rules: List[LearnedRule] = []
    decision_trail: List[AuditDecisionResponse] = []
    rag_sources: List[Dict[str, Any]] = []
    explanation: str

class GeneratedContent(BaseModel):
    main_content: str
    linkedin_post: str
    x_thread: List[str]
    instagram_caption: str
    visual: VisualDirection
    self_review: Review
    decision_trail: List[DecisionLog] = []


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
    scheduled_for: Optional[datetime] = None
    image_url: Optional[str] = None
    image_prompt: Optional[str] = None
    word_count: int
    hook_type: str
    has_personal_story: bool
    has_code_example: bool
    created_at: datetime
    metric: Optional[MetricResponse] = None
    decision_trail: Optional[List[Dict[str, Any]]] = None

    model_config = ConfigDict(from_attributes=True)

class SchedulePostRequest(BaseModel):
    scheduled_for: Optional[datetime] = None
    minutes_from_now: Optional[int] = 60

class PostDetailResponse(PostResponse):
    versions: List[PostVersionResponse] = []
    strategy: Optional[Dict[str, Any]] = None
    visual: Optional[Dict[str, Any]] = None

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
