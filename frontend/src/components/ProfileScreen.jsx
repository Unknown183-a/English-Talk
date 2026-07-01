import { useState, useEffect } from 'react'
import { loadProgress } from '../utils/progress'

const achievements = [
  { id: 'first', icon: '🎯', label: 'First Session', desc: 'Completed your first practice', req: (p) => p.totalSessions >= 1 },
  { id: 'streak3', icon: '🔥', label: 'On Fire', desc: '3 day streak', req: (p) => p.streak >= 3 },
  { id: 'streak7', icon: '⚡', label: 'Week Warrior', desc: '7 day streak', req: (p) => p.streak >= 7 },
  { id: 'xp100', icon: '⭐', label: 'XP Hunter', desc: 'Earn 100 XP', req: (p) => p.xp >= 100 },
  { id: 'xp500', icon: '💎', label: 'Diamond', desc: 'Earn 500 XP', req: (p) => p.xp >= 500 },
  { id: 'sessions5', icon: '🏅', label: 'Dedicated', desc: 'Complete 5 sessions', req: (p) => p.totalSessions >= 5 },
  { id: 'sessions10', icon: '🏆', label: 'Champion', desc: 'Complete 10 sessions', req: (p) => p.totalSessions >= 10 },
  { id: 'level3', icon: '🚀', label: 'Rising Star', desc: 'Reach Level 3', req: (p) => p.level >= 3 },
]

function getLevelName(lvl) {
  if (lvl <= 2) return 'Beginner'
  if (lvl <= 5) return 'Intermediate'
  if (lvl <= 9) return 'Advanced'
  return 'Expert'
}

function getLevelColor(lvl) {
  if (lvl <= 2) return '#10b981'
  if (lvl <= 5) return '#06b6d4'
  if (lvl <= 9) return '#6c63ff'
  return '#f59e0b'
}

export default function ProfileScreen({ onBack }) {
  const [progress, setProgress] = useState(loadProgress())
  const [name, setName] = useState(() => localStorage.getItem('englishtalk_name') || 'Learner')
  const [editingName, setEditingName] = useState(false)
  const [tempName, setTempName] = useState(name)

  const xpForCurrentLevel = (progress.level - 1) * 500
  const xpInLevel = progress.xp - xpForCurrentLevel
  const xpNeeded = 500
  const levelPercent = Math.min((xpInLevel / xpNeeded) * 100, 100)
  const levelColor = getLevelColor(progress.level)

  const unlockedCount = achievements.filter(a => a.req(progress)).length

  const saveName = () => {
    const n = tempName.trim() || 'Learner'
    setName(n)
    localStorage.setItem('englishtalk_name', n)
    setEditingName(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f5f7ff',
      fontFamily: "'Nunito', sans-serif", paddingBottom: '40px'
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');`}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
        padding: '48px 20px 80px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'180px', height:'180px', borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
        <div style={{ position:'absolute', bottom:'-60px', left:'-30px', width:'200px', height:'200px', borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />

        <div style={{ maxWidth: '480px', margin: '0 auto', position: 'relative' }}>
          {/* Back button */}
          <button onClick={onBack} style={{
            width: '36px', height: '36px', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)',
            color: '#fff', cursor: 'pointer', fontSize: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '24px'
          }}>←</button>

          {/* Avatar + Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '22px',
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', flexShrink: 0
            }}>🧑‍💻</div>
            <div style={{ flex: 1 }}>
              {editingName ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    value={tempName}
                    onChange={e => setTempName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveName()}
                    autoFocus
                    style={{
                      background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
                      borderRadius: '10px', padding: '6px 12px', color: '#fff',
                      fontSize: '18px', fontWeight: '800', outline: 'none',
                      fontFamily: 'Nunito, sans-serif', width: '160px'
                    }}
                  />
                  <button onClick={saveName} style={{
                    background: '#fff', border: 'none', borderRadius: '8px',
                    padding: '6px 12px', color: '#6c63ff', fontWeight: '800',
                    cursor: 'pointer', fontSize: '13px', fontFamily: 'Nunito, sans-serif'
                  }}>Save</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: '900', margin: 0 }}>{name}</h2>
                  <button onClick={() => { setTempName(name); setEditingName(true) }} style={{
                    background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px',
                    padding: '3px 8px', color: '#fff', cursor: 'pointer', fontSize: '11px',
                    fontWeight: '700', fontFamily: 'Nunito, sans-serif'
                  }}>✏️ Edit</button>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.2)', borderRadius: '8px',
                  padding: '3px 10px', fontSize: '12px', color: '#fff', fontWeight: '700'
                }}>⭐ Level {progress.level}</div>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: '600' }}>
                  {getLevelName(progress.level)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div style={{ maxWidth: '480px', margin: '-48px auto 0', padding: '0 16px', position: 'relative', zIndex: 1 }}>

        {/* XP Progress card */}
        <div style={{
          background: '#fff', borderRadius: '20px', padding: '20px',
          marginBottom: '16px', boxShadow: '0 4px 24px rgba(108,99,255,0.12)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <p style={{ margin: 0, fontWeight: '800', fontSize: '15px', color: '#1a1a2e' }}>XP Progress</p>
            <span style={{ color: levelColor, fontWeight: '800', fontSize: '14px' }}>{progress.xp} XP total</span>
          </div>
          <div style={{ background: '#f3f4f6', borderRadius: '100px', height: '12px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{
              height: '100%', borderRadius: '100px',
              background: `linear-gradient(90deg, ${levelColor}, #a78bfa)`,
              width: `${levelPercent}%`, transition: 'width 0.8s ease'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#aaa', fontSize: '12px', fontWeight: '600' }}>Level {progress.level}</span>
            <span style={{ color: '#aaa', fontSize: '12px', fontWeight: '600' }}>{xpInLevel}/{xpNeeded} XP → Level {progress.level + 1}</span>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          {[
            { icon: '🏆', value: progress.totalSessions || 0, label: 'Total Sessions', color: '#6c63ff' },
            { icon: '🔥', value: progress.streak || 0, label: 'Day Streak', color: '#ef4444' },
            { icon: '⭐', value: progress.xp || 0, label: 'Total XP', color: '#f59e0b' },
            { icon: '🎯', value: `${unlockedCount}/${achievements.length}`, label: 'Achievements', color: '#10b981' },
          ].map((s, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: '16px', padding: '16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: `${s.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', flexShrink: 0
              }}>{s.icon}</div>
              <div>
                <div style={{ fontWeight: '900', fontSize: '20px', color: '#1a1a2e', lineHeight: 1 }}>{s.value}</div>
                <div style={{ color: '#aaa', fontSize: '11px', fontWeight: '600', marginTop: '2px' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <p style={{ fontWeight: '800', fontSize: '16px', color: '#1a1a2e', margin: '0 0 12px 4px' }}>
          Achievements {unlockedCount}/{achievements.length}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
          {achievements.map(a => {
            const unlocked = a.req(progress)
            return (
              <div key={a.id} style={{
                background: unlocked ? '#fff' : '#f9f9fb',
                borderRadius: '16px', padding: '14px',
                boxShadow: unlocked ? '0 2px 12px rgba(108,99,255,0.1)' : 'none',
                border: unlocked ? '1.5px solid rgba(108,99,255,0.15)' : '1.5px solid #f0f0f5',
                display: 'flex', alignItems: 'center', gap: '10px',
                opacity: unlocked ? 1 : 0.45
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: unlocked ? 'linear-gradient(135deg, #6c63ff, #a78bfa)' : '#e5e7eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', flexShrink: 0
                }}>{unlocked ? a.icon : '🔒'}</div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '13px', color: unlocked ? '#1a1a2e' : '#aaa' }}>{a.label}</div>
                  <div style={{ color: '#bbb', fontSize: '11px', marginTop: '1px' }}>{a.desc}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Reset button */}
        <button onClick={() => {
          if (confirm('Reset all progress? This cannot be undone.')) {
            localStorage.removeItem('englishtalk_progress')
            setProgress({ xp: 0, streak: 0, lastPracticeDate: null, todaySessions: 0, totalSessions: 0, level: 1 })
          }
        }} style={{
          width: '100%', padding: '14px', borderRadius: '16px',
          background: 'none', border: '1.5px solid #fee2e2',
          color: '#ef4444', fontWeight: '800', fontSize: '14px',
          cursor: 'pointer', fontFamily: 'Nunito, sans-serif'
        }}>🗑️ Reset Progress</button>
      </div>
    </div>
  )
}
