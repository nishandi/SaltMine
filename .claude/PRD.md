# SaltMine — Product Requirements Document
> **Renamed from PulseCheck.**

**Version:** 1.0
**Status:** MVP Spec
**Author:** Product Owner (via Claude session)
**Date:** February 26, 2026

**Decided: Frontend hosted on Azure Static Web Apps (free tier). No auth for MVP — share link internally.**

---

## 1. Product Overview

### 1.1 What Is PulseCheck?

PulseCheck is a daily-refreshed web dashboard that aggregates Reddit feedback about **Microsoft Teams (consumer/personal accounts only)** and benchmarks it against **Slack (free tier only)**. It surfaces what users are complaining about, which issues are spiking, and where Teams is winning or losing against its closest consumer competitor — all without requiring any manual research.

The soul of the product is the **aggregation, classification, and visual display of insights** — not raw data. A product manager should be able to open PulseCheck every morning and understand the pulse of user sentiment in under 60 seconds.

### 1.2 Who Is It For?

Primary: The Microsoft Teams consumer product team (PMs, designers, engineers).  
Secondary: Anyone who wants competitive insight between Teams personal and Slack free tier.

### 1.3 Why Does It Exist?

- Enterprise Teams feedback dominates internal Microsoft channels (support tickets, IT forums). Consumer user voices are drowned out.
- Consumer users vent publicly on Reddit — this is unstructured, high-signal data that currently goes unanalyzed.
- No existing tool cleanly separates Teams consumer feedback from Teams enterprise feedback.
- Benchmarking against Slack free tier (not enterprise Slack) gives a meaningful, apples-to-apples competitive comparison.

### 1.4 Design Philosophy

- **Zero cost to run.** All infrastructure must be free tier.
- **Non-technical owner.** All code is written by Claude. The owner does not write code.
- **Simple over scalable.** No over-engineering. MVP only.
- **Data integrity over volume.** A smaller, clean dataset beats a large, polluted one.
- **Once-daily is enough.** Reddit feedback doesn't require sub-minute freshness. Data refreshes once per day at ~6am.

---

## 2. Scope & Constraints

### 2.1 In Scope (MVP)

- Reddit as the only data source
- Microsoft Teams — consumer/personal accounts only (NOT enterprise)
- Slack — free tier only (NOT paid plans)
- Web dashboard with three screens: Homepage, Feature Deep Dive, Raw Feed
- Once-daily data collection via scheduled job
- 90-day rolling data window (all metrics are cumulative over 90 days)
- Consumer vs. enterprise classification via NLP keyword scoring
- Feature-level tagging of posts
- Sentiment scoring per post
- Spike detection (features with >50% week-over-week volume increase)
- Competitive benchmarking at the feature level

### 2.2 Explicitly Out of Scope (MVP)

- No X/Twitter, LinkedIn, or any other data source
- No enterprise Teams data
- No paid Slack tiers
- No MCP server or plugin architecture
- No user accounts or authentication
- No real-time streaming (once daily is sufficient)
- No mobile app
- No email/Slack alerting (dashboard only for MVP)
- No AI-generated summaries or GPT integrations
- No payment, monetization, or business model

---

## 3. Data Sources & Subreddits

### 3.1 Reddit API

Use the **official Reddit API via PRAW** (Python Reddit API Wrapper). Do not scrape HTML. PRAW is free, requires no payment, and handles rate limiting gracefully.

**Setup:** Create a Reddit app at reddit.com/prefs/apps to obtain `client_id`, `client_secret`, and `user_agent`. Free tier allows 100 requests/minute — more than sufficient.

### 3.2 Target Subreddits

**For Teams Consumer signal:**
- r/MicrosoftTeams (primary — highest volume, needs enterprise filtering)
- r/microsoft
- r/Windows11
- r/techsupport (filter to Teams-related posts only)
- r/mspowerusers

**For Slack Free Tier signal:**
- r/Slack (primary)
- r/productivity (filter to Slack-related posts only)
- r/techsupport (filter to Slack-related posts only)

### 3.3 Data Collected Per Post

Each post and top-level comment collected should store:

| Field | Description |
|---|---|
| `id` | Reddit post/comment ID |
| `source_subreddit` | Which subreddit it came from |
| `platform` | `teams` or `slack` |
| `title` | Post title |
| `body` | Post body or comment text |
| `url` | Link to original Reddit post |
| `upvotes` | Score at time of collection |
| `created_utc` | Original post timestamp |
| `collected_at` | When we pulled it |
| `consumer_confidence` | Float 0–1, NLP-scored (see Section 4) |
| `sentiment_score` | Float -1 to +1 |
| `feature_tags` | Array of feature bucket strings |
| `is_included` | Boolean — passed consumer threshold |

---

## 4. Core NLP Classification Logic

This is the most important layer. Every post must be classified before storage. The classification happens in three steps.

### 4.1 Step 1 — Consumer vs. Enterprise Scoring

Every post gets a `consumer_confidence` score from 0 to 1. Posts scoring **below 0.4 are discarded** for Teams (Slack posts use a simpler filter since Slack free tier signals are more obvious).

**Consumer signal words (raise score):**
`personal account`, `personal use`, `free version`, `Teams for life`, `Teams personal`, `family`, `friends`, `home`, `not work`, `consumer`, `personal Teams`, `free Teams`, `my friends`, `my family`, `personal chat`

**Enterprise signal words (lower score / likely discard):**
`tenant`, `admin`, `IT department`, `our organization`, `O365`, `Office 365`, `SharePoint`, `Azure AD`, `AAD`, `compliance`, `Teams Rooms`, `deployment`, `MDM`, `license`, `enterprise`, `our company`, `company policy`, `IT admin`, `helpdesk`, `conditional access`, `Intune`

**Scoring method:** Start at 0.5. Each consumer keyword found: +0.1. Each enterprise keyword found: -0.15. Clamp to [0, 1]. If score < 0.4, discard.

Posts with no strong signal either way (score 0.4–0.6) are kept but flagged as `uncertain_consumer`.

**Subreddit context boosts:** Posts from r/techsupport mentioning "personal account" or "free version" get +0.15 bonus (enterprise users don't post to r/techsupport).

### 4.2 Step 2 — Feature Tagging

Every post is tagged to one or more of these feature buckets. Tagging is keyword-based.

| Feature Bucket | Keywords/Patterns |
|---|---|
| `calling_video` | call, calling, video call, dropped call, call quality, video quality, join call, meet |
| `notifications` | notification, notify, alert, badge, ping, DND, do not disturb, notification sound |
| `mobile_app` | iOS, iPhone, Android, mobile app, phone app, app crash, mobile version |
| `presence_status` | status, presence, available, busy, away, appear offline, green dot |
| `file_sharing` | file, attachment, upload, download, share file, OneDrive, document |
| `chat_messaging` | message, chat, DM, direct message, reply, thread, read receipt |
| `performance_speed` | slow, lag, loading, performance, hang, freeze, memory, CPU, heavy |
| `login_account` | login, sign in, sign out, account, password, two-factor, 2FA, authentication |
| `ui_design` | UI, interface, design, layout, dark mode, theme, button, ugly, redesign |
| `reliability_bugs` | crash, bug, broken, not working, error, issue, glitch, stopped working |

A post can have multiple tags. If no tag matches, it's tagged `uncategorized`.

### 4.3 Step 3 — Sentiment Scoring

Use **VADER** (Valence Aware Dictionary and sEntiment Reasoner) — a Python library, free, no API key needed, works well on informal social media text. Returns a compound score from -1 (very negative) to +1 (very positive).

`pip install vaderSentiment`

Score the concatenation of post title + body. Store the compound score.

---

## 5. Data Collection Pipeline

### 5.1 Schedule

Run once daily at **6:00am** via a cron job. Collects posts from the previous 24 hours across all target subreddits. Processes and stores results. Dashboard reads from the database — always reflects last 90 days of clean, classified data.

### 5.2 Pipeline Steps (in order)

1. For each subreddit in the target list, fetch posts from last 24 hours using PRAW
2. For subreddits with mixed content (r/techsupport, r/productivity), filter to only posts mentioning "Teams" or "Slack" in title/body
3. For each post, run consumer/enterprise classifier → discard if below threshold
4. For each surviving post, run feature tagger and sentiment scorer
5. Store in database with all fields
6. Delete any records older than 90 days (rolling window maintenance)
7. Log run summary: posts fetched, posts kept, posts discarded, breakdown by platform

### 5.3 Parallelization

Fetch multiple subreddits concurrently (e.g., via Python `asyncio` or `ThreadPoolExecutor`). This keeps the daily job fast without adding infrastructure complexity.

---

## 6. Tech Stack

All components must be **free to host and run**.

| Layer | Choice | Why |
|---|---|---|
| Data collection | Python + PRAW | Official Reddit API, free, well-documented |
| NLP / classification | Python + VADER + keyword matching | Free, no API keys, fast |
| Database | Supabase (free tier) | Free PostgreSQL, has JavaScript client for direct frontend queries |
| Scheduler / backend host | Render (free tier) | Supports cron jobs, Python, free |
| Frontend | React (single page app) | Component-based, easy to iterate |
| Frontend host | Vercel (free tier) | Free static hosting, auto-deploys |
| Reddit API client | PRAW | `pip install praw` |
| Sentiment | VADER | `pip install vaderSentiment` |

### 6.1 No Backend API Needed

The frontend reads directly from Supabase using the Supabase JavaScript client. No custom REST API layer is needed for MVP. Supabase's Row Level Security can be set to public read for the insights tables.

---

## 7. Database Schema

### Table: `posts`
Stores every collected and classified post.

```sql
CREATE TABLE posts (
  id TEXT PRIMARY KEY,                    -- Reddit post ID
  source_subreddit TEXT,
  platform TEXT,                          -- 'teams' or 'slack'
  title TEXT,
  body TEXT,
  url TEXT,
  upvotes INTEGER,
  created_utc TIMESTAMPTZ,
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  consumer_confidence FLOAT,
  sentiment_score FLOAT,
  feature_tags TEXT[],
  is_uncertain_consumer BOOLEAN DEFAULT FALSE
);
```

### Table: `daily_snapshots`
Pre-aggregated daily rollup — makes dashboard queries fast.

```sql
CREATE TABLE daily_snapshots (
  snapshot_date DATE,
  platform TEXT,
  feature_tag TEXT,
  post_count INTEGER,
  avg_sentiment FLOAT,
  total_upvotes INTEGER,
  PRIMARY KEY (snapshot_date, platform, feature_tag)
);
```

---

## 8. Application Screens

### 8.1 Screen 1 — Homepage Dashboard (Primary)

This is the main screen. Opened daily. Must communicate everything important at a glance.

**Layout (top to bottom):**

**Header Bar**
- Product name: PulseCheck
- Last updated timestamp ("Last run: today 06:12am")
- Date range ("90-day window: Nov 28 – Feb 26")
- Total posts analyzed

**KPI Tiles (4 across)**
1. Teams Consumer Posts (90d) — count with % change vs prior 90d
2. Slack Free Tier Posts (90d) — count with % change vs prior 90d
3. Teams Avg Sentiment — score (-1 to +1) with Slack score for comparison
4. Active Spikes — count of features with >50% week-over-week volume jump

**Spike Alerts Section**
- Title: "⚡ This Week's Spikes"
- Shows all features currently spiking (>50% WoW increase)
- Each spike card shows: platform, feature name, % increase vs 4-week average, and a sample high-upvote post quote
- Cards are amber/orange — visually distinct, cannot be missed
- Clicking a card goes to the Feature Deep Dive for that feature

**Competitive Delta Strip**
- One horizontal row showing each feature bucket
- For each feature: label + whether Teams is better, worse, or equal vs Slack (sentiment delta)
- Color coded: red = Teams worse, green = Teams better, grey = equal
- Quick scannable competitive health check

**Feature Comparison Panel (two columns)**
- Left column: Teams Consumer
- Right column: Slack Free Tier
- Each column: platform name, overall sentiment score, then a bar chart of post volume by feature bucket
- Bars are color-coded: red = high negative sentiment on that feature, amber = mixed, blue/yellow = neutral
- Columns are designed for direct left-right visual comparison
- Clicking any feature bar goes to Feature Deep Dive

**Bottom Row (two panels)**
- Left: 90-Day Trend Chart — line chart of weekly post volume over 90 days, Teams and Slack overlaid, with spike annotations marked
- Right: Top Posts by Upvotes — feed of the 5 highest-upvoted posts from the last 7 days, showing platform, feature tag, sentiment dot, title, upvote count

### 8.2 Screen 2 — Feature Deep Dive

Accessed by clicking any feature from the homepage.

**Contents:**
- Feature name as page title
- 90-day trend line: Teams vs Slack, weekly post volume + sentiment, overlaid on same chart
- Summary stats: total posts, avg sentiment, top subreddit source, peak week
- Feed of all Reddit posts tagged to this feature, sorted by upvotes descending
- Each post card: subreddit badge, platform badge, sentiment dot, title, upvote count, date, link to original thread
- Filter controls: platform, sentiment (positive/neutral/negative), date range, consumer confidence threshold

### 8.3 Screen 3 — Raw Feed

A simple, filterable table of all posts in the database.

**Columns:** Platform, Subreddit, Feature Tags, Sentiment, Consumer Confidence, Upvotes, Date, Post Title (linked)

**Filters:** Platform, Feature Tag, Sentiment range, Date range, Min upvotes, Consumer confidence threshold

**Purpose:** "Show your work" screen. Lets users verify classifications, audit unusual spikes, find specific posts.

---

## 9. Spike Detection Logic

A spike is defined as: a feature bucket whose **post count in the last 7 days is ≥ 50% higher than its 4-week rolling average** (calculated from days 8–35).

Calculate daily at pipeline run time. Store spike status in a `spikes` table or as a flag on `daily_snapshots`. The homepage spike alerts section reads from this.

Spikes older than 7 days are no longer shown as "active" on the homepage but remain in the historical data.

---

## 10. Visual Design Reference

The UI has been prototyped. Key design decisions to maintain:

- **Dark theme** — background `#0a0c10`, surface `#111318`
- **Teams color** — `#5B8DEF` (blue)
- **Slack color** — `#E8A838` (amber)
- **Positive sentiment** — `#3dd68c` (green)
- **Negative sentiment** — `#f4645f` (red)
- **Spike/warning color** — `#f0a429` (orange-amber)
- **Font** — Syne (headings, numbers, bold labels) + DM Mono (body, metadata, data)
- **Background grid** — subtle 40px dot/line grid for depth
- **Sidebar** — sticky left nav with pipeline status at bottom
- **Animations** — subtle fade-up on KPI tiles on load

The homepage HTML prototype has been built and approved. Use it as the visual reference when building the real frontend.

---

## 11. Build Sequence (Recommended)

Build in this order. Do not start the next phase until the current one produces verified output.

Legend: ✅ Done | 🔄 In Progress | ⬜ Not Started

**Phase 1 — Data Pipeline**
- ✅ 1. Set up Supabase project, create tables (posts, daily_snapshots, spikes + RLS + indexes)
- ✅ 2. Write Reddit fetcher (public JSON API — no PRAW, no credentials needed)
- ✅ 3. Write consumer/enterprise classifier
- ✅ 4. Write feature tagger
- ✅ 5. Write VADER sentiment scorer
- ✅ 6. Write database insertion logic (upsert + batching)
- ✅ 7. Write 90-day rolling window cleanup + daily_snapshots + spike detection
- ✅ 8. Test: pipeline runs clean, Supabase connected (Reddit blocked on corp network — expected)
- ✅ 9. Deploy pipeline as daily cron job — GitHub Actions on personal account (nishandi/SaltMine), runs daily at 6am UTC. First manual run succeeded (43s). Posts = 0 because Reddit blocks GitHub Actions' Azure IPs — fix is Reddit OAuth credentials (one-time setup from home network, see blocker note below).

**Phase 2 — Homepage Dashboard**
- ✅ 10. React project built — all homepage components complete, pushed to nishandi/SaltMine master
- ✅ 11. Supabase JS client wired up (reads from VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY)
- ✅ 12. KPI tiles (Teams posts, Slack posts, avg sentiment, active spikes)
- ✅ 13. Spike alerts section (amber cards with %, feature name, post count vs avg)
- ✅ 14. Competitive delta strip (per-feature sentiment delta chips, color coded)
- ✅ 15. Feature comparison bars (Teams + Slack side by side, bar color = sentiment severity)
- ✅ 16. 90-day trend chart (Recharts line chart, both platforms overlaid)
- ✅ 17. Top posts feed (platform badge, subreddit, sentiment dot, upvotes, age)
- ✅ 18. Wire dashboard to real Supabase data — `useDashboardData` hook fetches posts, spikes, daily_snapshots in parallel; no mock fallbacks; all components show "No data yet" when data is absent
- ✅ 19. Deploy to GitHub Pages — https://nishandi.github.io/SaltMine/ (live, 2026-02-28)

**Phase 3 — Secondary Screens**
- ⬜ 20. Feature Deep Dive screen
- ⬜ 21. Raw Feed screen with filters

---

## SESSION NOTES — 2026-02-28 (current)

### Status: Phase 1 + Phase 2 fully complete. Site is live with real data.

### Infrastructure (all ✅)
- Pipeline: GitHub Actions, daily 6am UTC, `.github/workflows/pipelines.yml`
- Fetcher: Reddit RSS feeds (`/new/.rss`) — no credentials needed, bypasses IP blocking
- Database: Supabase PostgreSQL, 3 tables: `posts`, `daily_snapshots`, `spikes`
- Frontend: https://nishandi.github.io/SaltMine/ (GitHub Pages, auto-deploys on push to master)
- GitHub secrets: `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (pipeline), `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (frontend build)

### Data as of 2026-02-28
- 14 posts in Supabase (8 Teams, 6 Slack) — 1 pipeline run so far
- Pipeline runs daily — data will accumulate automatically
- `daily_snapshots` table is empty — populated by aggregation logic in `pipeline/database.py` — will fill once enough posts exist
- Upvotes stored as 0 (not in RSS) — acceptable for MVP

### Dashboard state
- **KPI tiles**: showing real data (post counts + VADER sentiment averages) ✅
- **Spike alerts**: showing "No active spikes" (correct — not enough data yet) ✅
- **Competitive delta, Feature bars, Trend chart**: showing "No data yet" — waiting for `daily_snapshots` to populate ✅
- **Top posts**: showing real data ✅
- No mock data anywhere — all fallbacks removed, "No data yet" shown instead

### Tech notes
- Sentiment: VADER compound score, -1 to +1, scored on title + body
- Node 20.11 on dev machine — dev server fails, use `npm run build && npx serve dist` for local preview
- Vite base: `/SaltMine/` (required for GitHub Pages)

### Next session priorities (Phase 3)
1. **Feature Deep Dive screen** — click feature → 90d trend + stats + all posts for that feature with filters
2. **Raw Feed screen** — filterable table of all posts (platform, feature, sentiment, date, upvotes, confidence)

---

## 12. Key Decisions Log

These decisions were made during product design and should not be revisited without good reason:

| Decision | Rationale |
|---|---|
| Reddit only (no X, LinkedIn etc.) | Keeps MVP simple and free; Reddit API is clean and structured |
| PRAW not scraping | More reliable, structured data, rate limits are clear |
| Teams consumer only, not enterprise | Enterprise feedback is drowned in IT/admin noise; consumer is the underserved signal |
| Slack free tier only | Comparable product context to Teams personal; paid Slack is a different audience |
| Once-daily collection | Reddit posts don't require sub-minute freshness; simplifies infra dramatically |
| 90-day rolling window | Enough historical context for trends without excessive storage |
| No email/Slack alerting in MVP | Dashboard-first; alerts can be added later |
| VADER for sentiment | Free, no API key, proven on informal social text |
| Keyword-based feature tagging | Fast, explainable, good enough for MVP; can upgrade to ML later |
| Supabase direct from frontend | Eliminates need for a backend API layer in MVP |
| Azure Static Web Apps (not Vercel) | Free, Microsoft-native, auto-deploys from GitHub |
| No auth for MVP | Data is public Reddit content; share URL internally. Add Cloudflare Access later if needed. |
| Product name: SaltMine | Pun on Reddit salt mine + consumer complaint signal |
| Discard posts with consumer_confidence < 0.4 | Prefer clean small dataset over large polluted one |

---

## 13. Out of Scope — Future Considerations

These are ideas discussed but explicitly excluded from MVP:

- MCP server to plug in new data sources
- X/Twitter data source
- LinkedIn data source
- Email or Slack alerting when spikes occur
- "Switcher posts" — posts where users explicitly say they moved from Teams to Slack or vice versa
- NLP-based feature tagging (upgrade from keyword matching)
- Fine-tuned sentiment model (upgrade from VADER)
- User authentication
- Multiple product comparisons (e.g., Zoom, Discord)
- SharePoint as hosting option
