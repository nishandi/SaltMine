import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { MOCK_KPI } from './lib/mock'
import './App.css'

export default function App() {
  const [page, setPage] = useState('dashboard')

  return (
    <div className="app-shell">
      <Sidebar page={page} onNav={setPage} kpi={MOCK_KPI} />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {page === 'dashboard' && <Dashboard />}
        {page === 'feed' && (
          <div className="main-content">
            <h2 className="syne" style={{ marginBottom: '16px' }}>Raw Feed</h2>
            <div className="no-data-banner">Raw feed coming in Phase 3.</div>
          </div>
        )}
      </main>
    </div>
  )
}
