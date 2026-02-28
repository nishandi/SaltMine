import type { KpiData } from '../lib/types'

interface Props {
  page: string
  onNav: (p: string) => void
  kpi: KpiData
}

export function Sidebar({ page, onNav, kpi }: Props) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">Salt<span>Mine</span></div>
      <nav className="sidebar-nav">
        <button className={`nav-item ${page === 'dashboard' ? 'active' : ''}`} onClick={() => onNav('dashboard')}>
          <span>◈</span> Dashboard
        </button>
        <button className={`nav-item ${page === 'feed' ? 'active' : ''}`} onClick={() => onNav('feed')}>
          <span>≡</span> Raw Feed
        </button>
      </nav>
      <div className="sidebar-status">
        <div><span className="status-dot" />Pipeline active</div>
        <div style={{ marginTop: '4px' }}>Last run: {kpi.lastRun}</div>
        <div style={{ marginTop: '4px', color: 'var(--muted)' }}>
          {kpi.windowStart} → {kpi.windowEnd}
        </div>
      </div>
    </div>
  )
}
