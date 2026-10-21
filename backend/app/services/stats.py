from typing import List, Dict, Any, Optional

def calculate_engagement_score(
    likes: int, comments: int, shares: int, saves: int, impressions: int
) -> float:
    """
    Engagement score formula from spec:
    score = ((1 * likes + 4 * comments + 6 * shares + 5 * saves) / impressions) * 100
    """
    if impressions <= 0:
        return 0.0
    weighted_interactions = (1.0 * likes) + (4.0 * comments) + (6.0 * shares) + (5.0 * saves)
    return round((weighted_interactions / float(impressions)) * 100.0, 3)

def compute_lift_and_confidence(group_avg: float, overall_avg: float, n: int) -> Dict[str, float]:
    """
    lift = group_avg / overall_avg
    confidence = min(1.0, n / 5)
    """
    if overall_avg <= 0:
        lift = 1.0
    else:
        lift = round(group_avg / overall_avg, 2)
    
    confidence = round(min(1.0, n / 5.0), 2)
    return {"lift": lift, "confidence": confidence}

def analyze_post_performance(posts_with_metrics: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Processes all posts with their extracted features and engagement metrics.
    Returns:
    - overall_avg_score
    - lift_table: list of grouped features with count, group_avg, lift, confidence
    - top_3_posts
    - bottom_3_posts
    """
    if not posts_with_metrics:
        return {
            "overall_avg_score": 0.0,
            "total_posts": 0,
            "lift_table": [],
            "top_3_posts": [],
            "bottom_3_posts": []
        }

    valid_posts = [p for p in posts_with_metrics if p.get("engagement_score") is not None]
    if not valid_posts:
        return {
            "overall_avg_score": 0.0,
            "total_posts": len(posts_with_metrics),
            "lift_table": [],
            "top_3_posts": [],
            "bottom_3_posts": []
        }

    total_score = sum(p["engagement_score"] for p in valid_posts)
    overall_avg = round(total_score / len(valid_posts), 3)

    # Sort posts to find top and bottom
    sorted_posts = sorted(valid_posts, key=lambda x: x["engagement_score"], reverse=True)
    top_3 = sorted_posts[:3]
    bottom_3 = sorted_posts[-3:] if len(sorted_posts) >= 3 else sorted_posts[:]

    # Grouping aggregators
    groups: Dict[str, Dict[str, List[float]]] = {
        "Personal Story": {"Has Personal Story": [], "No Personal Story": []},
        "Code Examples": {"Includes Code": [], "No Code": []},
        "Hook Type": {"Question Hook": [], "Story Hook": [], "Listicle Hook": [], "Statement Hook": []},
        "Content Length": {"Long (800+ words)": [], "Medium (300-800 words)": [], "Short (<300 words)": []},
        "Format": {"Story": [], "Tutorial": [], "Listicle": [], "Opinion": []},
        "Topic": {}
    }

    for p in valid_posts:
        score = p["engagement_score"]

        # Personal Story
        if p.get("has_personal_story"):
            groups["Personal Story"]["Has Personal Story"].append(score)
        else:
            groups["Personal Story"]["No Personal Story"].append(score)

        # Code Examples
        if p.get("has_code_example"):
            groups["Code Examples"]["Includes Code"].append(score)
        else:
            groups["Code Examples"]["No Code"].append(score)

        # Hook Type
        ht = p.get("hook_type", "statement").lower()
        if ht == "question":
            groups["Hook Type"]["Question Hook"].append(score)
        elif ht == "story":
            groups["Hook Type"]["Story Hook"].append(score)
        elif ht == "listicle":
            groups["Hook Type"]["Listicle Hook"].append(score)
        else:
            groups["Hook Type"]["Statement Hook"].append(score)

        # Length
        word_count = p.get("word_count", 0)
        if word_count > 800:
            groups["Content Length"]["Long (800+ words)"].append(score)
        elif word_count >= 300:
            groups["Content Length"]["Medium (300-800 words)"].append(score)
        else:
            groups["Content Length"]["Short (<300 words)"].append(score)

        # Format
        fmt = (p.get("format") or "story").capitalize()
        if fmt not in groups["Format"]:
            groups["Format"][fmt] = []
        groups["Format"][fmt].append(score)

        # Topic
        topic = p.get("topic_tag") or "General"
        if topic not in groups["Topic"]:
            groups["Topic"][topic] = []
        groups["Topic"][topic].append(score)

    lift_table = []
    for category, sub_groups in groups.items():
        for feature_name, scores in sub_groups.items():
            n = len(scores)
            if n == 0:
                continue
            group_avg = round(sum(scores) / n, 3)
            stat = compute_lift_and_confidence(group_avg, overall_avg, n)
            lift = stat["lift"]
            confidence = stat["confidence"]

            if lift >= 1.15 and n >= 3:
                verdict = "winning"
            elif lift <= 0.85 and n >= 3:
                verdict = "losing"
            else:
                verdict = "neutral"

            lift_table.append({
                "feature_group": category,
                "feature_name": feature_name,
                "count": n,
                "group_avg_score": group_avg,
                "overall_avg_score": overall_avg,
                "lift": lift,
                "confidence": confidence,
                "verdict": verdict
            })

    # Sort lift table so highest winning features appear first
    lift_table.sort(key=lambda x: (x["verdict"] == "winning", x["lift"]), reverse=True)

    return {
        "overall_avg_score": overall_avg,
        "total_posts": len(valid_posts),
        "lift_table": lift_table,
        "top_3_posts": top_3,
        "bottom_3_posts": bottom_3
    }
