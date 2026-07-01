import { useState, useEffect } from 'react'

const topicLabels = {
  hr: { label: 'HR Interview', icon: '👔', color: '#6c63ff' },
  tech: { label: 'Technical', icon: '💻', color: '#06b6d4' },
  gd: { label: 'Group Discussion', icon: '🗣️', color: '#10b981' },
  intro: { label: 'Introduce Yourself', icon: '🙋', color: '#f59e0b' },
}

function formatDate(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function getGrade(s) {
  if (s >= 9) return 'A+'
  if (s >= 8) return 'A'
  if (s >= 7) return 'B+'
  if (s >= 6) return 'B'
  if (s >= 5) return 'C'
  return 'D'
}

function getScoreColor(s) {
  return s >= 8 ? '#22c55e' : s >= 6 ? '#f59e0b' : '#ef4444'
}

export default function HistoryScreen({ onBack }) {
  const [history, setHistory] = useState([])
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem('englishtalk_history') || '[]')
      setHistory(h)
    } catch {}
  }, [])

  const clearHistory = () => {
    if (confirm('Clear all history? This cannot be undone.')) {
      localStorage.removeItem('englishtalk_history')
      setHistory([])
    }
  }

  // Summary stats
  const totalSessions = history.length
  const avgOverall = totalSessions
    ? Math.round(history.reduce((a, s) => a + s.avgScore, 0) / totalSessions)
    : 0
  const bestScore = totalSessions ? Math.max(...history.map(s => s.avgScore)) : 0

  return (
    <div style={{
      minHeight: '100vh', background: '#f5f7ff',
      fontFamily: "'Nunito', sans-serif", paddingBottom: '40px'
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');`}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #6c63ff 0%, #8b5cf6 100%)',
        padding: '48px 20px 80px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'180px', height:'180px', borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
        <div style={{ position:'absolute', bottom:'-60px', left:'-30px', width:'200px', height:'200px', borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />

        <div style={{ maxWidth: '480px', margin: '0 auto', position: 'relative' }}>
          <button onClick={onBack} style={{
            width: '36px', height: '36px', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)',
            color: '#fff', cursor: 'pointer', fontSize: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '20px'
          }}>←</button>

          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '900', margin: '0 0 4px' }}>Practice History</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: 0 }}>
            {totalSessions} session{totalSessions !== 1 ? 's' : ''} completed
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '-48px auto 0', padding: '0 16px', position: 'relative', zIndex: 1 }}>

        {/* Summary stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px'
        }}>
          {[
            { icon: '📅', value: totalSessions, label: 'Sessions' },
            { icon: '⭐', value: avgOverall + '/10', label: 'Avg Score' },
            { icon: '🏆', value: bestScore + '/10', label: 'Best Score' },
          ].map((s, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: '16px', padding: '14px 10px',
              textAlign: 'center', boxShadow: '0 4px 24px rgba(108,99,255,0.10)'
            }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
              <div style={{ fontWeight: '900', fontSize: '16px', color: '#1a1a2e' }}>{s.value}</div>
              <div style={{ color: '#aaa', fontSize: '11px', fontWeight: '600' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Session list */}
        {history.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '48px 20px',
            textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <p style={{ fontWeight: '800', fontSize: '16px', color: '#1a1a2e', margin: '0 0 8px' }}>No sessions yet</p>
            <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>Complete a practice session to see your history here</p>
          </div>
        ) : (
          <>
            <p style={{ fontWeight: '800', fontSize: '15px', color: '#1a1a2e', margin: '0 0 12px 4px' }}>Recent Sessions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {history.map((session) => {
                const meta = topicLabels[session.topic] || { label: session.topic, icon: '🎯', color: '#6c63ff' }
                const isOpen = expanded === session.id
                return (
                  <div key={session.id} style={{
                    background: '#fff', borderRadius: '18px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    border: isOpen ? `1.5px solid ${meta.color}33` : '1.5px solid transparent',
                    transition: 'all 0.2s'
                  }}>
                    {/* Row */}
                    <button onClick={() => setExpanded(isOpen ? null : session.id)} style={{
                      width: '100%', background: 'none', border: 'none',
                      padding: '14px 16px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      fontFamily: 'Nunito, sans-serif', textAlign: 'left'
                    }}>
                      {/* Icon */}
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                        background: `${meta.color}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '20px'
                      }}>{meta.icon}</div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '800', fontSize: '14px', color: '#1a1a2e' }}>{meta.label}</div>
                        <div style={{ color: '#aaa', fontSize: '12px', marginTop: '2px' }}>
                          {session.questionsAnswered} Q · {formatDate(session.date)}
                        </div>
                      </div>

                      {/* Grade */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{
                          fontWeight: '900', fontSize: '20px',
                          color: getScoreColor(session.avgScore), lineHeight: 1
                        }}>{getGrade(session.avgScore)}</div>
                        <div style={{ color: '#aaa', fontSize: '11px', fontWeight: '700' }}>{session.avgScore}/10</div>
                      </div>

                      <div style={{ color: '#ccc', fontSize: '14px', marginLeft: '4px' }}>{isOpen ? '▲' : '▼'}</div>
                    </button>

                    {/* Expanded score breakdown */}
                    {isOpen && (
                      <div style={{ padding: '0 16px 16px' }}>
                        <div style={{ background: '#f8f7ff', borderRadius: '12px', padding: '12px 14px' }}>
                          <p style={{ margin: '0 0 10px', fontWeight: '800', fontSize: '12px', color: '#888' }}>SCORE BREAKDOWN</p>
                          {session.scores.map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: i < session.scores.length - 1 ? '8px' : 0 }}>
                              <span style={{ color: '#aaa', fontSize: '11px', fontWeight: '700', minWidth: '28px' }}>Q{i+1}</span>
                              <div style={{ flex: 1, background: '#e5e7eb', borderRadius: '100px', height: '7px', overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%', borderRadius: '100px',
                                  background: getScoreColor(s),
                                  width: `${s * 10}%`, transition: 'width 0.5s ease'
                                }} />
                              </div>
                              <span style={{ color: getScoreColor(s), fontWeight: '800', fontSize: '12px', minWidth: '32px', textAlign: 'right' }}>{s}/10</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                          <div style={{ background: '#f8f7ff', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                            <div style={{ fontWeight: '900', fontSize: '18px', color: getScoreColor(session.avgScore) }}>{session.avgScore}/10</div>
                            <div style={{ color: '#aaa', fontSize: '10px', fontWeight: '700' }}>AVG SCORE</div>
                          </div>
                          <div style={{ background: '#f8f7ff', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                            <div style={{ fontWeight: '900', fontSize: '18px', color: '#6c63ff' }}>{session.questionsAnswered}</div>
                            <div style={{ color: '#aaa', fontSize: '10px', fontWeight: '700' }}>QUESTIONS</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <button onClick={clearHistory} style={{
              width: '100%', padding: '13px', borderRadius: '14px',
              background: 'none', border: '1.5px solid #fee2e2',
              color: '#ef4444', fontWeight: '800', fontSize: '13px',
              cursor: 'pointer', fontFamily: 'Nunito, sans-serif'
            }}>🗑️ Clear History</button>
          </>
        )}
      </div>
    </div>
  )
}
