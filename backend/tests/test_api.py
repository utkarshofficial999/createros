import sys
from pathlib import Path

# Ensure root directory is on sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.seed.seed import seed_database
from backend.app.services.features import extract_features
from backend.app.services.stats import calculate_engagement_score, compute_lift_and_confidence, analyze_post_performance

def test_feature_extraction():
    sample_text = (
        "I built our team's first semantic chunking system three weeks ago.\n\n"
        "Here is what happened:\n"
        "```python\ndef chunk_text(text: str):\n    return []\n```\n"
        "We tested it across 50,000 requests."
    )
    features = extract_features(sample_text)
    assert features["has_personal_story"] is True
    assert features["has_code_example"] is True
    assert features["hook_type"] == "story"

def test_stats_math():
    # score = (1*likes + 4*comments + 6*shares + 5*saves) / impressions * 100
    # 1*100 + 4*25 + 6*10 + 5*10 = 100 + 100 + 60 + 50 = 310
    # 310 / 5000 * 100 = 6.2%
    score = calculate_engagement_score(likes=100, comments=25, shares=10, saves=10, impressions=5000)
    assert score == 6.2

    # Lift: 6.2 / 3.1 = 2.0
    lift_data = compute_lift_and_confidence(group_avg=6.2, overall_avg=3.1, n=6)
    assert lift_data["lift"] == 2.0
    assert lift_data["confidence"] == 1.0

@pytest.mark.asyncio
async def test_api_endpoints():
    await seed_database(reset=True)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Health
        res = await client.get("/api/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"

        # Creator Profile
        res = await client.get("/api/creator")
        assert res.status_code == 200
        assert res.json()["name"] == "Alex Rivera (@alexbuilds)"

        # Ideas Generate
        res = await client.post("/api/ideas/generate", json={"topic": "AI Agents", "goal": "growth"})
        assert res.status_code == 200
        data = res.json()
        assert len(data["ideas"]) == 5

        # Analytics Overview
        res = await client.get("/api/analytics/overview")
        assert res.status_code == 200
        overview = res.json()
        assert overview["total_posts"] >= 20
        assert len(overview["lift_table"]) > 0

        # Learning Model
        res = await client.get("/api/learning/model")
        assert res.status_code == 200
        model_info = res.json()
        assert "winning_patterns" in model_info["model"]

        # Compare v0 vs v1
        res = await client.post("/api/compare", json={"topic": "Vector Databases in Production", "v_base": 0, "v_target": 1})
        assert res.status_code == 200
        comp = res.json()
        assert len(comp["differences_summary"]) > 0

        # Posts List & Detail (Visual + Decision Trail)
        res = await client.get("/api/posts")
        assert res.status_code == 200
        posts = res.json()
        assert len(posts) >= 20
        first_post_id = posts[0]["id"]

        res = await client.get(f"/api/posts/{first_post_id}")
        assert res.status_code == 200
        post_detail = res.json()
        assert "decision_trail" in post_detail
        assert post_detail["image_url"] is not None

        # Post Scheduling (APScheduler integration)
        res = await client.post(f"/api/posts/{first_post_id}/schedule", json={"minutes_from_now": 30})
        assert res.status_code == 200
        scheduled = res.json()
        assert scheduled["status"] == "scheduled"
        assert scheduled["scheduled_for"] is not None

        # Re-learn from Analytics (Model v1 -> v2)
        res = await client.post("/api/learning/relearn")
        assert res.status_code == 200
        new_model = res.json()
        assert new_model["version"] >= 2
        assert len(new_model["model"]["rules"]) > 0

        # Real Performance Ingestion API
        ingest_payload = {
            "posts": [
                {
                    "title": "Production AsyncIO TaskGroup Migration",
                    "body": "I spent 3 weeks rewriting our worker queues in production. Latency dropped by 88%.\n\n```python\nasync def run(): pass\n```",
                    "topic_tag": "Backend Architecture",
                    "platform": "linkedin",
                    "impressions": 12000,
                    "likes": 400,
                    "comments": 60,
                    "shares": 40,
                    "saves": 80
                }
            ]
        }
        res = await client.post("/api/analytics/ingest", json=ingest_payload)
        assert res.status_code == 200
        ingest_res = res.json()
        assert ingest_res["ingested_count"] == 1
        assert ingest_res["total_posts"] > 20

        # Audit Decisions Trail
        res = await client.get("/api/audit")
        assert res.status_code == 200
        decisions = res.json()
        assert len(decisions) > 0

        # Explain This Output Feature
        res = await client.get(f"/api/audit/explain/{first_post_id}")
        assert res.status_code == 200
        explanation = res.json()
        assert explanation["post_id"] == first_post_id
        assert "explanation" in explanation
        assert len(explanation["explanation"]) > 20
