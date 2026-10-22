import os
import asyncio
from typing import List, Dict, Any, Optional
from backend.app.services.llm import generate_mesh_embedding

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", None)
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "creatoros-posts")

_pc_client = None

# In-memory vector store fallback with cosine similarity
_IN_MEMORY_POSTS: List[Dict[str, Any]] = []

def get_pinecone_client():
    global _pc_client
    if _pc_client is not None:
        return _pc_client
    if not PINECONE_API_KEY:
        return None
    try:
        from pinecone import Pinecone
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
    """
    Generates embedding strictly via Mesh API gateway (OpenAI compatible /v1/embeddings).
    Complies with sponsor rule that all AI and embedding calls route through Mesh API.
    """
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # In an existing event loop, create task or run
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, generate_mesh_embedding(text, dimensions=1024))
                return future.result()
        else:
            return loop.run_until_complete(generate_mesh_embedding(text, dimensions=1024))
    except Exception:
        return asyncio.run(generate_mesh_embedding(text, dimensions=1024))

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_a = sum(a * a for a, b in zip(v1, v2)) ** 0.5
    norm_b = sum(b * b for a, b in zip(v1, v2)) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)

def upsert_post_to_pinecone(post_id: int, title: str, body: str, topic_tag: str, format_type: str, engagement_score: float, features: Dict[str, Any]):
    """
    Upserts a post vector into Pinecone (if configured) and always stores in in-memory RAG.
    Vector is generated exclusively through Mesh API.
    """
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

    # In-memory store update
    global _IN_MEMORY_POSTS
    _IN_MEMORY_POSTS = [p for p in _IN_MEMORY_POSTS if p["id"] != post_id]
    _IN_MEMORY_POSTS.append({
        "id": post_id,
        "vector": vector,
        "metadata": metadata
    })

    # Optional Pinecone cloud sync
    index = get_pinecone_index()
    if index:
        try:
            index.upsert(
                vectors=[(f"post_{post_id}", vector, metadata)],
                namespace="posts"
            )
        except Exception as e:
            print(f"[Pinecone Notice] Cloud upsert: {e}")
    return True

def search_relevant_posts(query: str, top_k: int = 3, min_score: float = 3.5) -> List[Dict[str, Any]]:
    """
    Semantic vector search across creator's historical posts.
    Prioritizes semantically relevant posts with high engagement scores.
    """
    query_vector = generate_embedding(query, is_query=True)

    # 1. Try Pinecone if available
    index = get_pinecone_index()
    if index:
        try:
            results = index.query(
                vector=query_vector,
                top_k=top_k * 2,
                namespace="posts",
                include_metadata=True
            )
            matches = []
            for match in results.matches:
                meta = match.metadata or {}
                matches.append({
                    "id": meta.get("post_id"),
                    "title": meta.get("title"),
                    "topic_tag": meta.get("topic_tag"),
                    "format": meta.get("format"),
                    "engagement_score": meta.get("engagement_score", 0.0),
                    "has_personal_story": meta.get("has_personal_story"),
                    "has_code_example": meta.get("has_code_example"),
                    "similarity": round(float(match.score), 3),
                    "excerpt": meta.get("excerpt")
                })
            matches.sort(key=lambda x: (x["engagement_score"] >= min_score, x["similarity"]), reverse=True)
            return matches[:top_k]
        except Exception as e:
            print(f"[Pinecone Search Notice] Falling back to in-memory vector index: {e}")

    # 2. In-Memory fallback with cosine similarity
    scored = []
    for item in _IN_MEMORY_POSTS:
        sim = cosine_similarity(query_vector, item["vector"])
        meta = item["metadata"]
        scored.append({
            "id": meta.get("post_id"),
            "title": meta.get("title"),
            "topic_tag": meta.get("topic_tag"),
            "format": meta.get("format"),
            "engagement_score": meta.get("engagement_score", 0.0),
            "has_personal_story": meta.get("has_personal_story"),
            "has_code_example": meta.get("has_code_example"),
            "similarity": round(sim, 3),
            "excerpt": meta.get("excerpt")
        })

    scored.sort(key=lambda x: (x["engagement_score"] >= min_score, x["similarity"]), reverse=True)
    return scored[:top_k]
