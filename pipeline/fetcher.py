from __future__ import annotations

import re
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta

import requests

from config import SUBREDDIT_TARGETS, LOOKBACK_HOURS

REDDIT_RSS_BASE = "https://www.reddit.com/r/{subreddit}/new/.rss"
RATE_LIMIT_DELAY = 2.5

# Atom namespace used by Reddit RSS feeds
_ATOM = "{http://www.w3.org/2005/Atom}"

# Browser-like User-Agent — RSS endpoints are less aggressive about blocking
_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/122.0.0.0 Safari/537.36"
)

_POST_ID_RE = re.compile(r"/comments/([a-z0-9]+)/")
_TAG_RE = re.compile(r"<[^>]+>")


def _strip_html(text: str) -> str:
    return _TAG_RE.sub("", text).strip()


def fetch_subreddit(target: dict, cutoff_utc: datetime) -> list[dict]:
    subreddit = target["subreddit"]
    platform = target["platform"]
    filter_keywords = target.get("filter_keywords")

    url = REDDIT_RSS_BASE.format(subreddit=subreddit)
    try:
        response = requests.get(
            url,
            params={"limit": 100},
            headers={"User-Agent": _UA, "Accept": "application/rss+xml, application/xml"},
            timeout=15,
        )
        response.raise_for_status()
        root = ET.fromstring(response.content)
    except Exception as e:
        print(f"  [ERROR] r/{subreddit} ({platform}): {e}")
        print(f"  r/{subreddit} ({platform}): 0 posts")
        return []

    posts = []
    for entry in root.findall(f"{_ATOM}entry"):
        # Published timestamp
        pub = entry.findtext(f"{_ATOM}published") or ""
        try:
            created_utc = datetime.fromisoformat(pub.replace("Z", "+00:00"))
        except ValueError:
            continue

        if created_utc < cutoff_utc:
            continue

        # Post URL and ID
        link_el = entry.find(f"{_ATOM}link")
        post_url = link_el.get("href", "") if link_el is not None else ""
        m = _POST_ID_RE.search(post_url)
        if not m:
            continue
        post_id = m.group(1)

        title = entry.findtext(f"{_ATOM}title") or ""
        body_html = entry.findtext(f"{_ATOM}content") or ""
        body = _strip_html(body_html)[:2000]  # trim to avoid huge posts

        # Filter mixed-content subreddits
        if filter_keywords:
            text = (title + " " + body).lower()
            if not any(kw in text for kw in filter_keywords):
                continue

        posts.append({
            "id": f"{platform}_{post_id}",
            "source_subreddit": subreddit,
            "platform": platform,
            "title": title,
            "body": body,
            "url": post_url,
            "upvotes": 0,  # RSS feeds don't include vote counts
            "created_utc": created_utc.isoformat(),
        })

    print(f"  r/{subreddit} ({platform}): {len(posts)} posts")
    return posts


def fetch_all() -> list[dict]:
    cutoff_utc = datetime.now(tz=timezone.utc) - timedelta(hours=LOOKBACK_HOURS)
    all_posts = []
    seen_ids = set()

    for target in SUBREDDIT_TARGETS:
        posts = fetch_subreddit(target, cutoff_utc)
        for post in posts:
            if post["id"] not in seen_ids:
                seen_ids.add(post["id"])
                all_posts.append(post)
        time.sleep(RATE_LIMIT_DELAY)

    print(f"\nTotal raw posts fetched: {len(all_posts)}")
    return all_posts
