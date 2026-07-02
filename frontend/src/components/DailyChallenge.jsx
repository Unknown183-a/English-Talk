import useMic from '../hooks/useMic'
import { useState, useEffect, useRef } from 'react'
import { useChat } from '../hooks/useChat'
import MessageBubble from './MessageBubble'
function saveSessionToHistory({ topic, scores, avgScore }) {
  try {
    const existing = JSON.parse(localStorage.getItem('englishtalk_history') || '[]')
    const session = { id: Date.now(), date: new Date().toISOString(), topic, scores, avgScore, questionsAnswered: scores.length }
    existing.unshift(session)
    if (existing.length > 50) existing.pop()
    localStorage.setItem('englishtalk_history', JSON.stringify(existing))
  } catch {}
}

const CHALLENGE_TIME = 180 // 3 minutes in seconds
const BONUS_XP_MULTIPLIER = 2

const challenges = [
  { topic: 'hr', title: 'Tell Your Story', desc: 'Introduce yourself like a pro', icon: '👔', color: '#6c63ff' },
  { topic: 'tech', title: 'Tech Explainer', desc: 'Explain a CS concept clearly', icon: '💻', color: '#06b6d4' },
  { topic: 'gd', title: 'Hot Topic Debate', desc: 'Share your views confidently', icon: '🗣️', color: '#10b981' },
  { topic: 'intro', title: 'Perfect Intro', desc: 'Nail your self-introduction', icon: '🙋', color: '#f59e0b' },
  { topic: 'hr', title: 'Strength & Weakness', desc: 'Answer the classic HR question', icon: '💪', color: '#ef4444' },
  { topic: 'tech', title: 'Problem Solving', desc: 'Walk through your approach', icon: '🧩', color: '#8b5cf6' },
  { topic: 'gd', title: 'Leadership Talk', desc: 'Discuss leadership styles', icon: '🚀', color: '#f59e0b' },
]

function getToday() {
  return new Date().toISOString().split('T')[0]
}

function getTodayChallenge() {
  // Pick a deterministic challenge based on day of year
  const start = new Date(new Date().getFullYear(), 0, 0)
  const diff = new Date() - start
  const dayOfYear = Math.floor(diff / 86400000)
  return challenges[dayOfYear % challenges.length]
}

export function isChallengeCompletedToday() {
  try {
    const data = JSON.parse(localStorage.getItem('englishtalk_challenge') || '{}')
    return data.date === getToday() && data.completed
  } catch { return false }
}

export function saveChallengeComplete(avgScore) {
  localStorage.setItem('englishtalk_challenge', JSON.stringify({
    date: getToday(),
    completed: true,
    avgScore
  }))
}

function Timer({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds)
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setLeft(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); onExpire(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const mins = Math.floor(left / 60)
  const secs = left % 60
  const pct = (left / seconds) * 100
  const color = left > 60 ? '#22c55e' : left > 30 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: '40px', height: '40px' }}>
        <svg width="40" height="40" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="20" cy="20" r="16" fill="none" stroke="#2a2a3e" strokeWidth="3" />
          <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 16}`}
            strokeDashoffset={`${2 * Math.PI * 16 * (1 - pct / 100)}`}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: '9px', fontWeight: '900', color
        }}>{mins}:{secs.toString().padStart(2, '0')}</div>
      </div>
    </div>
  )
}

export default function DailyChallenge({ onBack, onComplete }) {
  const challenge = getTodayChallenge()
  const { messages, loading, sendUserMessage } = useChat(challenge.topic)
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [sessionScores, setSessionScores] = useState([])
  const [showSummary, setShowSummary] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  const [waveBars, setWaveBars] = useState(Array.from({ length: 20 }, () => 4))
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)
  const audioRef = useRef(null)
  const waveIntervalRef = useRef(null)

  useEffect(() => {
    sendUserMessage('Start the interview. Ask me the first question.')
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const scores = messages
      .filter(m => m.role === 'assistant' && m.score != null)
      .map(m => m.score)
    setSessionScores(scores)
  }, [messages])

  useEffect(() => {
    if (speaking) {
      waveIntervalRef.current = setInterval(() => {
        setWaveBars(Array.from({ length: 20 }, () => Math.floor(4 + Math.random() * 28)))
      }, 120)
    } else {
      clearInterval(waveIntervalRef.current)
      setWaveBars(Array.from({ length: 20 }, () => 4))
    }
    return () => clearInterval(waveIntervalRef.current)
  }, [speaking])

  const handleTimeUp = () => {
    setTimeUp(true)
    setTimeout(() => setShowSummary(true), 1500)
  }

  const avgScore = sessionScores.length
    ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length)
    : 0

  const handleFinish = () => {
    if (sessionScores.length > 0) {
      saveSessionToHistory({ topic: challenge.topic, scores: sessionScores, avgScore, isChallenge: true })
      saveChallengeComplete(avgScore)
      setShowSummary(true)
    } else {
      onBack()
    }
  }


  const speakText = (text) => {
    window.speechSynthesis.cancel()
    setSpeaking(true)
    waveIntervalRef.current = setInterval(() => {
      setWaveBars(Array.from({ length: 20 }, () => Math.floor(4 + Math.random() * 28)))
    }, 120)
    const u = new window.SpeechSynthesisUtterance(text)
    u.lang = 'en-IN'
    u.rate = 0.92
    u.pitch = 1.0
    // pick best available English voice
    const voices = window.speechSynthesis.getVoices()
    const best = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'))
      || voices.find(v => v.lang.startsWith('en'))
    if (best) u.voice = best
    u.onend = () => {
      setSpeaking(false)
      clearInterval(waveIntervalRef.current)
      setWaveBars(Array.from({ length: 20 }, () => 4))
    }
    u.onerror = () => {
      setSpeaking(false)
      clearInterval(waveIntervalRef.current)
    }
    window.speechSynthesis.speak(u)
  }

  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
    clearInterval(waveIntervalRef.current)
    setWaveBars(Array.from({ length: 20 }, () => 4))
  }


  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Use Chrome for voice input.'); return }
    const r = new SR()
    // mic handled by useMic hook
    r.onerror = () => setListening(false)
    r.start()
  }

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false) }

  const handleSend = () => {
    if (!input.trim() || loading) return
    sendUserMessage(input)
    setInput('')
    inputRef.current?.focus()
  }

  const visibleMessages = messages.filter(m =>
    !(m.role === 'user' && m.content === 'Start the interview. Ask me the first question.')
  )

  const xpEarned = avgScore * 10 * BONUS_XP_MULTIPLIER
  const getGrade = (s) => s >= 9 ? 'A+' : s >= 8 ? 'A' : s >= 7 ? 'B+' : s >= 6 ? 'B' : s >= 5 ? 'C' : 'D'
  const getColor = (s) => s >= 8 ? '#22c55e' : s >= 6 ? '#f59e0b' : '#ef4444'

  // Summary screen
  if (showSummary) {
    return (
      <div style={{
        minHeight: '100vh', background: '#f5f7ff',
        fontFamily: "'Nunito', sans-serif",
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '40px 20px'
      }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');`}</style>

        {/* Challenge badge */}
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
          borderRadius: '20px', padding: '10px 20px',
          marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <span style={{ fontSize: '18px' }}>🎯</span>
          <span style={{ color: '#fff', fontWeight: '900', fontSize: '14px' }}>DAILY CHALLENGE COMPLETE!</span>
        </div>

        <div style={{
          width: '90px', height: '90px', borderRadius: '28px',
          background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '44px', marginBottom: '16px',
          boxShadow: '0 8px 32px rgba(245,158,11,0.35)'
        }}>🏆</div>

        <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#1a1a2e', margin: '0 0 6px' }}>
          {timeUp ? "Time's Up!" : 'Challenge Complete!'}
        </h2>
        <p style={{ color: '#888', fontSize: '14px', margin: '0 0 24px' }}>
          {sessionScores.length} question{sessionScores.length !== 1 ? 's' : ''} answered
        </p>

        {/* Grade circle */}
        <div style={{
          width: '130px', height: '130px', borderRadius: '50%',
          background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          marginBottom: '24px', border: `4px solid ${getColor(avgScore)}`
        }}>
          <div style={{ fontSize: '36px', fontWeight: '900', color: getColor(avgScore), lineHeight: 1 }}>{getGrade(avgScore)}</div>
          <div style={{ fontSize: '13px', color: '#aaa', fontWeight: '600' }}>{avgScore}/10 avg</div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', width: '100%', maxWidth: '400px', marginBottom: '20px' }}>
          {[
            { icon: '⭐', value: `+${xpEarned}`, label: 'Bonus XP (2x!)' },
            { icon: '🎯', value: avgScore + '/10', label: 'Avg Score' },
            { icon: '💬', value: sessionScores.length, label: 'Answers' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '16px', padding: '16px 8px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '22px', marginBottom: '4px' }}>{s.icon}</div>
              <div style={{ fontWeight: '900', fontSize: '18px', color: i === 0 ? '#f59e0b' : '#1a1a2e' }}>{s.value}</div>
              <div style={{ color: '#aaa', fontSize: '11px', fontWeight: '600' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* 2x XP banner */}
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b22, #fbbf2422)',
          border: '1.5px solid #f59e0b44',
          borderRadius: '16px', padding: '14px 20px',
          width: '100%', maxWidth: '400px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <span style={{ fontSize: '28px' }}>🌟</span>
          <div>
            <div style={{ fontWeight: '900', fontSize: '14px', color: '#92400e' }}>2x Bonus XP Earned!</div>
            <div style={{ color: '#b45309', fontSize: '12px', marginTop: '2px' }}>
              Daily challenge gives double XP. Come back tomorrow for a new one!
            </div>
          </div>
        </div>

        <button onClick={() => onComplete(avgScore * BONUS_XP_MULTIPLIER)} style={{
          width: '100%', maxWidth: '400px', padding: '16px', borderRadius: '16px',
          background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
          border: 'none', color: '#fff', fontWeight: '900', fontSize: '16px',
          cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
          boxShadow: '0 4px 20px rgba(245,158,11,0.35)'
        }}>🏠 Back to Home</button>
      </div>
    )
  }

  // Time up overlay
  if (timeUp) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0f0f13',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', fontFamily: "'Nunito', sans-serif"
      }}>
        <div style={{ fontSize: '72px', marginBottom: '16px' }}>⏰</div>
        <h2 style={{ color: '#fff', fontSize: '28px', fontWeight: '900', margin: '0 0 8px' }}>Time's Up!</h2>
        <p style={{ color: '#666', fontSize: '14px' }}>Calculating your score...</p>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      maxWidth: '680px', margin: '0 auto', background: '#0f0f13',
      fontFamily: "'Nunito', sans-serif"
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');`}</style>

      {/* Header */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid #1e1e2e',
        display: 'flex', alignItems: 'center', gap: '12px', background: '#0f0f13'
      }}>
        <button onClick={onBack} style={{
          width: '36px', height: '36px', borderRadius: '10px',
          border: '1px solid #2a2a3e', background: '#1e1e2e',
          color: '#fff', cursor: 'pointer', fontSize: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>←</button>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              borderRadius: '6px', padding: '2px 8px',
              fontSize: '10px', color: '#fff', fontWeight: '900'
            }}>🎯 DAILY CHALLENGE</div>
          </div>
          <div style={{ fontWeight: '800', fontSize: '14px', color: '#fff', marginTop: '2px' }}>
            {challenge.icon} {challenge.title}
          </div>
        </div>

        {/* Timer */}
        <Timer seconds={CHALLENGE_TIME} onExpire={handleTimeUp} />

        {/* Finish button */}
        {sessionScores.length > 0 && (
          <button onClick={handleFinish} style={{
            background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
            border: 'none', borderRadius: '10px',
            padding: '8px 12px', color: '#fff',
            fontWeight: '800', fontSize: '12px',
            cursor: 'pointer', fontFamily: 'Nunito, sans-serif'
          }}>Finish ✓</button>
        )}
      </div>

      {/* 2x XP banner */}
      <div style={{
        background: 'linear-gradient(90deg, #f59e0b22, #fbbf2411)',
        borderBottom: '1px solid #f59e0b33',
        padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        <span style={{ fontSize: '14px' }}>🌟</span>
        <span style={{ color: '#fbbf24', fontSize: '12px', fontWeight: '800' }}>
          2x BONUS XP active · Answer as many questions as you can before time runs out!
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {visibleMessages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#444', marginTop: '40px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
            <p>Starting your challenge...</p>
          </div>
        )}
        {visibleMessages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
        {loading && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#666', fontSize: '14px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
            }}>🎯</div>
            <span>AI is thinking...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Waveform */}
      {speaking && (
        <div style={{
          margin: '0 20px 8px', padding: '10px 16px',
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <span style={{ color: '#fbbf24', fontSize: '12px', fontWeight: '700' }}>🔊 AI</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '32px', flex: 1 }}>
            {waveBars.map((h, i) => (
              <div key={i} style={{
                width: '3px', borderRadius: '100px',
                background: 'linear-gradient(180deg, #fbbf24, #f59e0b)',
                height: `${h}px`, transition: 'height 0.1s ease'
              }} />
            ))}
          </div>
          <button onClick={stopSpeaking} style={{
            background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)',
            borderRadius: '8px', color: '#fbbf24', cursor: 'pointer',
            fontSize: '11px', fontWeight: '700', padding: '3px 8px'
          }}>Stop ⏹</button>
        </div>
      )}

      {/* Listening indicator */}
      {listening && (
        <div style={{
          margin: '0 20px 8px', padding: '10px 16px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '12px', color: '#ef4444', fontSize: '13px',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>🔴 Listening... speak now</div>
      )}

      {/* Input */}
      <div style={{
        padding: '14px 20px', borderTop: '1px solid #1e1e2e',
        display: 'flex', gap: '10px', alignItems: 'center', background: '#0f0f13'
      }}>
        <button onClick={listening ? stopListening : startListening} style={{
          width: '46px', height: '46px', borderRadius: '13px',
          border: listening ? '1px solid #ef4444' : '1px solid #2a2a3e',
          background: listening ? 'rgba(239,68,68,0.15)' : '#1e1e2e',
          color: listening ? '#ef4444' : '#888',
          cursor: 'pointer', fontSize: '18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>{listening ? '⏹' : '🎤'}</button>

        <input ref={inputRef} value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Answer fast! Time is ticking..."
          style={{
            flex: 1, padding: '13px 16px', borderRadius: '13px',
            border: '1px solid #2a2a3e', background: '#1e1e2e',
            color: '#fff', fontSize: '14px', outline: 'none',
            fontFamily: 'Nunito, sans-serif'
          }}
          onFocus={e => e.target.style.border = '1px solid #f59e0b'}
          onBlur={e => e.target.style.border = '1px solid #2a2a3e'}
        />

        <button onClick={handleSend} disabled={loading || !input.trim()} style={{
          width: '46px', height: '46px', borderRadius: '13px',
          background: loading || !input.trim() ? '#2a2a3e' : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
          border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
          color: '#fff', fontSize: '18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>➤</button>
      </div>
    </div>
  )
}
