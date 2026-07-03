import { useState, useEffect } from 'react'
import { loadProgress } from '../utils/progress'

const DAILY_GOAL = 3

export default function TopicSelector({
  onSelect, onProfile, onHistory, onProgress,
  onPronunciation, onWord, onGD, onDebate,
  onSituational, onCall, onVideo, onTranslator
}) {
  const [progress, setProgress] = useState(loadProgress())
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setProgress(loadProgress())
    setTimeout(() => setVisible(true), 50)
  }, [])

  const xpForCurrentLevel = (progress.level - 1) * 500
  const xpForNextLevel = progress.level * 500
  const xpInLevel = progress.xp - xpForCurrentLevel
  const xpNeeded = xpForNextLevel - xpForCurrentLevel
  const levelPercent = Math.min((xpInLevel / xpNeeded) * 100, 100)
  const dailyPercent = Math.min(((progress.todaySessions || 0) / DAILY_GOAL) * 100, 100)

  const getLevelName = (lvl) => {
    if (lvl <= 2) return 'Beginner'
    if (lvl <= 5) return 'Intermediate'
    if (lvl <= 9) return 'Advanced'
    return 'Expert'
  }

  const topics = [
    { id: 'intro', icon: '🙋', label: 'Introduce Yourself', desc: 'Perfect your intro', color: '#6c63ff' },
    { id: 'hr', icon: '👔', label: 'HR Interview', desc: 'Nail behavioral questions', color: '#f59e0b' },
    { id: 'tech', icon: '💻', label: 'Technical Round', desc: 'DSA & CS fundamentals', color: '#06b6d4' },
    { id: 'gd', icon: '🗣️', label: 'Group Discussion', desc: 'Topics & debate skills', color: '#10b981' },
  ]

  const tools = [
    { icon: '🎤', label: 'Pronunciation', desc: 'Fix your accent', color: '#06b6d4', action: onPronunciation },
    { icon: '📖', label: 'Word of Day', desc: 'Build vocabulary', color: '#10b981', action: onWord },
    { icon: '💬', label: 'GD Simulator', desc: '3 AI participants', color: '#f59e0b', action: onGD },
    { icon: '⚔️', label: 'Debate Mode', desc: 'Argue vs AI', color: '#dc2626', action: onDebate },
    { icon: '🧩', label: 'Situational', desc: 'Real life scenarios', color: '#7c3aed', action: onSituational },
    { icon: '🎧', label: 'AI Call', desc: 'Phone interview', color: '#8b5cf6', action: onCall },
    { icon: '🎬', label: 'Video Interview', desc: 'Webcam + AI feedback', color: '#ef4444', action: onVideo },
    { icon: '🌐', label: 'Live Translator', desc: 'Any language ↔ any language', color: '#6366f1', action: onTranslator },
    { icon: '📈', label: 'My Progress', desc: 'Charts & stats', color: '#8b5cf6', action: onProgress },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f13', fontFamily: "'Nunito', sans-serif", paddingBottom: '100px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .tap-card:active { transform: scale(0.97) !important; }
        .tap-card { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: 'linear-gradient(160deg, #1a0533 0%, #0f0f13 70%)', padding: '52px 20px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(108,99,255,0.18)', filter: 'blur(40px)' }} />
        <div style={{ maxWidth: '480px', margin: '0 auto', position: 'relative' }}>

          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0, fontWeight: '600' }}>
                {new Date().getHours() < 12 ? '🌅 Good Morning' : new Date().getHours() < 17 ? '☀️ Good Afternoon' : '🌙 Good Evening'}
              </p>
              <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: '900', margin: '4px 0 0', letterSpacing: '-0.3px' }}>Let's Practice! 🚀</h2>
            </div>
            <button onClick={onProfile} style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</button>
          </div>

          {/* Stats strip */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            {[
              { icon: '🔥', value: progress.streak || 0, label: 'Streak' },
              { icon: '⭐', value: progress.xp || 0, label: 'XP' },
              { icon: '🏆', value: progress.totalSessions || 0, label: 'Sessions' },
              { icon: '📊', value: `L${progress.level || 1}`, label: getLevelName(progress.level || 1) },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '14px', padding: '10px 6px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '16px', marginBottom: '2px' }}>{s.icon}</div>
                <div style={{ fontWeight: '900', fontSize: '14px', color: '#fff', lineHeight: 1 }}>{s.value}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', fontWeight: '700', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* XP bar */}
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: '700' }}>⭐ Level {progress.level || 1} · {getLevelName(progress.level || 1)}</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '600' }}>{xpInLevel}/{xpNeeded} XP</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '100px', height: '6px', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '100px', background: 'linear-gradient(90deg, #6c63ff, #a78bfa)', width: `${levelPercent}%`, transition: 'width 0.8s ease' }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 16px' }}>

        {/* Daily Goal */}
        <div style={{ background: '#1a1a2e', borderRadius: '18px', padding: '16px 18px', margin: '20px 0', border: '1px solid #2a2a3e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ margin: 0, fontWeight: '800', fontSize: '14px', color: '#fff' }}>🎯 Daily Goal</p>
            {(progress.todaySessions || 0) >= DAILY_GOAL
              ? <div style={{ background: '#052e16', color: '#22c55e', borderRadius: '100px', padding: '3px 10px', fontSize: '11px', fontWeight: '800' }}>✅ Complete!</div>
              : <div style={{ background: '#2e1065', color: '#a78bfa', borderRadius: '100px', padding: '3px 10px', fontSize: '11px', fontWeight: '800' }}>{DAILY_GOAL - (progress.todaySessions || 0)} left</div>
            }
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '100px', height: '8px', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '100px', background: 'linear-gradient(90deg, #6c63ff, #a78bfa)', width: `${dailyPercent}%`, transition: 'width 0.8s ease' }} />
          </div>
          <p style={{ margin: '7px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '600' }}>{progress.todaySessions || 0}/{DAILY_GOAL} sessions today</p>
        </div>

        {/* Practice Modes */}
        <p style={{ fontWeight: '900', fontSize: '16px', color: '#fff', margin: '0 0 12px 2px' }}>Practice Modes</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          {topics.map((t, i) => (
            <button key={t.id} className="tap-card" onClick={() => onSelect(t.id)} style={{
              background: '#1a1a2e', border: `1px solid ${t.color}33`,
              borderRadius: '20px', padding: '18px 16px',
              textAlign: 'left', color: '#fff', cursor: 'pointer',
              position: 'relative', overflow: 'hidden',
              animation: visible ? `slideUp ${0.2 + i * 0.07}s ease both` : 'none'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: t.color, borderRadius: '20px 20px 0 0' }} />
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: `${t.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '12px' }}>{t.icon}</div>
              <div style={{ fontWeight: '800', fontSize: '13px', color: '#fff', marginBottom: '4px' }}>{t.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', lineHeight: '1.4', marginBottom: '12px' }}>{t.desc}</div>
              <div style={{ color: t.color, fontSize: '11px', fontWeight: '800' }}>Start →</div>
            </button>
          ))}
        </div>

        {/* Tools Section */}
        <p style={{ fontWeight: '900', fontSize: '16px', color: '#fff', margin: '0 0 12px 2px' }}>Tools & Features</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          {tools.map((t, i) => (
            <button key={i} className="tap-card" onClick={t.action} style={{
              background: '#1a1a2e', border: `1px solid ${t.color}33`,
              borderRadius: '20px', padding: '18px 16px',
              textAlign: 'left', color: '#fff', cursor: 'pointer',
              animation: visible ? `slideUp ${0.35 + i * 0.05}s ease both` : 'none'
            }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: `${t.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '12px' }}>{t.icon}</div>
              <div style={{ fontWeight: '800', fontSize: '13px', color: '#fff', marginBottom: '3px' }}>{t.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(15,15,19,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid #1e1e2e', padding: '10px 0 env(safe-area-inset-bottom)', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        {[
          { icon: '🏠', label: 'Home', action: null, active: true },
          { icon: '📜', label: 'History', action: onHistory },
          { icon: '📈', label: 'Progress', action: onProgress },
          { icon: '👤', label: 'Profile', action: onProfile },
        ].map((item, i) => (
          <button key={i} onClick={item.action || undefined} style={{ background: 'none', border: 'none', cursor: item.action ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '4px 16px', fontFamily: 'Nunito, sans-serif' }}>
            <span style={{ fontSize: '22px' }}>{item.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: '800', color: item.active ? '#6c63ff' : 'rgba(255,255,255,0.4)' }}>{item.label}</span>
            {item.active && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#6c63ff' }} />}
          </button>
        ))}
      </div>
    </div>
  )
}
