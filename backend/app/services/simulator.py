import random
from typing import Dict, Any
from backend.app.services.stats import calculate_engagement_score

def simulate_metrics_for_post(post_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates realistic social media engagement metrics based on post characteristics.
    Aligns with hackathon spec target ranges:
    - Build-in-public / Personal story: ~5.0% - 6.5%
    - Practical technical deep-dive:   ~3.5% - 4.6%
    - Generic tutorials:               ~1.5% - 2.5%
    - Opinion / Listicle:              ~2.5% - 3.6%
    """
    has_story = post_data.get("has_personal_story", False)
    has_code = post_data.get("has_code_example", False)
    fmt = (post_data.get("format") or "story").lower()
    word_count = post_data.get("word_count", 500)
    hook_type = post_data.get("hook_type", "statement").lower()

    # Determine baseline target score
    if has_story or fmt == "story":
        base_target = random.uniform(4.9, 6.3)
    elif has_code or fmt == "tutorial" and word_count >= 500:
        base_target = random.uniform(3.6, 4.6)
    elif fmt == "tutorial" and not has_code:
        base_target = random.uniform(1.5, 2.4)
    else:
        base_target = random.uniform(2.6, 3.7)

    # Minor modifier for hook strength
    if hook_type in ("question", "story"):
        base_target *= random.uniform(1.05, 1.15)
    elif hook_type == "statement":
        base_target *= random.uniform(0.92, 1.0)

    # Impresssions between 2,500 and 18,000
    impressions = random.randint(2800, 16500)
    
    # Target weighted total points needed: target_score * impressions / 100
    target_points = (base_target / 100.0) * impressions

    # Interaction breakdown:
    # Likes contribute 1 pt (~35-45% of points)
    # Comments contribute 4 pts (~25-30% of points)
    # Shares contribute 6 pts (~15-20% of points)
    # Saves contribute 5 pts (~15-20% of points)
    like_pts = target_points * random.uniform(0.35, 0.45)
    comment_pts = target_points * random.uniform(0.25, 0.30)
    share_pts = target_points * random.uniform(0.12, 0.18)
    save_pts = target_points - (like_pts + comment_pts + share_pts)
    if save_pts < 0:
        save_pts = target_points * 0.15

    likes = max(15, int(like_pts / 1.0))
    comments = max(3, int(comment_pts / 4.0))
    shares = max(2, int(share_pts / 6.0))
    saves = max(2, int(save_pts / 5.0))
    clicks = max(10, int(likes * random.uniform(0.8, 1.6)))

    actual_score = calculate_engagement_score(likes, comments, shares, saves, impressions)

    return {
        "impressions": impressions,
        "likes": likes,
        "comments": comments,
        "shares": shares,
        "saves": saves,
        "clicks": clicks,
        "engagement_score": actual_score,
        "is_simulated": True
    }
