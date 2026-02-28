import { MOCK_FEATURE_DATA } from '../lib/mock'
import { FEATURE_LABELS } from '../lib/types'

function sentimentColor(v: number) {
  if (v <= -0.3) return 'var(--negative)'
  if (v <= -0.1) return '#f0a429'
  return 'var(--teams)'
}

function PlatformBars({ platform }: { platform: 'teams' | 'slack' }) {
  const color = platform === 'teams' ? 'var(--teams)' : 'var(--slack)'
  const sentiment = Object.values(MOCK_FEATURE_DATA).reduce(
    (sum, d) => sum + (platform === 'teams' ? d.teamsSentiment : d.slackSentiment), 0
  ) / Object.keys(MOCK_FEATURE_DATA).length

  const maxCount = Math.max(
    ...Object.values(MOCK_FEATURE_DATA).map(d => platform === 'teams' ? d.teams : d.slack)
  )

  return (
    <div className="card">
      <div className="comparison-header">
        <div className="platform-dot" style={{ background: color }} />
        <div className="comparison-platform">
          {platform === 'teams' ? 'Microsoft Teams' : 'Slack Free'}
        </div>
        <div className="comparison-sentiment" style={{ color: sentimentColor(sentiment) }}>
          {sentiment > 0 ? '+' : ''}{sentiment.toFixed(2)} avg
        </div>
      </div>

      {Object.entries(MOCK_FEATURE_DATA).map(([tag, d]) => {
        const count = platform === 'teams' ? d.teams : d.slack
        const sent = platform === 'teams' ? d.teamsSentiment : d.slackSentiment
        const pct = (count / maxCount) * 100

        return (
          <div className="feature-bar-row" key={tag}>
            <div className="feature-bar-label">{FEATURE_LABELS[tag]}</div>
            <div className="feature-bar-track">
              <div
                className="feature-bar-fill"
                style={{ width: `${pct}%`, background: sentimentColor(sent) }}
              />
            </div>
            <div className="feature-bar-count">{count}</div>
          </div>
        )
      })}
    </div>
  )
}

export function FeatureComparison() {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div className="section-title">Feature Volume &amp; Sentiment</div>
      <div className="comparison-grid">
        <PlatformBars platform="teams" />
        <PlatformBars platform="slack" />
      </div>
    </div>
  )
}
