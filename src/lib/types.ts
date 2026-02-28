export interface DailySnapshot {
  snapshot_date: string
  platform: 'teams' | 'slack'
  feature_tag: string
  post_count: number
  avg_sentiment: number
  total_upvotes: number
}

export interface Spike {
  id: number
  detected_date: string
  platform: 'teams' | 'slack'
  feature_tag: string
  current_week_count: number
  four_week_avg: number
  pct_increase: number
  is_active: boolean
}

export interface Post {
  id: string
  source_subreddit: string
  platform: 'teams' | 'slack'
  title: string
  body: string
  url: string
  upvotes: number
  created_utc: string
  sentiment_score: number
  feature_tags: string[]
  consumer_confidence: number
}

export interface KpiData {
  teamsPosts: number
  slackPosts: number
  teamsAvgSentiment: number
  slackAvgSentiment: number
  activeSpikes: number
  windowStart: string
  windowEnd: string
  lastRun: string
}

export const FEATURE_LABELS: Record<string, string> = {
  calling_video: 'Calling & Video',
  notifications: 'Notifications',
  mobile_app: 'Mobile App',
  presence_status: 'Presence & Status',
  file_sharing: 'File Sharing',
  chat_messaging: 'Chat & Messaging',
  performance_speed: 'Performance',
  login_account: 'Login & Account',
  ui_design: 'UI & Design',
  reliability_bugs: 'Reliability & Bugs',
  uncategorized: 'Uncategorized',
}
