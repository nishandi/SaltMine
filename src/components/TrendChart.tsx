import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { TrendRow } from '../lib/useData'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '12px',
    }}>
      <div style={{ marginBottom: '6px', color: 'var(--muted2)' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color, marginBottom: '2px' }}>
          {p.name === 'teams' ? 'Teams' : 'Slack'}: {p.value} posts
        </div>
      ))}
    </div>
  )
}

export function TrendChart({ trend }: { trend: TrendRow[] }) {
  return (
    <div className="card">
      <div className="section-title">90-Day Trend — Weekly Post Volume</div>
      <div style={{ height: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="week"
              tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: 'DM Mono' }}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: 'DM Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="teams"
              stroke="var(--teams)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--teams)' }}
            />
            <Line
              type="monotone"
              dataKey="slack"
              stroke="var(--slack)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--slack)' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', fontFamily: 'DM Mono', paddingTop: '8px' }}
              formatter={(v) => v === 'teams' ? 'Teams' : 'Slack'}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
