import type { DailySnapshot, Spike, Post, KpiData } from './types'

export const MOCK_KPI: KpiData = {
  teamsPosts: 1247,
  slackPosts: 892,
  teamsAvgSentiment: -0.18,
  slackAvgSentiment: -0.12,
  activeSpikes: 3,
  windowStart: '2025-11-29',
  windowEnd: '2026-02-27',
  lastRun: '2026-02-27 06:14 UTC',
}

export const MOCK_SPIKES: Spike[] = [
  {
    id: 1,
    detected_date: '2026-02-27',
    platform: 'teams',
    feature_tag: 'notifications',
    current_week_count: 87,
    four_week_avg: 47.8,
    pct_increase: 82.0,
    is_active: true,
  },
  {
    id: 2,
    detected_date: '2026-02-27',
    platform: 'teams',
    feature_tag: 'login_account',
    current_week_count: 61,
    four_week_avg: 36.5,
    pct_increase: 67.1,
    is_active: true,
  },
  {
    id: 3,
    detected_date: '2026-02-27',
    platform: 'slack',
    feature_tag: 'mobile_app',
    current_week_count: 44,
    four_week_avg: 28.6,
    pct_increase: 53.8,
    is_active: true,
  },
]

const FEATURES = [
  'calling_video', 'notifications', 'mobile_app', 'presence_status',
  'file_sharing', 'chat_messaging', 'performance_speed', 'login_account',
  'ui_design', 'reliability_bugs',
]

export const MOCK_SNAPSHOTS: DailySnapshot[] = FEATURES.flatMap(tag => [
  {
    snapshot_date: '2026-02-27',
    platform: 'teams' as const,
    feature_tag: tag,
    post_count: Math.floor(Math.random() * 120) + 20,
    avg_sentiment: parseFloat((-0.4 + Math.random() * 0.5).toFixed(3)),
    total_upvotes: Math.floor(Math.random() * 500) + 50,
  },
  {
    snapshot_date: '2026-02-27',
    platform: 'slack' as const,
    feature_tag: tag,
    post_count: Math.floor(Math.random() * 90) + 10,
    avg_sentiment: parseFloat((-0.3 + Math.random() * 0.5).toFixed(3)),
    total_upvotes: Math.floor(Math.random() * 400) + 30,
  },
])

// Deterministic mock snapshot data for feature comparison
export const MOCK_FEATURE_DATA: Record<string, { teams: number; slack: number; teamsSentiment: number; slackSentiment: number }> = {
  calling_video:    { teams: 234, slack: 98,  teamsSentiment: -0.31, slackSentiment: -0.18 },
  notifications:    { teams: 187, slack: 112, teamsSentiment: -0.28, slackSentiment: -0.21 },
  mobile_app:       { teams: 156, slack: 134, teamsSentiment: -0.22, slackSentiment: -0.19 },
  presence_status:  { teams: 98,  slack: 44,  teamsSentiment: -0.15, slackSentiment: -0.08 },
  file_sharing:     { teams: 87,  slack: 61,  teamsSentiment: -0.19, slackSentiment: -0.14 },
  chat_messaging:   { teams: 143, slack: 178, teamsSentiment: -0.12, slackSentiment: -0.09 },
  performance_speed:{ teams: 201, slack: 88,  teamsSentiment: -0.38, slackSentiment: -0.22 },
  login_account:    { teams: 112, slack: 67,  teamsSentiment: -0.24, slackSentiment: -0.17 },
  ui_design:        { teams: 76,  slack: 103, teamsSentiment: -0.08, slackSentiment: 0.04  },
  reliability_bugs: { teams: 178, slack: 71,  teamsSentiment: -0.41, slackSentiment: -0.26 },
}

// 13 weeks of trend data
export const MOCK_TREND: Array<{ week: string; teams: number; slack: number }> = [
  { week: 'Dec 2',  teams: 78,  slack: 52 },
  { week: 'Dec 9',  teams: 84,  slack: 58 },
  { week: 'Dec 16', teams: 71,  slack: 49 },
  { week: 'Dec 23', teams: 55,  slack: 41 },
  { week: 'Dec 30', teams: 62,  slack: 44 },
  { week: 'Jan 6',  teams: 89,  slack: 61 },
  { week: 'Jan 13', teams: 95,  slack: 67 },
  { week: 'Jan 20', teams: 102, slack: 71 },
  { week: 'Jan 27', teams: 98,  slack: 68 },
  { week: 'Feb 3',  teams: 107, slack: 74 },
  { week: 'Feb 10', teams: 119, slack: 79 },
  { week: 'Feb 17', teams: 128, slack: 83 },
  { week: 'Feb 24', teams: 143, slack: 87 },
]

export const MOCK_TOP_POSTS: Post[] = [
  {
    id: 'teams_abc123',
    source_subreddit: 'MicrosoftTeams',
    platform: 'teams',
    title: 'Teams notifications broken after latest update — not receiving any calls on personal account',
    body: '',
    url: 'https://reddit.com/r/MicrosoftTeams/comments/abc123',
    upvotes: 342,
    created_utc: '2026-02-26T14:22:00Z',
    sentiment_score: -0.71,
    feature_tags: ['notifications', 'calling_video'],
    consumer_confidence: 0.82,
  },
  {
    id: 'teams_def456',
    source_subreddit: 'techsupport',
    platform: 'teams',
    title: 'Can\'t sign in to Teams personal account — keeps looping to login page',
    body: '',
    url: 'https://reddit.com/r/techsupport/comments/def456',
    upvotes: 218,
    created_utc: '2026-02-25T09:11:00Z',
    sentiment_score: -0.62,
    feature_tags: ['login_account'],
    consumer_confidence: 0.79,
  },
  {
    id: 'slack_ghi789',
    source_subreddit: 'Slack',
    platform: 'slack',
    title: 'Free tier message history limit is getting worse — only 3 months now?',
    body: '',
    url: 'https://reddit.com/r/Slack/comments/ghi789',
    upvotes: 187,
    created_utc: '2026-02-26T18:44:00Z',
    sentiment_score: -0.54,
    feature_tags: ['chat_messaging'],
    consumer_confidence: 0.91,
  },
  {
    id: 'teams_jkl012',
    source_subreddit: 'Windows11',
    platform: 'teams',
    title: 'Teams app is using 800MB RAM just sitting idle — this is insane for a chat app',
    body: '',
    url: 'https://reddit.com/r/Windows11/comments/jkl012',
    upvotes: 156,
    created_utc: '2026-02-24T21:33:00Z',
    sentiment_score: -0.78,
    feature_tags: ['performance_speed'],
    consumer_confidence: 0.68,
  },
  {
    id: 'slack_mno345',
    source_subreddit: 'productivity',
    platform: 'slack',
    title: 'Switched from Teams to Slack for personal projects — night and day difference in UI',
    body: '',
    url: 'https://reddit.com/r/productivity/comments/mno345',
    upvotes: 134,
    created_utc: '2026-02-25T16:05:00Z',
    sentiment_score: 0.34,
    feature_tags: ['ui_design', 'chat_messaging'],
    consumer_confidence: 0.76,
  },
]
