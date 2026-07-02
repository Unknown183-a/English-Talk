import useMic from '../hooks/useMic'
import { useState, useRef } from 'react'

const sentences = [
  { text: "I would like to present my project to the committee.", level: "Beginner", category: "Formal" },
  { text: "My greatest strength is my ability to adapt quickly.", level: "Beginner", category: "HR" },
  { text: "I have implemented several algorithms to optimize performance.", level: "Intermediate", category: "Technical" },
  { text: "Our quarterly revenue exceeded expectations significantly.", level: "Intermediate", category: "Business" },
  { text: "I collaborated with cross-functional teams to deliver results.", level: "Intermediate", category: "HR" },
  { text: "The architecture follows microservices design principles.", level: "Advanced", category: "Technical" },
  { text: "I believe in continuous learning and professional development.", level: "Beginner", category: "HR" },
  { text: "We need to leverage our core competencies strategically.", level: "Advanced", category: "Business" },
  { text: "The algorithm has a time complexity of O of n log n.", level: "Advanced", category: "Technical" },
  { text: "I am passionate about solving complex engineering challenges.", level: "Intermediate", category: "HR" },
]

function getScoreColor(s) {
  return s >= 8 ? '#22c55e' : s >= 6 ? '#f59e0b' : '#ef4444'
}

function ScoreRing({ value, label, color }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = (value / 10) * circ
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ position: 'relative', width: '72px', height: '72px' }}>
        <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="36" cy="36" r={r} fill="none" stroke="#f3f4f6" strokeWidth="5" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: '900', fontSize: '18px', color
        }}>{value}</div>
      </div>
      <span style={{ color: '#888', fontSize: '11px', fontWeight: '700' }}>{label}</span>
    </div>
  )
}

function WordComparison({ original, spoken, mispronounced }) {
  const badWords = (mispronounced || '').toLowerCase()
    .split(',').map(w => w.trim()).filter(Boolean)

  const words = original.split(' ')
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {words.map((word, i) => {
        const clean = word.toLowerCase().replace(/[^a-z]/g, '')
        const isBad = badWords.some(b => b.includes(clean) || clean.includes(b))
        return (
          <span key={i} style={{
            padding: '4px 10px', borderRadius: '8px', fontSize: '14px', fontWeight: '700',
            background: isBad ? '#fee2e2' : '#dcfce7',
            color: isBad ? '#ef4444' : '#16a34a',
            border: `1px solid ${isBad ? '#fca5a5' : '#86efac'}`
          }}>{word}</span>
        )
      })}
    </div>
  )
}

export default function PronunciationScreen({ onBack }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [filter, setFilter] = useState('All')
  const [listening, setListening] = useState(false)
  const [spoken, setSpoken] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sessionScores, setSessionScores] = useState([])
  const recognitionRef = useRef(null)
  const confidenceRef = useRef(0.8)
  const audioRef = useRef(null)
  const [speaking, setSpeaking] = useState(false)
  const [waveBars, setWaveBars] = useState(Array.from({ length: 18 }, () => 4))
  const waveIntervalRef = useRef(null)

  const categories = ['All', 'HR', 'Technical', 'Business', 'Formal']
  const filtered = filter === 'All' ? sentences : sentences.filter(s => s.category === filter)
  const current = filtered[currentIdx % filtered.length]

  // ── Voice responder ──────────────────────────────────────
  const stopSpeaking = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    setSpeaking(false)
    clearInterval(waveIntervalRef.current)
    setWaveBars(Array.from({ length: 18 }, () => 4))
  }

  const speakText = async (text) => {
    stopSpeaking()
    setSpeaking(true)
    waveIntervalRef.current = setInterval(() => {
      setWaveBars(Array.from({ length: 18 }, () => Math.floor(4 + Math.random() * 26)))
    }, 110)
    try {
      // Try server TTS first, fall back to Web Speech API
            let usedServer = false
            try {
              const res = await fetch('/api/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
              })
              const contentType = res.headers.get('content-type') || ''
              if (contentType.includes('audio')) {
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const audio = new Audio(url)
                audioRef.current = audio
                audio.onended = () => { stopSpeaking(); URL.revokeObjectURL(url) }
                audio.onerror = () => stopSpeaking()
                audio.play()
                usedServer = true
              }
            } catch (e) { usedServer = false }
            if (!usedServer) {
              window.speechSynthesis.cancel()
              const u = new SpeechSynthesisUtterance(text)
              u.lang = 'en-IN'
              u.rate = 0.9
              u.onend = () => setSpeaking(false)
              window.speechSynthesis.speak(u)
            }
    } catch {
      // browser TTS fallback
      clearInterval(waveIntervalRef.current)
      setSpeaking(true)
      const u = new window.SpeechSynthesisUtterance(text)
      u.lang = 'en-IN'; u.rate = 0.92
      u.onend = () => { setSpeaking(false); setWaveBars(Array.from({ length: 18 }, () => 4)) }
      window.speechSynthesis.speak(u)
    }
  }

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Use Chrome for voice input.'); return }
    const r = new SR()
    // mic handled by useMic hook
      setListening(false)
      if (spoken || recognitionRef.current?._finalTranscript) {
        scoreIt(recognitionRef.current?._finalTranscript || spoken)
      }
    }
    r.onerror = () => setListening(false)
    r.start()
  }

  const stopAndScore = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const scoreIt = async (spokenText) => {
    const text = spokenText || spoken
    if (!text.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/pronunciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original: current.text,
          spoken: text,
          confidence: confidenceRef.current
        })
      })
      const data = await res.json()
      setResult(data)
      setSessionScores(prev => [...prev, data.overall])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    setCurrentIdx(i => i + 1)
    setSpoken('')
    setResult(null)
  }

  const handleRetry = () => {
    stopSpeaking()
    setSpoken('')
    setResult(null)
  }

  // Speak the sentence when it first appears
  const handleListenToSentence = () => speakText(current.text)

  // Speak tip after result arrives
  const handleListenToTip = () => {
    if (result?.tip) speakText(result.tip)
  }

  const avgScore = sessionScores.length
    ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length)
    : null

  return (
    <div style={{
      minHeight: '100vh', background: '#f5f7ff',
      fontFamily: "'Nunito', sans-serif", paddingBottom: '40px'
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
        padding: '48px 20px 80px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'180px', height:'180px', borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
        <div style={{ maxWidth: '480px', margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <button onClick={onBack} style={{
              width: '36px', height: '36px', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)',
              color: '#fff', cursor: 'pointer', fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>←</button>
            {avgScore !== null && (
              <div style={{
                background: 'rgba(255,255,255,0.15)', borderRadius: '12px',
                padding: '6px 14px', textAlign: 'center'
              }}>
                <div style={{ color: '#fff', fontWeight: '900', fontSize: '18px' }}>{avgScore}/10</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: '700' }}>AVG SCORE</div>
              </div>
            )}
          </div>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '900', margin: '16px 0 4px' }}>🎤 Pronunciation</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: 0 }}>
            {sessionScores.length} sentence{sessionScores.length !== 1 ? 's' : ''} practiced
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '-48px auto 0', padding: '0 16px', position: 'relative', zIndex: 1 }}>

        {/* Category filter */}
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '12px',
          marginBottom: '16px', boxShadow: '0 4px 24px rgba(6,182,212,0.12)',
          display: 'flex', gap: '6px', overflowX: 'auto'
        }}>
          {categories.map(c => (
            <button key={c} onClick={() => { setFilter(c); setCurrentIdx(0); setResult(null); setSpoken('') }} style={{
              padding: '6px 14px', borderRadius: '100px', border: 'none',
              background: filter === c ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : '#f3f4f6',
              color: filter === c ? '#fff' : '#888',
              fontWeight: '800', fontSize: '12px', cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif', whiteSpace: 'nowrap'
            }}>{c}</button>
          ))}
        </div>

        {/* Sentence card */}
        <div style={{
          background: '#fff', borderRadius: '20px', padding: '22px',
          marginBottom: '16px', boxShadow: '0 4px 24px rgba(6,182,212,0.10)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{
                background: '#e0f7fa', color: '#0891b2',
                borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: '800'
              }}>{current.level}</span>
              <span style={{
                background: '#f3f4f6', color: '#888',
                borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: '800'
              }}>{current.category}</span>
            </div>
            <span style={{ color: '#ccc', fontSize: '12px', fontWeight: '700' }}>
              {(currentIdx % filtered.length) + 1}/{filtered.length}
            </span>
          </div>

          {/* Target sentence */}
          <div style={{
            background: '#f0f9ff', border: '1.5px solid #bae6fd',
            borderRadius: '14px', padding: '16px', marginBottom: '16px'
          }}>
            <p style={{ margin: '0 0 6px', color: '#0891b2', fontSize: '10px', fontWeight: '800' }}>SAY THIS:</p>
            <p style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#1a1a2e', lineHeight: '1.5' }}>
              "{current.text}"
            </p>
            <button onClick={handleListenToSentence} disabled={speaking} style={{
              marginTop: '10px', background: speaking ? '#e0f7fa' : 'linear-gradient(135deg, #06b6d4, #0891b2)',
              border: 'none', borderRadius: '10px', padding: '7px 16px',
              color: '#fff', fontWeight: '800', fontSize: '12px',
              cursor: speaking ? 'not-allowed' : 'pointer', fontFamily: 'Nunito, sans-serif',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              {speaking ? '🔊 Playing...' : '🔊 Hear it'}
            </button>
          </div>

          {/* Waveform while AI speaks */}
          {speaking && (
            <div style={{
              margin: '0 0 14px', padding: '10px 14px',
              background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)',
              borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <span style={{ color: '#0891b2', fontSize: '12px', fontWeight: '700' }}>🔊 AI</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '30px', flex: 1 }}>
                {waveBars.map((h, i) => (
                  <div key={i} style={{
                    width: '3px', borderRadius: '100px',
                    background: 'linear-gradient(180deg, #06b6d4, #0891b2)',
                    height: `${h}px`, transition: 'height 0.1s ease'
                  }} />
                ))}
              </div>
              <button onClick={stopSpeaking} style={{
                background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.4)',
                borderRadius: '8px', color: '#0891b2', cursor: 'pointer',
                fontSize: '11px', fontWeight: '700', padding: '3px 8px', fontFamily: 'Nunito,sans-serif'
              }}>Stop ⏹</button>
            </div>
          )}

          {/* Mic button */}
          {!result && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={listening ? stopAndScore : startListening}
                style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  border: 'none', cursor: 'pointer', fontSize: '32px',
                  background: listening
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  boxShadow: listening
                    ? '0 0 0 12px rgba(239,68,68,0.15), 0 8px 24px rgba(239,68,68,0.3)'
                    : '0 8px 24px rgba(6,182,212,0.35)',
                  animation: listening ? 'pulse 1s infinite' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >{listening ? '⏹' : '🎤'}</button>

              <p style={{ margin: 0, color: listening ? '#ef4444' : '#aaa', fontSize: '13px', fontWeight: '700' }}>
                {listening ? '🔴 Listening... tap to stop' : 'Tap to speak'}
              </p>

              {spoken && !listening && (
                <div style={{ width: '100%', background: '#f8f7ff', borderRadius: '12px', padding: '12px' }}>
                  <p style={{ margin: '0 0 4px', color: '#888', fontSize: '10px', fontWeight: '800' }}>YOU SAID:</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#1a1a2e', fontWeight: '600' }}>"{spoken}"</p>
                  <button onClick={() => scoreIt(spoken)} disabled={loading} style={{
                    marginTop: '10px', width: '100%', padding: '10px',
                    borderRadius: '10px', border: 'none',
                    background: loading ? '#e5e7eb' : 'linear-gradient(135deg, #06b6d4, #0891b2)',
                    color: '#fff', fontWeight: '800', fontSize: '13px',
                    cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Nunito, sans-serif'
                  }}>{loading ? 'Scoring...' : '📊 Score My Pronunciation'}</button>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Score rings */}
              <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0' }}>
                <ScoreRing value={result.clarity} label="Clarity" color={getScoreColor(result.clarity)} />
                <ScoreRing value={result.accuracy} label="Accuracy" color={getScoreColor(result.accuracy)} />
                <ScoreRing value={result.pace} label="Pace" color={getScoreColor(result.pace)} />
              </div>

              {/* Overall */}
              <div style={{
                background: `${getScoreColor(result.overall)}15`,
                border: `1.5px solid ${getScoreColor(result.overall)}44`,
                borderRadius: '12px', padding: '12px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontWeight: '800', fontSize: '14px', color: '#1a1a2e' }}>Overall Score</span>
                <span style={{ fontWeight: '900', fontSize: '24px', color: getScoreColor(result.overall) }}>
                  {result.overall}/10
                </span>
              </div>

              {/* Word comparison */}
              {result.mispronounced && result.mispronounced !== 'None' && (
                <div style={{ background: '#fff9f9', border: '1.5px solid #fca5a5', borderRadius: '12px', padding: '12px' }}>
                  <p style={{ margin: '0 0 8px', color: '#ef4444', fontSize: '10px', fontWeight: '800' }}>WORD CHECK:</p>
                  <WordComparison original={current.text} spoken={spoken} mispronounced={result.mispronounced} />
                </div>
              )}

              {/* You said */}
              <div style={{ background: '#f8f7ff', borderRadius: '12px', padding: '12px' }}>
                <p style={{ margin: '0 0 4px', color: '#888', fontSize: '10px', fontWeight: '800' }}>YOU SAID:</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#555', fontStyle: 'italic' }}>"{spoken}"</p>
              </div>

              {/* Tip */}
              {result.tip && (
                <div style={{
                  background: 'rgba(6,182,212,0.08)', border: '1.5px solid rgba(6,182,212,0.25)',
                  borderRadius: '12px', padding: '12px',
                  display: 'flex', gap: '8px', alignItems: 'flex-start'
                }}>
                  <span style={{ fontSize: '16px' }}>💡</span>
                  <div>
                    <p style={{ margin: '0 0 3px', color: '#0891b2', fontSize: '10px', fontWeight: '800' }}>PRONUNCIATION TIP</p>
                    <p style={{ margin: 0, color: '#0e7490', fontSize: '13px', lineHeight: '1.5' }}>{result.tip}</p>
                    <button onClick={handleListenToTip} disabled={speaking} style={{
                      marginTop: '8px', background: 'none', border: '1px solid #0891b2',
                      borderRadius: '8px', color: '#0891b2', cursor: speaking ? 'not-allowed' : 'pointer',
                      fontSize: '11px', fontWeight: '700', padding: '4px 10px', fontFamily: 'Nunito,sans-serif'
                    }}>🔊 Hear tip</button>
                  </div>
                </div>
              )}

              {/* Example */}
              {result.example && (
                <div style={{
                  background: 'rgba(108,99,255,0.08)', border: '1.5px solid rgba(108,99,255,0.2)',
                  borderRadius: '12px', padding: '12px',
                  display: 'flex', gap: '8px', alignItems: 'flex-start'
                }}>
                  <span style={{ fontSize: '16px' }}>🌟</span>
                  <div>
                    <p style={{ margin: '0 0 3px', color: '#6c63ff', fontSize: '10px', fontWeight: '800' }}>STRESS PATTERN</p>
                    <p style={{ margin: 0, color: '#5b21b6', fontSize: '13px', fontWeight: '700', fontStyle: 'italic' }}>{result.example}</p>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleRetry} style={{
                  flex: 1, padding: '13px', borderRadius: '14px',
                  background: '#fff', border: '2px solid #06b6d4',
                  color: '#06b6d4', fontWeight: '800', fontSize: '14px',
                  cursor: 'pointer', fontFamily: 'Nunito, sans-serif'
                }}>🔄 Retry</button>
                <button onClick={handleNext} style={{
                  flex: 1, padding: '13px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  border: 'none', color: '#fff', fontWeight: '800', fontSize: '14px',
                  cursor: 'pointer', fontFamily: 'Nunito, sans-serif'
                }}>Next →</button>
              </div>
            </div>
          )}
        </div>

        {/* Session scores */}
        {sessionScores.length > 0 && (
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '18px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
          }}>
            <p style={{ margin: '0 0 12px', fontWeight: '800', fontSize: '14px', color: '#1a1a2e' }}>This Session</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {sessionScores.map((s, i) => (
                <div key={i} style={{
                  background: `${getScoreColor(s)}15`,
                  border: `1.5px solid ${getScoreColor(s)}44`,
                  borderRadius: '10px', padding: '6px 12px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                  <span style={{ fontWeight: '900', fontSize: '16px', color: getScoreColor(s) }}>{s}</span>
                  <span style={{ color: '#aaa', fontSize: '9px', fontWeight: '700' }}>S{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
