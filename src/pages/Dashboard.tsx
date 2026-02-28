import { KpiTiles } from '../components/KpiTiles'
import { SpikeAlerts } from '../components/SpikeAlerts'
import { CompetitiveDelta } from '../components/CompetitiveDelta'
import { FeatureComparison } from '../components/FeatureComparison'
import { TrendChart } from '../components/TrendChart'
import { TopPosts } from '../components/TopPosts'
import { useDashboardData } from '../lib/useData'

export function Dashboard() {
  const { kpi, spikes, topPosts, featureData, trend, loading } = useDashboardData()

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title syne">Reddit Sentiment Dashboard</h1>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
            Teams Consumer vs Slack Free Tier · 90-day rolling window
          </div>
        </div>
        <div className="page-meta">
          <div>{kpi.windowStart} → {kpi.windowEnd}</div>
          <div>Last run: {kpi.lastRun}</div>
          <div style={{ color: 'var(--muted2)' }}>
            {(kpi.teamsPosts + kpi.slackPosts).toLocaleString()} posts analyzed
          </div>
        </div>
      </div>

      {loading && (
        <div className="no-data-banner">Loading data from Supabase...</div>
      )}

      <KpiTiles data={kpi} />
      <SpikeAlerts spikes={spikes} />
      <CompetitiveDelta featureData={featureData} />
      <FeatureComparison featureData={featureData} />

      <div className="bottom-row">
        <TrendChart trend={trend} />
        <TopPosts posts={topPosts} />
      </div>
    </div>
  )
}
