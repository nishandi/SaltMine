from config import FEATURE_TAGS


def tag_post(post: dict) -> dict:
    """
    Tags a post with one or more feature buckets based on keyword matching.
    Adds feature_tags list to the post.
    """
    text = (post["title"] + " " + post["body"]).lower()
    tags = [bucket for bucket, keywords in FEATURE_TAGS.items() if any(kw in text for kw in keywords)]

    if not tags:
        tags = ["uncategorized"]

    return {**post, "feature_tags": tags}
