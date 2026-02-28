import { MOCK_FEATURE_DATA } from '../lib/mock'
import { FEATURE_LABELS } from '../lib/types'

export function CompetitiveDelta() {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div className="section-title">Teams vs Slack — Sentiment Delta by Feature</div>
      <div className="delta-strip">
        {Object.entries(MOCK_FEATURE_DATA).map(([tag, d]) => {
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
