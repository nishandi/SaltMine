import type { FeatureRow } from '../lib/useData'
import { FEATURE_LABELS } from '../lib/types'

export function CompetitiveDelta({ featureData }: { featureData: Record<string, FeatureRow> }) {
  if (Object.keys(featureData).length === 0) {
    return (
      <div style={{ marginBottom: '24px' }}>
        <div className="section-title">Teams vs Slack — Sentiment Delta by Feature</div>
        <div className="no-data-banner">No data yet — check back after the pipeline runs.</div>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <div className="section-title">Teams vs Slack — Sentiment Delta by Feature</div>
      <div className="delta-strip">
        {Object.entries(featureData).map(([tag, d]) => {
          const delta = d.teamsSentiment - d.slackSentiment
          const better = delta > 0.03
          const worse = delta < -0.03
          return (
            <div className="delta-chip" key={tag}>
              <span className="delta-label">{FEATURE_LABELS[tag]}</span>
              <span
                className="delta-indicator"
                style={{ color: better ? 'var(--positive)' : worse ? 'var(--negative)' : 'var(--muted)' }}
              >
                {better ? '▲' : worse ? '▼' : '–'}
                {delta > 0 ? '+' : ''}{(delta * 100).toFixed(0)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
