import os
from typing import List, Dict, Any, Optional
from pinecone import Pinecone

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", None)
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "creatoros-posts")
EMBEDDING_MODEL = "multilingual-e5-large" # 1024-dim native serverless inference

_pc_client: Optional[Pinecone] = None

def get_pinecone_client() -> Optional[Pinecone]:
    global _pc_client
    if _pc_client is not None:
        return _pc_client
    if not PINECONE_API_KEY:
        return None
    try:
        _pc_client = Pinecone(api_key=PINECONE_API_KEY)
        return _pc_client
    except Exception as e:
        print(f"[Pinecone Warning] Failed to initialize Pinecone: {e}")
        return None

def get_pinecone_index():
    pc = get_pinecone_client()
    if not pc:
        return None
    try:
        return pc.Index(PINECONE_INDEX_NAME)
    except Exception as e:
        print(f"[Pinecone Warning] Failed to connect to index '{PINECONE_INDEX_NAME}': {e}")
        return None

def generate_embedding(text: str, is_query: bool = False) -> List[float]:
    """Generates 1024-dimension embedding using Pinecone's serverless inference."""
    pc = get_pinecone_client()
    if not pc:
        return [0.0] * 1024
    
    input_type = "query" if is_query else "passage"
    response = pc.inference.embed(
        model=EMBEDDING_MODEL,
        inputs=[text[:2000]], # Pinecone truncation limit
        parameters={"input_type": input_type, "truncate": "END"}
    )
    return response[0].values

def upsert_post_to_pinecone(post_id: int, title: str, body: str, topic_tag: str, format_type: str, engagement_score: float, features: Dict[str, Any]):
    """Upserts a single post vector with rich metadata into Pinecone."""
    index = get_pinecone_index()
    if not index:
        return False
    
    text_to_embed = f"Title: {title}\nTopic: {topic_tag}\nFormat: {format_type}\nExcerpt: {body[:600]}"
    vector = generate_embedding(text_to_embed, is_query=False)

    metadata = {
        "post_id": post_id,
        "title": title,
        "topic_tag": topic_tag,
        "format": format_type,
        "engagement_score": float(engagement_score),
        "has_personal_story": bool(features.get("has_personal_story", False)),
        "has_code_example": bool(features.get("has_code_example", False)),
        "hook_type": str(features.get("hook_type", "statement")),
        "word_count": int(features.get("word_count", 0)),
        "excerpt": body[:350]
    }

    index.upsert(
        vectors=[(f"post_{post_id}", vector, metadata)],
        namespace="posts"
    )
    return True

def search_relevant_posts(query: str, top_k: int = 3, min_score: float = 3.5) -> List[Dict[str, Any]]:
    """
    Semantic vector search across creator's historical posts.
    Prioritizes semantically relevant posts with high engagement scores.
    """
    index = get_pinecone_index()
    if not index:
        return []

    try:
        query_vector = generate_embedding(query, is_query=True)
        # Search in Pinecone
        results = index.query(
            vector=query_vector,
            top_k=top_k * 2,
            namespace="posts",
            include_metadata=True
        )

        matches = []
        for match in results.matches:
            meta = match.metadata or {}
            score = meta.get("engagement_score", 0.0)
            matches.append({
                "id": meta.get("post_id"),
                "title": meta.get("title"),
                "topic_tag": meta.get("topic_tag"),
                "format": meta.get("format"),
                "engagement_score": score,
                "has_personal_story": meta.get("has_personal_story"),
                "has_code_example": meta.get("has_code_example"),
                "similarity": round(float(match.score), 3),
                "excerpt": meta.get("excerpt")
            })

        # Sort combined by relevance & performance
        matches.sort(key=lambda x: (x["engagement_score"] >= min_score, x["similarity"]), reverse=True)
        return matches[:top_k]
    except Exception as e:
        print(f"[Pinecone Error] Search failed: {e}")
        return []
