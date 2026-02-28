import type { Spike } from '../lib/types'
import { FEATURE_LABELS } from '../lib/types'

export function SpikeAlerts({ spikes }: { spikes: Spike[] }) {
  if (spikes.length === 0) {
    return (
      <div style={{ marginBottom: '24px' }}>
        <div className="section-title">⚡ This Week's Spikes</div>
        <div className="no-data-banner">No active spikes this week.</div>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <div className="section-title">⚡ This Week's Spikes</div>
      <div className="spike-grid">
        {spikes.map((spike) => (
          <div className="spike-card" key={spike.id}>
            <div className="spike-header">
              <div className="spike-pct">+{spike.pct_increase.toFixed(0)}%</div>
              <div
                className="spike-platform-badge"
                style={{
                  background: spike.platform === 'teams' ? 'rgba(91,141,239,0.15)' : 'rgba(232,168,56,0.15)',
                  color: spike.platform === 'teams' ? 'var(--teams)' : 'var(--slack)',
                }}
              >
                {spike.platform === 'teams' ? 'Teams' : 'Slack'}
              </div>
            </div>
            <div className="spike-feature">{FEATURE_LABELS[spike.feature_tag] ?? spike.feature_tag}</div>
            <div className="spike-detail">
              {spike.current_week_count} posts this week vs {spike.four_week_avg.toFixed(1)} avg
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
