import pytest
import asyncio
from backend.app.services.llm import select_model_for_stage, clean_json_string, call_llm
from backend.app.schemas import Strategy, Review, CreatorModel, LearnedRule
from backend.app.services.vector_store import cosine_similarity, generate_embedding
from backend.app.services.stats import calculate_engagement_score, compute_lift_and_confidence
from backend.app.config import settings

def test_mesh_role_model_routing():
    """Verify each multi-agent stage routes to the exact Mesh API model class."""
    assert select_model_for_stage("analyst") == settings.MESH_MODEL_ANALYST
    assert select_model_for_stage("learner") == settings.MESH_MODEL_ANALYST
    assert select_model_for_stage("strategist") == settings.MESH_MODEL_STRATEGIST
    assert select_model_for_stage("critic") == settings.MESH_MODEL_CRITIC
    assert select_model_for_stage("writer") == settings.MESH_MODEL_WRITER
    assert select_model_for_stage("repurposer") == settings.MESH_MODEL_WRITER

def test_clean_json_string_robustness():
    """Verify clean_json_string extracts pure JSON despite conversational preambles or code fences."""
    # Case 1: Standard markdown code fence
    t1 = "```json\n{\"key\": \"val\"}\n```"
    assert clean_json_string(t1) == '{"key": "val"}'

    # Case 2: Conversational preamble and trailing text
    t2 = "Here is your JSON response:\n```json\n{\"rule\": \"RULE-STORY-01\", \"weight\": 1.4}\n```\nHope that helps!"
    assert clean_json_string(t2) == '{"rule": "RULE-STORY-01", "weight": 1.4}'

    # Case 3: Raw JSON without code fences but with conversational wrapper
    t3 = "The result is: {\"angle\": \"Technical Deep Dive\"} as requested."
    assert clean_json_string(t3) == '{"angle": "Technical Deep Dive"}'

def test_cosine_similarity_math():
    """Verify vector math boundary cases and identity."""
    v1 = [1.0, 0.0, 0.0]
    v2 = [1.0, 0.0, 0.0]
    v3 = [0.0, 1.0, 0.0]

    assert pytest.approx(cosine_similarity(v1, v2), 0.001) == 1.0
    assert pytest.approx(cosine_similarity(v1, v3), 0.001) == 0.0
    assert cosine_similarity([], []) == 0.0
    assert cosine_similarity([0.0, 0.0], [0.0, 0.0]) == 0.0

@pytest.mark.asyncio
async def test_offline_test_engine_structured_output():
    """Verify call_llm produces valid Pydantic models in offline test mode."""
    res = await call_llm(
        prompt="Topic: High Throughput Kafka Pipelines",
        system_prompt="You are an AI Strategist",
        response_model=Strategy,
        stage_name="strategist",
        context_data={"topic": "High Throughput Kafka Pipelines", "model_version": 1}
    )
    assert isinstance(res, Strategy)
    assert len(res.hooks) >= 1
    assert res.opportunity_score >= 1

@pytest.mark.asyncio
async def test_offline_critic_evaluation():
    """Verify critic returns valid scorecard with calibrated rubric dimensions."""
    review = await call_llm(
        prompt="Review technical draft",
        system_prompt="You are an editorial reviewer",
        response_model=Review,
        stage_name="critic",
        context_data={"topic": "FastAPI WebSockets", "attempt": 1, "model_version": 1}
    )
    assert isinstance(review, Review)
    assert 1.0 <= review.overall <= 10.0
    assert review.hook_strength >= 1
    assert review.voice_match >= 1
