import type { Post } from '../lib/types'
import { FEATURE_LABELS } from '../lib/types'

function sentimentColor(v: number) {
  if (v >= 0.1) return 'var(--positive)'
  if (v <= -0.1) return 'var(--negative)'
  return 'var(--muted2)'
}

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000 / 3600
  if (d < 1) return 'just now'
  if (d < 24) return `${Math.floor(d)}h ago`
  return `${Math.floor(d / 24)}d ago`
}

export function TopPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <div className="card">
        <div className="section-title">Top Posts — Last 7 Days</div>
        <div className="no-data-banner">No posts yet.</div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="section-title">Top Posts — Last 7 Days</div>
      <div className="post-list">
        {posts.map((p) => (
          <a href={p.url} target="_blank" rel="noopener noreferrer" key={p.id}>
            <div className="post-item">
              <div className="post-meta">
                <span
                  className="post-badge"
                  style={{
                    background: p.platform === 'teams' ? 'rgba(91,141,239,0.15)' : 'rgba(232,168,56,0.15)',
                    color: p.platform === 'teams' ? 'var(--teams)' : 'var(--slack)',
                  }}
                >
                  {p.platform === 'teams' ? 'Teams' : 'Slack'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>r/{p.source_subreddit}</span>
                <span
                  className="sentiment-dot"
                  style={{ background: sentimentColor(p.sentiment_score) }}
                />
                {p.feature_tags.slice(0, 1).map(t => (
                  <span key={t} style={{ fontSize: '10px', color: 'var(--muted)', background: 'var(--surface)', padding: '1px 5px', borderRadius: '3px', border: '1px solid var(--border)' }}>
                    {FEATURE_LABELS[t] ?? t}
                  </span>
                ))}
              </div>
              <div className="post-title">{p.title}</div>
              <div className="post-footer">
                <span>▲ {p.upvotes}</span>
                <span>{timeAgo(p.created_utc)}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
