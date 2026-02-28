import type { KpiData } from '../lib/types'

function sentimentColor(v: number) {
  if (v >= 0.1) return 'var(--positive)'
  if (v <= -0.1) return 'var(--negative)'
  return 'var(--muted2)'
}

export function KpiTiles({ data }: { data: KpiData }) {
  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-label">Teams Consumer Posts</div>
        <div className="kpi-value" style={{ color: 'var(--teams)' }}>
          {data.teamsPosts.toLocaleString()}
        </div>
        <div className="kpi-sub">90-day window</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-label">Slack Free Tier Posts</div>
        <div className="kpi-value" style={{ color: 'var(--slack)' }}>
          {data.slackPosts.toLocaleString()}
        </div>
        <div className="kpi-sub">90-day window</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-label">Avg Sentiment</div>
        <div className="kpi-value" style={{ fontSize: '26px', paddingTop: '3px' }}>
          <span style={{ color: sentimentColor(data.teamsAvgSentiment) }}>
            {data.teamsAvgSentiment > 0 ? '+' : ''}{data.teamsAvgSentiment.toFixed(2)}
          </span>
          <span style={{ color: 'var(--muted)', fontSize: '16px', margin: '0 6px' }}>vs</span>
          <span style={{ color: sentimentColor(data.slackAvgSentiment) }}>
            {data.slackAvgSentiment > 0 ? '+' : ''}{data.slackAvgSentiment.toFixed(2)}
          </span>
        </div>
        <div className="kpi-sub">Teams vs Slack</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-label">Active Spikes</div>
        <div className="kpi-value" style={{ color: data.activeSpikes > 0 ? 'var(--spike)' : 'var(--muted2)' }}>
          {data.activeSpikes}
        </div>
        <div className="kpi-sub">features with &gt;50% WoW jump</div>
      </div>
    </div>
  )
}
