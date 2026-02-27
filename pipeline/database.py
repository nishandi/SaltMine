from __future__ import annotations

import os
from datetime import datetime, timezone, date, timedelta
from supabase import create_client, Client
from config import ROLLING_WINDOW_DAYS, SPIKE_WINDOW_DAYS, SPIKE_BASELINE_START, SPIKE_BASELINE_END, SPIKE_THRESHOLD, DB_BATCH_SIZE

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SECRET_KEY"]
        _client = create_client(url, key)
    return _client


def upsert_posts(posts: list[dict]) -> int:
    """Upsert posts in batches. Returns count inserted/updated."""
    client = get_client()
    total = 0
    for i in range(0, len(posts), DB_BATCH_SIZE):
        batch = posts[i: i + DB_BATCH_SIZE]
        client.table("posts").upsert(batch, on_conflict="id").execute()
        total += len(batch)
    return total


def delete_old_posts() -> None:
    """Delete posts older than the rolling window."""
    client = get_client()
    cutoff = (datetime.now(tz=timezone.utc) - timedelta(days=ROLLING_WINDOW_DAYS)).isoformat()
    client.table("posts").delete().lt("created_utc", cutoff).execute()
    print(f"  Deleted posts older than {ROLLING_WINDOW_DAYS} days")


def rebuild_todays_snapshot() -> None:
    """
    Recompute today's daily_snapshot from posts table and upsert it.
    Expands feature_tags array so each tag gets its own row.
    """
    client = get_client()
    today = date.today().isoformat()

    # Fetch today's posts
    response = client.table("posts").select(
        "platform, feature_tags, sentiment_score, upvotes"
    ).gte("created_utc", f"{today}T00:00:00+00:00").execute()

    posts = response.data
    if not posts:
        print("  No posts today — skipping snapshot")
        return

    # Aggregate per (platform, feature_tag)
    aggregates: dict[tuple, dict] = {}
    for post in posts:
        for tag in (post["feature_tags"] or ["uncategorized"]):
            key = (post["platform"], tag)
            if key not in aggregates:
                aggregates[key] = {"count": 0, "sentiment_sum": 0.0, "upvotes": 0}
            aggregates[key]["count"] += 1
            aggregates[key]["sentiment_sum"] += post["sentiment_score"] or 0
            aggregates[key]["upvotes"] += post["upvotes"] or 0

    rows = [
        {
            "snapshot_date": today,
            "platform": platform,
            "feature_tag": tag,
            "post_count": agg["count"],
            "avg_sentiment": round(agg["sentiment_sum"] / agg["count"], 4),
            "total_upvotes": agg["upvotes"],
        }
        for (platform, tag), agg in aggregates.items()
    ]

    client.table("daily_snapshots").upsert(rows, on_conflict="snapshot_date,platform,feature_tag").execute()
    print(f"  Snapshot: {len(rows)} rows for {today}")


def detect_and_store_spikes() -> int:
    """
    Computes spike detection and upserts results into the spikes table.
    Returns number of active spikes found.
    """
    client = get_client()
    today = date.today()

    window_start = (today - timedelta(days=SPIKE_WINDOW_DAYS)).isoformat()
    baseline_start = (today - timedelta(days=SPIKE_BASELINE_END)).isoformat()
    baseline_end = (today - timedelta(days=SPIKE_BASELINE_START)).isoformat()

    # Fetch last 7 days
    current = client.table("daily_snapshots").select(
        "platform, feature_tag, post_count"
    ).gte("snapshot_date", window_start).execute().data

    # Fetch days 8–35 (baseline)
    baseline = client.table("daily_snapshots").select(
        "platform, feature_tag, post_count"
    ).gte("snapshot_date", baseline_start).lt("snapshot_date", baseline_end).execute().data

    # Aggregate
    def aggregate(rows):
        totals: dict[tuple, int] = {}
        for row in rows:
            key = (row["platform"], row["feature_tag"])
            totals[key] = totals.get(key, 0) + row["post_count"]
        return totals

    current_totals = aggregate(current)
    baseline_totals = aggregate(baseline)

    spikes = []
    for key, current_count in current_totals.items():
        platform, tag = key
        baseline_total = baseline_totals.get(key, 0)
        # Baseline = avg weekly count over 4 weeks
        baseline_weekly_avg = baseline_total / 4 if baseline_total > 0 else 0

        if baseline_weekly_avg > 0 and current_count >= SPIKE_THRESHOLD * baseline_weekly_avg:
            pct_increase = round((current_count - baseline_weekly_avg) / baseline_weekly_avg * 100, 1)
            spikes.append({
                "detected_date": today.isoformat(),
                "platform": platform,
                "feature_tag": tag,
                "current_week_count": current_count,
                "four_week_avg": round(baseline_weekly_avg, 2),
                "pct_increase": pct_increase,
                "is_active": True,
            })

    # Mark all previous spikes inactive, then insert new ones
    client.table("spikes").update({"is_active": False}).eq("is_active", True).execute()
    if spikes:
        client.table("spikes").insert(spikes).execute()

    print(f"  Spikes detected: {len(spikes)}")
    return len(spikes)
