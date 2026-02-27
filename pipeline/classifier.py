from __future__ import annotations

from config import (
    CONSUMER_KEYWORDS, ENTERPRISE_KEYWORDS,
    CONSUMER_BOOST_SUBREDDITS, CONSUMER_BOOST_PHRASES,
    CONSUMER_THRESHOLD, SLACK_ENTERPRISE_KEYWORDS,
)


def score_teams_post(post: dict) -> tuple[float, bool]:
    """
    Returns (consumer_confidence, is_uncertain_consumer).
    Posts scoring below CONSUMER_THRESHOLD should be discarded.
    """
    text = (post["title"] + " " + post["body"]).lower()

    score = 0.5
    for kw in CONSUMER_KEYWORDS:
        if kw in text:
            score += 0.1
    for kw in ENTERPRISE_KEYWORDS:
        if kw in text:
            score -= 0.15

    # Subreddit context boost: r/techsupport personal signal is stronger
    if post["source_subreddit"].lower() in CONSUMER_BOOST_SUBREDDITS:
        if any(phrase in text for phrase in CONSUMER_BOOST_PHRASES):
            score += 0.15

    score = max(0.0, min(1.0, score))
    is_uncertain = CONSUMER_THRESHOLD <= score <= 0.6

    return score, is_uncertain


def score_slack_post(post: dict) -> tuple[float, bool]:
    """
    Slack free tier filter: discard posts that are clearly about paid/enterprise Slack.
    Returns (consumer_confidence, is_uncertain_consumer).
    """
    text = (post["title"] + " " + post["body"]).lower()

    # Penalise enterprise Slack signal
    score = 0.7  # Slack free tier is the default assumption
    for kw in SLACK_ENTERPRISE_KEYWORDS:
        if kw in text:
            score -= 0.2

    score = max(0.0, min(1.0, score))
    is_uncertain = score <= 0.6

    return score, is_uncertain


def classify(post: dict) -> dict | None:
    """
    Runs classifier on a post. Returns the post enriched with
    consumer_confidence and is_uncertain_consumer, or None if discarded.
    """
    if post["platform"] == "teams":
        confidence, uncertain = score_teams_post(post)
        if confidence < CONSUMER_THRESHOLD:
            return None
    else:
        confidence, uncertain = score_slack_post(post)
        if confidence < CONSUMER_THRESHOLD:
            return None

    return {**post, "consumer_confidence": round(confidence, 3), "is_uncertain_consumer": uncertain}
