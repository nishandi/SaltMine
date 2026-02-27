"""
SaltMine data pipeline — runs once daily at 6am via Render cron job.

Steps:
  1. Fetch posts from all target subreddits (last 24h)
  2. Classify: score consumer vs enterprise confidence, discard below threshold
  3. Tag: assign feature buckets via keyword matching
  4. Score sentiment with VADER
  5. Upsert into Supabase posts table
  6. Delete posts older than 90 days
  7. Rebuild today's daily snapshot
  8. Detect and store spikes
  9. Print run summary
"""

import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

from fetcher import fetch_all
from classifier import classify
from tagger import tag_post
from sentiment import score_post
from database import upsert_posts, delete_old_posts, rebuild_todays_snapshot, detect_and_store_spikes


def run():
    started_at = datetime.now(tz=timezone.utc)
    print(f"\n{'='*50}")
    print(f"SaltMine pipeline started: {started_at.strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"{'='*50}\n")

    # 1. Fetch
    print("STEP 1: Fetching from Reddit...")
    raw_posts = fetch_all()

    # 2–4. Classify → Tag → Sentiment
    print("\nSTEP 2-4: Classifying, tagging, scoring sentiment...")
    processed = []
    discarded = 0

    for post in raw_posts:
        classified = classify(post)
        if classified is None:
            discarded += 1
            continue
        tagged = tag_post(classified)
        scored = score_post(tagged)
        processed.append(scored)

    print(f"  Kept: {len(processed)} | Discarded (enterprise/low-confidence): {discarded}")

    # 5. Upsert to DB
    print("\nSTEP 5: Upserting to Supabase...")
    inserted = upsert_posts(processed)
    print(f"  Upserted: {inserted} posts")

    # 6. Cleanup
    print("\nSTEP 6: Pruning old posts...")
    delete_old_posts()

    # 7. Snapshot
    print("\nSTEP 7: Rebuilding daily snapshot...")
    rebuild_todays_snapshot()

    # 8. Spike detection
    print("\nSTEP 8: Detecting spikes...")
    spike_count = detect_and_store_spikes()

    # Summary
    elapsed = (datetime.now(tz=timezone.utc) - started_at).seconds
    print(f"\n{'='*50}")
    print(f"Run complete in {elapsed}s")
    print(f"  Posts fetched:    {len(raw_posts)}")
    print(f"  Posts kept:       {len(processed)}")
    print(f"  Posts discarded:  {discarded}")
    print(f"  Active spikes:    {spike_count}")
    print(f"{'='*50}\n")


if __name__ == "__main__":
    run()
