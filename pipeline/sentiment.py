from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_analyzer = SentimentIntensityAnalyzer()


def score_post(post: dict) -> dict:
    """
    Scores sentiment of title + body using VADER.
    Adds sentiment_score (compound, -1 to +1) to the post.
    """
    text = f"{post['title']} {post['body']}".strip()
    compound = _analyzer.polarity_scores(text)["compound"]
    return {**post, "sentiment_score": round(compound, 4)}
