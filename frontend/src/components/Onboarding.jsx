import { useState } from 'react'

const goals = [
  { id: 'placement', icon: '🏢', label: 'Campus Placement', desc: 'Crack TCS, Infosys, Wipro interviews' },
  { id: 'internship', icon: '💼', label: 'Internship', desc: 'Land your dream internship' },
  { id: 'fluency', icon: '🗣️', label: 'Daily Fluency', desc: 'Speak English confidently' },
  { id: 'abroad', icon: '✈️', label: 'Study Abroad', desc: 'IELTS / TOEFL preparation' },
]

const levels = [
  { id: 'beginner', icon: '🌱', label: 'Beginner', desc: 'I struggle to speak in English' },
  { id: 'intermediate', icon: '📈', label: 'Intermediate', desc: 'I can speak but make mistakes' },
  { id: 'advanced', icon: '🚀', label: 'Advanced', desc: 'I want to polish my skills' },
]

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [goal, setGoal] = useState(null)
  const [level, setLevel] = useState(null)

  const saveAndFinish = () => {
    localStorage.setItem('englishtalk_name', name.trim() || 'Learner')
    localStorage.setItem('englishtalk_goal', goal)
    localStorage.setItem('englishtalk_level', level)
    localStorage.setItem('englishtalk_onboarded', 'true')
    onDone()
  }

  const totalSteps = 5
  const progress = (step / (totalSteps - 1)) * 100

  return (
    <div style={{
      minHeight: '100vh', background: '#f5f7ff',
      fontFamily: "'Nunito', sans-serif",
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 20px'
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');`}</style>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: '360px', marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{
              background: 'none', border: 'none', color: '#aaa',
              cursor: 'pointer', fontSize: '13px', fontWeight: '700',
              fontFamily: 'Nunito, sans-serif', padding: 0
            }}>← Back</button>
          )}
          <span style={{ color: '#aaa', fontSize: '12px', fontWeight: '700', marginLeft: 'auto' }}>
            {step + 1} of {totalSteps}
          </span>
        </div>
        <div style={{ background: '#e5e7eb', borderRadius: '100px', height: '6px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '100px',
            background: 'linear-gradient(90deg, #6c63ff, #a78bfa)',
            width: `${progress}%`, transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* Step content */}
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ position: 'relative', marginBottom: '32px' }}>
              <div style={{
                position: 'absolute', inset: '-12px', borderRadius: '32px',
                background: 'linear-gradient(135deg, #6c63ff, #06b6d4)',
                opacity: 0.25, filter: 'blur(16px)'
              }} />
              <div style={{
                width: '88px', height: '88px', borderRadius: '26px',
                background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '40px', position: 'relative',
                boxShadow: '0 8px 32px rgba(108,99,255,0.35)'
              }}>🎯</div>
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1a1a2e', margin: '0 0 12px', letterSpacing: '-1px' }}>
              Welcome to<br />English Talk
            </h1>
            <p style={{ color: '#888', fontSize: '15px', lineHeight: '1.6', maxWidth: '280px', margin: '0 0 32px' }}>
              Your AI-powered English coach for campus placements and beyond
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginBottom: '32px' }}>
              {[
                { icon: '🎤', text: 'Practice speaking with AI interviews' },
                { icon: '📊', text: 'Get grammar & vocabulary feedback' },
                { icon: '🔥', text: 'Build streaks and earn XP' },
                { icon: '🏆', text: 'Unlock achievements as you grow' },
              ].map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: '#fff', borderRadius: '14px', padding: '12px 16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <span style={{ fontSize: '20px' }}>{f.icon}</span>
                  <span style={{ color: '#444', fontSize: '14px', fontWeight: '600' }}>{f.text}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(1)} style={{
              width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
              background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
              color: '#fff', fontWeight: '900', fontSize: '16px',
              cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
              boxShadow: '0 4px 20px rgba(108,99,255,0.35)'
            }}>Get Started →</button>
          </div>
        )}

        {/* Step 1 — Name */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>👋</div>
            <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#1a1a2e', margin: '0 0 8px' }}>What's your name?</h2>
            <p style={{ color: '#888', fontSize: '14px', margin: '0 0 32px' }}>We'll personalise your experience</p>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(2)}
              placeholder="Enter your name..."
              autoFocus
              style={{
                width: '100%', padding: '16px 20px', borderRadius: '16px',
                border: '2px solid #e5e7eb', fontSize: '18px', fontWeight: '700',
                color: '#1a1a2e', outline: 'none', fontFamily: 'Nunito, sans-serif',
                marginBottom: '16px', boxSizing: 'border-box', textAlign: 'center'
              }}
              onFocus={e => e.target.style.border = '2px solid #6c63ff'}
              onBlur={e => e.target.style.border = '2px solid #e5e7eb'}
            />
            <button onClick={() => setStep(2)} disabled={!name.trim()} style={{
              width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
              background: name.trim() ? 'linear-gradient(135deg, #6c63ff, #8b5cf6)' : '#e5e7eb',
              color: name.trim() ? '#fff' : '#aaa', fontWeight: '900', fontSize: '16px',
              cursor: name.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Nunito, sans-serif',
              transition: 'all 0.2s'
            }}>Continue →</button>
          </div>
        )}

        {/* Step 2 — Goal */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px', textAlign: 'center' }}>🎯</div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1a1a2e', margin: '0 0 6px', textAlign: 'center' }}>What's your goal?</h2>
            <p style={{ color: '#888', fontSize: '14px', margin: '0 0 24px', textAlign: 'center' }}>We'll focus your practice sessions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginBottom: '20px' }}>
              {goals.map(g => (
                <button key={g.id} onClick={() => setGoal(g.id)} style={{
                  background: goal === g.id ? '#ede9fe' : '#fff',
                  border: goal === g.id ? '2px solid #6c63ff' : '2px solid #f0f0f5',
                  borderRadius: '16px', padding: '14px 16px', cursor: 'pointer',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '14px',
                  transition: 'all 0.15s', fontFamily: 'Nunito, sans-serif',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  <span style={{ fontSize: '26px' }}>{g.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '800', fontSize: '14px', color: '#1a1a2e' }}>{g.label}</div>
                    <div style={{ color: '#888', fontSize: '12px', marginTop: '2px' }}>{g.desc}</div>
                  </div>
                  {goal === g.id && <span style={{ color: '#6c63ff', fontSize: '18px' }}>✓</span>}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(3)} disabled={!goal} style={{
              width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
              background: goal ? 'linear-gradient(135deg, #6c63ff, #8b5cf6)' : '#e5e7eb',
              color: goal ? '#fff' : '#aaa', fontWeight: '900', fontSize: '16px',
              cursor: goal ? 'pointer' : 'not-allowed', fontFamily: 'Nunito, sans-serif',
              transition: 'all 0.2s'
            }}>Continue →</button>
          </div>
        )}

        {/* Step 3 — Level */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px', textAlign: 'center' }}>📊</div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1a1a2e', margin: '0 0 6px', textAlign: 'center' }}>Your current level?</h2>
            <p style={{ color: '#888', fontSize: '14px', margin: '0 0 24px', textAlign: 'center' }}>Be honest — it helps us help you better</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginBottom: '20px' }}>
              {levels.map(l => (
                <button key={l.id} onClick={() => setLevel(l.id)} style={{
                  background: level === l.id ? '#ede9fe' : '#fff',
                  border: level === l.id ? '2px solid #6c63ff' : '2px solid #f0f0f5',
                  borderRadius: '16px', padding: '16px 18px', cursor: 'pointer',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '14px',
                  transition: 'all 0.15s', fontFamily: 'Nunito, sans-serif',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  <span style={{ fontSize: '28px' }}>{l.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '800', fontSize: '15px', color: '#1a1a2e' }}>{l.label}</div>
                    <div style={{ color: '#888', fontSize: '12px', marginTop: '2px' }}>{l.desc}</div>
                  </div>
                  {level === l.id && <span style={{ color: '#6c63ff', fontSize: '18px' }}>✓</span>}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(4)} disabled={!level} style={{
              width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
              background: level ? 'linear-gradient(135deg, #6c63ff, #8b5cf6)' : '#e5e7eb',
              color: level ? '#fff' : '#aaa', fontWeight: '900', fontSize: '16px',
              cursor: level ? 'pointer' : 'not-allowed', fontFamily: 'Nunito, sans-serif',
              transition: 'all 0.2s'
            }}>Continue →</button>
          </div>
        )}

        {/* Step 4 — All set */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '72px', marginBottom: '24px' }}>🎉</div>
            <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#1a1a2e', margin: '0 0 10px' }}>
              You're all set, {name || 'Learner'}!
            </h2>
            <p style={{ color: '#888', fontSize: '15px', lineHeight: '1.6', maxWidth: '280px', margin: '0 0 32px' }}>
              Your personalised English coach is ready. Let's start your first session!
            </p>
            <div style={{
              background: '#fff', borderRadius: '20px', padding: '20px',
              width: '100%', marginBottom: '28px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>
              {[
                { label: 'Name', value: name || 'Learner' },
                { label: 'Goal', value: goals.find(g => g.id === goal)?.label || '-' },
                { label: 'Level', value: levels.find(l => l.id === level)?.label || '-' },
              ].map((r, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '10px 0',
                  borderBottom: i < 2 ? '1px solid #f0f0f5' : 'none'
                }}>
                  <span style={{ color: '#aaa', fontSize: '13px', fontWeight: '700' }}>{r.label}</span>
                  <span style={{ color: '#1a1a2e', fontSize: '13px', fontWeight: '800' }}>{r.value}</span>
                </div>
              ))}
            </div>
            <button onClick={saveAndFinish} style={{
              width: '100%', padding: '18px', borderRadius: '16px', border: 'none',
              background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
              color: '#fff', fontWeight: '900', fontSize: '17px',
              cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
              boxShadow: '0 4px 24px rgba(108,99,255,0.4)'
            }}>🚀 Start Practicing!</button>
          </div>
        )}
      </div>
    </div>
  )
}
