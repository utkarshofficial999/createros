import re
from typing import Dict, Any

PERSONAL_STORY_PATTERN = re.compile(
    r"\b(I built|I made|I tried|I replaced|I shipped|My team|We launched|I spent|I failed|I learned|I scaled)\b",
    re.IGNORECASE
)

CODE_EXAMPLE_PATTERN = re.compile(
    r"(```|def\s+[a-zA-Z_]|function\s+[a-zA-Z_]|const\s+[a-zA-Z_]|class\s+[a-zA-Z_]|import\s+[a-zA-Z_]|export\s+)",
    re.MULTILINE
)

def extract_features(text: str, default_format: str = "story", default_topic: str = "Engineering") -> Dict[str, Any]:
    """
    Deterministic, rule-based feature extraction from post text (zero LLM calls).
    """
    clean_text = text.strip() if text else ""
    words = clean_text.split()
    word_count = len(words)

    # 1. Length bucket
    if word_count < 300:
        length_bucket = "short"
    elif word_count <= 800:
        length_bucket = "medium"
    else:
        length_bucket = "long"

    # 2. Hook type detection on first sentence
    first_sentence = ""
    # Split by newline or standard punctuation
    lines = [line.strip() for line in clean_text.splitlines() if line.strip()]
    first_line = lines[0] if lines else ""
    sentence_match = re.split(r"[.?!]\s+", first_line)
    first_sentence = sentence_match[0].strip() if sentence_match else first_line

    if first_sentence.endswith("?") or "?" in first_line:
        hook_type = "question"
    elif re.match(r"^\d+", first_sentence):
        hook_type = "listicle"
    elif re.match(r"^(I\s|We\s|My\s|Last\sweek|Yesterday|In\s202\d)", first_sentence, re.IGNORECASE):
        hook_type = "story"
    else:
        hook_type = "statement"

    # 3. Personal story regex
    has_personal_story = bool(PERSONAL_STORY_PATTERN.search(clean_text))

    # 4. Code example check
    has_code_example = bool(CODE_EXAMPLE_PATTERN.search(clean_text))

    # 5. Format heuristic fallback if not provided
    inferred_format = default_format
    if not inferred_format or inferred_format == "story":
        if has_personal_story:
            inferred_format = "story"
        elif has_code_example or "how to" in clean_text.lower() or "step 1" in clean_text.lower():
            inferred_format = "tutorial"
        elif hook_type == "listicle" or "1." in clean_text:
            inferred_format = "listicle"
        else:
            inferred_format = "opinion"

    return {
        "word_count": word_count,
        "length_bucket": length_bucket,
        "hook_type": hook_type,
        "has_personal_story": has_personal_story,
        "has_code_example": has_code_example,
        "format": inferred_format,
        "topic_tag": default_topic
    }
