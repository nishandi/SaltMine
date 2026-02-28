import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import type { KpiData, Spike, Post } from './types'
import { MOCK_KPI, MOCK_SPIKES, MOCK_TOP_POSTS, MOCK_FEATURE_DATA, MOCK_TREND } from './mock'

export interface FeatureRow {
  teams: number
  slack: number
  teamsSentiment: number
  slackSentiment: number
}

export interface TrendRow {
  week: string
  teams: number
  slack: number
}

export interface DashboardData {
  kpi: KpiData
  spikes: Spike[]
  topPosts: Post[]
  featureData: Record<string, FeatureRow>
  trend: TrendRow[]
  isLive: boolean
  loading: boolean
}

function weekLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function useDashboardData(): DashboardData {
  const [data, setData] = useState<DashboardData>({
    kpi: MOCK_KPI,
    spikes: MOCK_SPIKES,
    topPosts: MOCK_TOP_POSTS,
    featureData: MOCK_FEATURE_DATA,
    trend: MOCK_TREND,
    isLive: false,
    loading: true,
  })

  useEffect(() => {
    if (!supabase) {
      setData(d => ({ ...d, loading: false }))
      return
    }

    async function load() {
      try {
        // Fetch all three tables in parallel
        const [postsRes, spikesRes, snapshotsRes] = await Promise.all([
          supabase!.from('posts')
            .select('id,source_subreddit,platform,title,body,url,upvotes,created_utc,sentiment_score,feature_tags,consumer_confidence')
            .order('created_utc', { ascending: false })
            .limit(500),
          supabase!.from('spikes')
            .select('*')
            .eq('is_active', true)
            .order('pct_increase', { ascending: false }),
          supabase!.from('daily_snapshots')
            .select('snapshot_date,platform,feature_tag,post_count,avg_sentiment')
            .order('snapshot_date', { ascending: true }),
        ])

        const posts: Post[] = postsRes.data ?? []
        const spikes: Spike[] = spikesRes.data ?? []
        const snapshots = snapshotsRes.data ?? []

        // Fall back to mock if no real data yet
        if (posts.length === 0) {
          setData(d => ({ ...d, loading: false }))
          return
        }

        // KPI — aggregate from posts
        const teamsPosts = posts.filter(p => p.platform === 'teams')
        const slackPosts = posts.filter(p => p.platform === 'slack')
        const teamsAvg = teamsPosts.reduce((s, p) => s + (p.sentiment_score ?? 0), 0) / (teamsPosts.length || 1)
        const slackAvg = slackPosts.reduce((s, p) => s + (p.sentiment_score ?? 0), 0) / (slackPosts.length || 1)

        const allDates = posts.map(p => p.created_utc).sort()
        const windowStart = allDates[0]?.slice(0, 10) ?? MOCK_KPI.windowStart
        const windowEnd = allDates[allDates.length - 1]?.slice(0, 10) ?? MOCK_KPI.windowEnd

        const kpi: KpiData = {
          teamsPosts: teamsPosts.length,
          slackPosts: slackPosts.length,
          teamsAvgSentiment: parseFloat(teamsAvg.toFixed(2)),
          slackAvgSentiment: parseFloat(slackAvg.toFixed(2)),
          activeSpikes: spikes.length,
          windowStart,
          windowEnd,
          lastRun: new Date().toISOString().slice(0, 10) + ' (live)',
        }

        // Top posts — highest upvotes, or most recent if upvotes all 0
        const sortedPosts = [...posts].sort((a, b) =>
          b.upvotes !== a.upvotes ? b.upvotes - a.upvotes : new Date(b.created_utc).getTime() - new Date(a.created_utc).getTime()
        )
        const topPosts = sortedPosts.slice(0, 5)

        // Feature data — aggregate from snapshots
        const featureData: Record<string, FeatureRow> = {}
        for (const row of snapshots) {
          if (!featureData[row.feature_tag]) {
            featureData[row.feature_tag] = { teams: 0, slack: 0, teamsSentiment: 0, slackSentiment: 0 }
          }
          const f = featureData[row.feature_tag]
          if (row.platform === 'teams') {
            f.teams += row.post_count
            f.teamsSentiment = row.avg_sentiment  // use latest
          } else {
            f.slack += row.post_count
            f.slackSentiment = row.avg_sentiment
          }
        }

        // Trend — group snapshots by week
        const weekMap: Record<string, { teams: number; slack: number }> = {}
        for (const row of snapshots) {
          const d = new Date(row.snapshot_date)
          // Round down to Monday
          const day = d.getDay()
          const diff = d.getDate() - day + (day === 0 ? -6 : 1)
          const monday = new Date(d.setDate(diff))
          const label = weekLabel(monday.toISOString())
          if (!weekMap[label]) weekMap[label] = { teams: 0, slack: 0 }
          weekMap[label][row.platform as 'teams' | 'slack'] += row.post_count
        }
        const trend: TrendRow[] = Object.entries(weekMap)
          .slice(-13)
          .map(([week, v]) => ({ week, ...v }))

        setData({
          kpi,
          spikes,
          topPosts,
          featureData: Object.keys(featureData).length > 0 ? featureData : MOCK_FEATURE_DATA,
          trend: trend.length > 1 ? trend : MOCK_TREND,
          isLive: true,
          loading: false,
        })
      } catch (err) {
        console.error('Supabase fetch failed:', err)
        setData(d => ({ ...d, loading: false }))
      }
    }

    load()
  }, [])

  return data
}
