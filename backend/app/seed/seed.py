import asyncio
import json
import os
from pathlib import Path
from datetime import datetime, timezone, timedelta

from backend.app.db import engine, AsyncSessionLocal, Base
from backend.app.models import Creator, Post, PostVersion, Metric, CreatorModelRecord
from backend.app.services.features import extract_features
from backend.app.services.stats import calculate_engagement_score, analyze_post_performance

SEED_CREATOR = {
    "id": 1,
    "name": "Alex Rivera (@alexbuilds)",
    "niche": "AI Engineering & Production Systems",
    "audience": "Founders, Senior Engineers, and AI Builders",
    "tone": "Direct, technical practitioner sharing real battle scars and code",
    "platforms": ["linkedin", "x", "instagram"]
}

DEFAULT_V0_MODEL = {
    "winning_patterns": [],
    "losing_patterns": [],
    "preferred_topics": ["General Technology", "Software Engineering"],
    "avoid_topics": [],
    "voice": {
        "tone": "Neutral, professional corporate tech tone",
        "sentence_length": "Standard medium sentences",
        "hook_style": "High-level topical announcement or definition",
        "cta_style": "Standard 'What do you think? Let me know below.'"
    },
    "best_length": "300-500 words",
    "recommendations": [
        "Write informative technology overviews",
        "Include general takeaways"
    ],
    "overall_confidence": 0.20
}

async def seed_database(reset: bool = False):
    """
    Initializes tables and seeds the demo creator, 20 posts, metrics, and models (v0 & v1).
    """
    async with engine.begin() as conn:
        if reset:
            await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Check if already seeded
        existing_creator = await session.get(Creator, 1)
        if existing_creator and not reset:
            print("Database already seeded. Skipping.")
            return

        print("Seeding Creator Profile...")
        creator = Creator(
            id=SEED_CREATOR["id"],
            name=SEED_CREATOR["name"],
            niche=SEED_CREATOR["niche"],
            audience=SEED_CREATOR["audience"],
            tone=SEED_CREATOR["tone"],
            platforms=SEED_CREATOR["platforms"]
        )
        session.add(creator)
        await session.flush()

        # Seed v0 base model
        v0_model = CreatorModelRecord(
            creator_id=creator.id,
            version=0,
            model_json=DEFAULT_V0_MODEL,
            based_on_n_posts=0,
            created_at=datetime.now(timezone.utc) - timedelta(days=30)
        )
        session.add(v0_model)

        # Load 20 seed posts from posts.json
        seed_path = Path(__file__).parent / "posts.json"
        with open(seed_path, "r", encoding="utf-8") as f:
            raw_posts = json.load(f)

        now = datetime.now(timezone.utc)
        analyzed_posts = []

        print(f"Seeding {len(raw_posts)} posts with extracted features & metrics...")
        for idx, item in enumerate(raw_posts):
            body_text = item["body"]
            features = extract_features(
                body_text,
                default_format=item.get("format", "story"),
                default_topic=item.get("topic_tag", "AI Engineering")
            )

            published_date = now - timedelta(days=(len(raw_posts) - idx) * 2)

            sample_image = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
            sample_prompt = f"Isometric 3D architectural blueprint of {item['topic_tag']} with glowing cyan data pipelines and dark server nodes, octane render"
            trail = [
                {
                    "agent": "Strategist",
                    "decision": f"Selected format '{features['format']}' with '{features['hook_type']}' hook",
                    "reason": "Aligned with historical engagement lift and creator engineering audience preferences.",
                    "timestamp": published_date.isoformat()
                },
                {
                    "agent": "Editor",
                    "decision": "Quality Gate passed (Score: 8.4/10)",
                    "reason": "Strong technical clarity, concise hook, and actionable engineering takeaways.",
                    "timestamp": published_date.isoformat()
                },
                {
                    "agent": "Visual Director",
                    "decision": "Style: Isometric 3D Architecture Blueprint",
                    "reason": "High stopping power in technical social feeds, reinforces system credibility.",
                    "timestamp": published_date.isoformat()
                }
            ]

            post = Post(
                id=item["id"],
                creator_id=creator.id,
                title=item["title"],
                topic_tag=item["topic_tag"],
                platform=item.get("platform", "linkedin"),
                format=features["format"],
                body=body_text,
                status="published",
                published_at=published_date,
                word_count=features["word_count"],
                hook_type=features["hook_type"],
                has_personal_story=features["has_personal_story"],
                has_code_example=features["has_code_example"],
                image_url=sample_image,
                image_prompt=sample_prompt,
                decision_trail=trail,
                created_at=published_date
            )
            session.add(post)
            await session.flush()

            # Version 1 for the post
            version = PostVersion(
                post_id=post.id,
                version_number=1,
                content=body_text,
                source="ai",
                quality_score=8.0 if features["has_personal_story"] else 6.5,
                created_at=published_date
            )
            session.add(version)

            # Metrics
            likes = item["likes"]
            comments = item["comments"]
            shares = item["shares"]
            saves = item["saves"]
            impressions = item["impressions"]
            score = calculate_engagement_score(likes, comments, shares, saves, impressions)

            metric = Metric(
                post_id=post.id,
                impressions=impressions,
                likes=likes,
                comments=comments,
                shares=shares,
                saves=saves,
                clicks=int(likes * 1.2),
                engagement_score=score,
                is_simulated=True,
                updated_at=published_date
            )
            session.add(metric)

            analyzed_posts.append({
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

        # Calculate initial stats to seed Creator Model v1
        stats_result = analyze_post_performance(analyzed_posts)
        winning = []
        losing = []
        for item in stats_result["lift_table"]:
            if item["verdict"] == "winning":
                winning.append({
                    "feature": f"{item['feature_group']}: {item['feature_name']}",
                    "description": f"{item['feature_name']} outperforms baseline by {item['lift']}x lift.",
                    "lift": item["lift"],
                    "n": item["count"],
                    "confidence": item["confidence"]
                })
            elif item["verdict"] == "losing":
                losing.append({
                    "feature": f"{item['feature_group']}: {item['feature_name']}",
                    "description": f"{item['feature_name']} underperforms baseline ({item['lift']}x lift).",
                    "lift": item["lift"],
                    "n": item["count"],
                    "confidence": item["confidence"]
                })

        rules = [
            {
                "rule_id": "RULE-STORY-01",
                "category": "format",
                "directive": "Lead with personal build narratives and vulnerability ('I built...', 'I broke...') to capture attention.",
                "weight": 2.45,
                "rationale": "Empirical 2.45x engagement lift across engineering post-mortems."
            },
            {
                "rule_id": "RULE-CODE-02",
                "category": "evidence",
                "directive": "Mandate runnable Python code examples and quantitative latency benchmarks.",
                "weight": 1.68,
                "rationale": "Drives developer saves and bookmarking behavior (+1.68x lift)."
            },
            {
                "rule_id": "RULE-NO-DEF-03",
                "category": "hook",
                "directive": "Eliminate dictionary definitions ('What is X?') from hooks; replace with real metrics or latency deltas.",
                "weight": 0.42,
                "rationale": "High-level definitions result in 0.42x lift penalty."
            }
        ]

        v1_model_data = {
            "winning_patterns": winning,
            "losing_patterns": losing,
            "rules": rules,
            "preferred_topics": ["AI Engineering", "Backend Architecture", "Production Failures"],
            "avoid_topics": ["Generic Tutorials", "Basic Concept Definitions", "High-level Overviews"],
            "voice": {
                "tone": "Direct, technical practitioner sharing real battle scars and benchmarks",
                "sentence_length": "Punchy punchlines mixed with detailed explanatory paragraphs",
                "hook_style": "Personal breakthrough or counter-intuitive failure opening ('I spent 3 weeks...', 'I shipped...')",
                "cta_style": "Inviting technical peers to share their production trade-offs in the comments"
            },
            "best_length": "800-1200 words",
            "recommendations": [
                "Open with a concrete personal build experience or production mistake.",
                "Always include real architecture trade-offs or code snippets.",
                "Never write dictionary-style definitions ('What is X?')."
            ],
            "overall_confidence": 0.88
        }

        v1_model = CreatorModelRecord(
            creator_id=creator.id,
            version=1,
            model_json=v1_model_data,
            based_on_n_posts=len(raw_posts),
            created_at=now - timedelta(days=1)
        )
        session.add(v1_model)

        await session.commit()
        print("Database seeding completed successfully! Seeded Creator, 20 Posts, Metrics, v0 and v1 Models.")

if __name__ == "__main__":
    asyncio.run(seed_database(reset=True))
