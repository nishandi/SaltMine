import requests
import time
from datetime import datetime, timezone, timedelta
from config import SUBREDDIT_TARGETS, LOOKBACK_HOURS, REDDIT_USER_AGENT

REDDIT_BASE = "https://www.reddit.com/r/{subreddit}/new.json"
RATE_LIMIT_DELAY = 2.5  # seconds between requests (unauthenticated limit)


def fetch_subreddit(target: dict, cutoff_utc: datetime) -> list[dict]:
    subreddit = target["subreddit"]
    platform = target["platform"]
    filter_keywords = target.get("filter_keywords")

    posts = []
    after = None

    while True:
        url = REDDIT_BASE.format(subreddit=subreddit)
        params = {"limit": 100, "raw_json": 1}
        if after:
            params["after"] = after

        try:
            response = requests.get(
                url, params=params,
                headers={"User-Agent": REDDIT_USER_AGENT},
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            print(f"  [ERROR] r/{subreddit} ({platform}): {e}")
            break

        children = data.get("data", {}).get("children", [])
        if not children:
            break

        hit_cutoff = False
        for child in children:
            post = child["data"]
            created_utc = datetime.fromtimestamp(post["created_utc"], tz=timezone.utc)

            if created_utc < cutoff_utc:
                hit_cutoff = True
                break

            # Filter mixed-content subreddits to relevant posts only
            if filter_keywords:
                text = (post.get("title", "") + " " + post.get("selftext", "")).lower()
                if not any(kw in text for kw in filter_keywords):
                    continue

            # Prefix id with platform so techsupport posts don't collide across platforms
            posts.append({
                "id": f"{platform}_{post['id']}",
                "source_subreddit": subreddit,
                "platform": platform,
                "title": post.get("title", ""),
                "body": post.get("selftext", ""),
                "url": f"https://reddit.com{post['permalink']}",
                "upvotes": post.get("score", 0),
                "created_utc": created_utc.isoformat(),
            })

        if hit_cutoff or not data["data"].get("after"):
            break

        after = data["data"]["after"]
        time.sleep(RATE_LIMIT_DELAY)

    print(f"  r/{subreddit} ({platform}): {len(posts)} posts")
    return posts


def fetch_all() -> list[dict]:
    cutoff_utc = datetime.now(tz=timezone.utc) - timedelta(hours=LOOKBACK_HOURS)
    all_posts = []
    seen_ids = set()

    # Sequential to respect unauthenticated rate limits
    for target in SUBREDDIT_TARGETS:
        posts = fetch_subreddit(target, cutoff_utc)
        for post in posts:
            if post["id"] not in seen_ids:
                seen_ids.add(post["id"])
                all_posts.append(post)
        time.sleep(RATE_LIMIT_DELAY)

    print(f"\nTotal raw posts fetched: {len(all_posts)}")
    return all_posts
