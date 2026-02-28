import { KpiTiles } from '../components/KpiTiles'
import { SpikeAlerts } from '../components/SpikeAlerts'
import { CompetitiveDelta } from '../components/CompetitiveDelta'
import { FeatureComparison } from '../components/FeatureComparison'
import { TrendChart } from '../components/TrendChart'
import { TopPosts } from '../components/TopPosts'
import { MOCK_KPI, MOCK_SPIKES, MOCK_TOP_POSTS } from '../lib/mock'

export function Dashboard() {
  const kpi = MOCK_KPI

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

      <div className="no-data-banner">
        ⚡ Showing mock data — pipeline is live but Reddit OAuth credentials needed to fetch real posts.
        See PRD for setup steps.
      </div>

      <KpiTiles data={kpi} />
      <SpikeAlerts spikes={MOCK_SPIKES} />
      <CompetitiveDelta />
      <FeatureComparison />

      <div className="bottom-row">
        <TrendChart />
        <TopPosts posts={MOCK_TOP_POSTS} />
      </div>
    </div>
  )
}
