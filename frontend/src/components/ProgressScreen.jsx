import { useState, useEffect } from 'react'
function loadProgress() {
  try {
    const data = localStorage.getItem('englishtalk_progress')
    if (data) return JSON.parse(data)
  } catch {}
  return { xp: 0, streak: 0, lastPracticeDate: null, todaySessions: 0, totalSessions: 0, level: 1 }
}

function getToday() {
  return new Date().toISOString().split('T')[0]
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

function getLast30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().split('T')[0]
  })
}

function getDayLabel(dateStr) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[new Date(dateStr).getDay()]
}

function getScoreColor(s) {
  return s >= 8 ? '#22c55e' : s >= 6 ? '#f59e0b' : '#ef4444'
}

function getLevelName(lvl) {
  if (lvl <= 2) return 'Beginner'
  if (lvl <= 5) return 'Intermediate'
  if (lvl <= 9) return 'Advanced'
  return 'Expert'
}

export default function ProgressScreen({ onBack }) {
  const [progress, setProgress] = useState(loadProgress())
  const [xpHistory, setXpHistory] = useState({})
  const [sessionHistory, setSessionHistory] = useState([])

  useEffect(() => {
    setProgress(loadProgress())
    try {
      const xh = JSON.parse(localStorage.getItem('englishtalk_xp_history') || '{}')
      setXpHistory(xh)
    } catch {}
    try {
      const sh = JSON.parse(localStorage.getItem('englishtalk_history') || '[]')
      setSessionHistory(sh)
    } catch {}
  }, [])

  const last7 = getLast7Days()
  const last30 = getLast30Days()
  const maxXP = Math.max(...last7.map(d => xpHistory[d] || 0), 10)

  // Score trend — last 10 sessions
  const last10 = sessionHistory.slice(0, 10).reverse()
  const maxScore = 10

  // Streak calendar
  const today = getToday()

  // Stats
  const totalXP = progress.xp || 0
  const bestDay = Object.entries(xpHistory).sort((a, b) => b[1] - a[1])[0]
  const avgSessionScore = sessionHistory.length
    ? Math.round(sessionHistory.reduce((a, s) => a + s.avgScore, 0) / sessionHistory.length)
    : 0
  const activeDays = Object.keys(xpHistory).length

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
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px'
          }}>←</button>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '900', margin: '0 0 4px' }}>📈 Progress</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: 0 }}>
            Level {progress.level} · {getLevelName(progress.level)} · {totalXP} XP total
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '-48px auto 0', padding: '0 16px', position: 'relative', zIndex: 1 }}>

        {/* Top stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            { icon: '⭐', value: totalXP, label: 'Total XP', color: '#6c63ff' },
            { icon: '📅', value: activeDays, label: 'Active Days', color: '#10b981' },
            { icon: '🎯', value: avgSessionScore + '/10', label: 'Avg Score', color: '#f59e0b' },
            { icon: '🔥', value: progress.streak || 0, label: 'Day Streak', color: '#ef4444' },
          ].map((s, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: '16px', padding: '14px 16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: `${s.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
              }}>{s.icon}</div>
              <div>
                <div style={{ fontWeight: '900', fontSize: '20px', color: '#1a1a2e', lineHeight: 1 }}>{s.value}</div>
                <div style={{ color: '#aaa', fontSize: '11px', fontWeight: '600', marginTop: '2px' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* XP Bar Chart — last 7 days */}
        <div style={{
          background: '#fff', borderRadius: '20px', padding: '20px',
          marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ margin: 0, fontWeight: '800', fontSize: '15px', color: '#1a1a2e' }}>XP This Week</p>
            <span style={{ color: '#aaa', fontSize: '12px', fontWeight: '600' }}>Last 7 days</span>
          </div>

          {Object.keys(xpHistory).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#ccc' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
              <p style={{ fontSize: '13px', margin: 0 }}>Complete sessions to see your XP chart</p>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px' }}>
              {last7.map((date, i) => {
                const xp = xpHistory[date] || 0
                const barH = maxXP > 0 ? Math.max((xp / maxXP) * 100, xp > 0 ? 8 : 0) : 0
                const isToday = date === today
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                    {xp > 0 && (
                      <span style={{ fontSize: '9px', fontWeight: '800', color: '#6c63ff' }}>{xp}</span>
                    )}
                    <div style={{
                      width: '100%', borderRadius: '6px 6px 0 0',
                      background: xp > 0
                        ? isToday
                          ? 'linear-gradient(180deg, #a78bfa, #6c63ff)'
                          : 'linear-gradient(180deg, #c4b5fd, #8b5cf6)'
                        : '#f3f4f6',
                      height: `${barH}%`,
                      minHeight: xp > 0 ? '8px' : '4px',
                      transition: 'height 0.6s ease'
                    }} />
                    <span style={{
                      fontSize: '10px', fontWeight: isToday ? '900' : '600',
                      color: isToday ? '#6c63ff' : '#aaa'
                    }}>{getDayLabel(date)}</span>
                  </div>
                )
              })}
            </div>
          )}

          {bestDay && (
            <div style={{
              marginTop: '14px', background: '#f8f7ff', borderRadius: '10px',
              padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span style={{ fontSize: '14px' }}>🏆</span>
              <span style={{ color: '#6c63ff', fontSize: '12px', fontWeight: '700' }}>
                Best day: {new Date(bestDay[0]).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} — {bestDay[1]} XP
              </span>
            </div>
          )}
        </div>

        {/* Score Trend — last 10 sessions */}
        <div style={{
          background: '#fff', borderRadius: '20px', padding: '20px',
          marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ margin: 0, fontWeight: '800', fontSize: '15px', color: '#1a1a2e' }}>Score Trend</p>
            <span style={{ color: '#aaa', fontSize: '12px', fontWeight: '600' }}>Last {last10.length} sessions</span>
          </div>

          {last10.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#ccc' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📈</div>
              <p style={{ fontSize: '13px', margin: 0 }}>Complete sessions to see your score trend</p>
            </div>
          ) : (
            <>
              {/* SVG line chart */}
              <div style={{ position: 'relative', height: '100px', marginBottom: '8px' }}>
                <svg width="100%" height="100" viewBox={`0 0 ${Math.max(last10.length * 40, 280)} 100`} preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[2, 4, 6, 8, 10].map(v => (
                    <line key={v}
                      x1="0" y1={100 - (v / maxScore) * 90}
                      x2="100%" y2={100 - (v / maxScore) * 90}
                      stroke="#f3f4f6" strokeWidth="1"
                    />
                  ))}
                  {/* Area fill */}
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6c63ff" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#6c63ff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polyline
                    points={last10.map((s, i) => {
                      const x = (last10.length > 1 ? (i / (last10.length - 1)) * 100 : 50)
                      const y = 100 - (s.avgScore / maxScore) * 90
                      return `${x}%,${y}`
                    }).join(' ')}
                    fill="none" stroke="#6c63ff" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                  />
                  {/* Dots */}
                  {last10.map((s, i) => {
                    const pct = (last10.length > 1 ? (i / (last10.length - 1)) * 100 : 50)
                    const y = 100 - (s.avgScore / maxScore) * 90
                    return (
                      <circle key={i}
                        cx={`${pct}%`} cy={y} r="4"
                        fill={getScoreColor(s.avgScore)}
                        stroke="#fff" strokeWidth="2"
                      />
                    )
                  })}
                </svg>
              </div>

              {/* Score labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {last10.map((s, i) => (
                  <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontWeight: '800', fontSize: '11px', color: getScoreColor(s.avgScore) }}>{s.avgScore}</div>
                    <div style={{ color: '#ddd', fontSize: '9px' }}>S{i + 1}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Streak Calendar — last 30 days */}
        <div style={{
          background: '#fff', borderRadius: '20px', padding: '20px',
          marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <p style={{ margin: 0, fontWeight: '800', fontSize: '15px', color: '#1a1a2e' }}>Activity Calendar</p>
            <span style={{ color: '#aaa', fontSize: '12px', fontWeight: '600' }}>Last 30 days</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '5px' }}>
            {last30.map((date, i) => {
              const xp = xpHistory[date] || 0
              const isToday = date === today
              const intensity = xp === 0 ? 0 : xp < 30 ? 1 : xp < 60 ? 2 : xp < 100 ? 3 : 4
              const colors = ['#f3f4f6', '#ddd6fe', '#a78bfa', '#7c3aed', '#4c1d95']
              return (
                <div key={i} title={`${date}: ${xp} XP`} style={{
                  aspectRatio: '1', borderRadius: '4px',
                  background: colors[intensity],
                  border: isToday ? '2px solid #6c63ff' : '2px solid transparent',
                  transition: 'all 0.2s'
                }} />
              )
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', justifyContent: 'flex-end' }}>
            <span style={{ color: '#aaa', fontSize: '10px', fontWeight: '600' }}>Less</span>
            {['#f3f4f6', '#ddd6fe', '#a78bfa', '#7c3aed', '#4c1d95'].map((c, i) => (
              <div key={i} style={{ width: '12px', height: '12px', borderRadius: '3px', background: c }} />
            ))}
            <span style={{ color: '#aaa', fontSize: '10px', fontWeight: '600' }}>More</span>
          </div>
        </div>

        {/* Level progress */}
        <div style={{
          background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
          borderRadius: '20px', padding: '20px',
          boxShadow: '0 4px 20px rgba(108,99,255,0.25)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <p style={{ margin: 0, color: '#fff', fontWeight: '900', fontSize: '15px' }}>⭐ Level {progress.level}</p>
              <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{getLevelName(progress.level)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, color: '#fff', fontWeight: '900', fontSize: '15px' }}>{progress.xp} XP</p>
              <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{progress.level * 500 - progress.xp} to next level</p>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '100px', height: '10px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '100px',
              background: '#fff',
              width: `${Math.min(((progress.xp - (progress.level - 1) * 500) / 500) * 100, 100)}%`,
              transition: 'width 0.8s ease'
            }} />
          </div>
        </div>

      </div>
    </div>
  )
}
