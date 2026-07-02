import useMic from '../hooks/useMic'
import { useState, useRef, useEffect } from 'react'

const DEBATE_TOPICS = [
  { id: 'd1', label: 'Social media is destroying society', icon: '📱', category: 'Social' },
  { id: 'd2', label: 'AI is more dangerous than beneficial', icon: '🤖', category: 'Technology' },
  { id: 'd3', label: 'Reservations should be abolished', icon: '⚖️', category: 'Policy' },
  { id: 'd4', label: 'Capital punishment is justified', icon: '⚖️', category: 'Law' },
  { id: 'd5', label: 'India should ban fast food chains', icon: '🍔', category: 'Health' },
  { id: 'd6', label: 'Technology has made us less human', icon: '💻', category: 'Technology' },
  { id: 'd7', label: 'Celebrities should stay out of politics', icon: '🎬', category: 'Social' },
  { id: 'd8', label: 'Money is more important than passion', icon: '💰', category: 'Career' },
  { id: 'd9', label: 'Gap year is beneficial for students', icon: '🎒', category: 'Education' },
  { id: 'd10', label: 'News media is biased in India', icon: '📰', category: 'Media' },
]

function getScoreColor(s) { return s >= 8 ? '#22c55e' : s >= 6 ? '#f59e0b' : '#ef4444' }

export default function DebateScreen({ onBack }) {
  const [phase, setPhase] = useState('topics')
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [userSide, setUserSide] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [result, setResult] = useState(null)
  const [turnCount, setTurnCount] = useState(0)
  const bottomRef = useRef(null)
  const recognitionRef = useRef(null)
  const historyRef = useRef([])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const speakText = (text) => {
    window.speechSynthesis.cancel()
    setSpeaking(true)
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-IN'; u.rate = 0.9; u.pitch = 0.85
    const voices = window.speechSynthesis.getVoices()
    const v = voices.find(v => v.name.includes('Daniel') || v.name.includes('Google UK English Male'))
    if (v) u.voice = v
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(u)
  }

  const startDebate = async () => {
    setPhase('debate')
    setLoading(true)
    const opening = `Let's debate: "${selectedTopic.label}". You are arguing ${userSide.toUpperCase()} this. I will argue ${userSide === 'for' ? 'AGAINST' : 'FOR'}. Make your opening statement!`
    const msg = { role: 'ai', content: opening }
    setMessages([msg])
    historyRef.current = [{ role: 'assistant', content: opening }]
    setLoading(false)
    speakText(opening)
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userText = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userText }])
    historyRef.current.push({ role: 'user', content: userText })
    setLoading(true)
    setTurnCount(p => p + 1)
    try {
      const res = await fetch('/api/modes/debate/respond', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: selectedTopic.label, userSide, history: historyRef.current.slice(-6), userMessage: userText })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }])
      historyRef.current.push({ role: 'assistant', content: data.reply })
      speakText(data.reply)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const endDebate = async () => {
    window.speechSynthesis.cancel()
    setLoading(true)
    const transcript = messages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n')
    try {
      const res = await fetch('/api/modes/debate/evaluate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: selectedTopic.label, userSide, transcript })
      })
      const data = await res.json()
      setResult(data)
      setPhase('result')
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Use Chrome'); return }
    const r = new SR(); // mic handled by useMic hook
    r.start()
  }

  if (phase === 'topics') return (
    <div style={{ minHeight: '100vh', background: '#f5f7ff', fontFamily: "'Nunito', sans-serif", paddingBottom: '40px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');`}</style>
      <div style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', padding: '48px 20px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ maxWidth: '480px', margin: '0 auto', position: 'relative' }}>
          <button onClick={onBack} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>←</button>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '900', margin: '0 0 6px' }}>🎤 Debate Mode</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: 0 }}>Argue your side against AI — get scored by a judge</p>
        </div>
      </div>
      <div style={{ maxWidth: '480px', margin: '-48px auto 0', padding: '0 16px', position: 'relative', zIndex: 1 }}>
        <p style={{ fontWeight: '800', fontSize: '15px', color: '#1a1a2e', margin: '0 0 12px 4px' }}>Choose a Topic</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {DEBATE_TOPICS.map(t => (
            <button key={t.id} onClick={() => setSelectedTopic(t)} style={{
              padding: '14px 18px', borderRadius: '16px', border: 'none', textAlign: 'left',
              background: selectedTopic?.id === t.id ? 'linear-gradient(135deg, #dc2626, #991b1b)' : '#fff',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)', cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif', display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <span style={{ fontSize: '22px' }}>{t.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '800', fontSize: '14px', color: selectedTopic?.id === t.id ? '#fff' : '#1a1a2e' }}>{t.label}</div>
                <div style={{ fontSize: '11px', color: selectedTopic?.id === t.id ? 'rgba(255,255,255,0.7)' : '#aaa', marginTop: '2px' }}>{t.category}</div>
              </div>
              {selectedTopic?.id === t.id && <span style={{ color: '#fff' }}>✓</span>}
            </button>
          ))}
        </div>
        {selectedTopic && (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
            <p style={{ fontWeight: '800', fontSize: '14px', color: '#1a1a2e', margin: '0 0 14px' }}>Pick your side:</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[['for', '👍 FOR', '#22c55e'], ['against', '👎 AGAINST', '#ef4444']].map(([side, label, color]) => (
                <button key={side} onClick={() => setUserSide(side)} style={{
                  flex: 1, padding: '14px', borderRadius: '14px', border: 'none', fontFamily: 'Nunito, sans-serif',
                  background: userSide === side ? color : '#f3f4f6',
                  color: userSide === side ? '#fff' : '#888', fontWeight: '900', fontSize: '14px', cursor: 'pointer'
                }}>{label}</button>
              ))}
            </div>
          </div>
        )}
        <button onClick={() => selectedTopic && userSide && startDebate()} style={{
          width: '100%', padding: '16px', borderRadius: '16px',
          background: selectedTopic && userSide ? 'linear-gradient(135deg, #dc2626, #991b1b)' : '#e5e7eb',
          border: 'none', color: '#fff', fontWeight: '900', fontSize: '15px',
          cursor: selectedTopic && userSide ? 'pointer' : 'not-allowed', fontFamily: 'Nunito, sans-serif'
        }}>Start Debate →</button>
      </div>
    </div>
  )

  if (phase === 'result') return (
    <div style={{ minHeight: '100vh', background: '#f5f7ff', fontFamily: "'Nunito', sans-serif", padding: '40px 16px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');`}</style>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>{result?.overall >= 7 ? '🏆' : '📊'}</div>
          <h2 style={{ fontWeight: '900', fontSize: '24px', color: '#1a1a2e', margin: '0 0 6px' }}>Debate Result</h2>
          <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>{result?.verdict}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            ['💪 Arguments', result?.argumentStrength],
            ['🧠 Logic', result?.logic],
            ['📊 Evidence', result?.evidence],
            ['🔄 Rebuttal', result?.rebuttal],
          ].map(([label, val], i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '16px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: '900', fontSize: '24px', color: getScoreColor(val) }}>{val}/10</div>
              <div style={{ color: '#888', fontSize: '12px', fontWeight: '700' }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '16px', padding: '14px' }}>
            <p style={{ margin: '0 0 5px', color: '#059669', fontSize: '10px', fontWeight: '800' }}>✅ BEST POINT</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#1a1a2e', fontWeight: '700' }}>{result?.bestPoint}</p>
          </div>
          <div style={{ background: '#fff9f9', border: '1.5px solid #fca5a5', borderRadius: '16px', padding: '14px' }}>
            <p style={{ margin: '0 0 5px', color: '#ef4444', fontSize: '10px', fontWeight: '800' }}>⚠️ WEAKNESS</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#1a1a2e', fontWeight: '700' }}>{result?.weakness}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => { setPhase('topics'); setMessages([]); setResult(null); setTurnCount(0); setUserSide(null) }} style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'none', border: '2px solid #dc2626', color: '#dc2626', fontWeight: '800', fontSize: '13px', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>🔄 New Debate</button>
          <button onClick={onBack} style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'linear-gradient(135deg, #dc2626, #991b1b)', border: 'none', color: '#fff', fontWeight: '800', fontSize: '13px', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>🏠 Home</button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: '680px', margin: '0 auto', background: '#0f0f13', fontFamily: "'Nunito', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');`}</style>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e2e', background: '#0f0f13', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={onBack} style={{ width: '34px', height: '34px', borderRadius: '10px', border: '1px solid #2a2a3e', background: '#1e1e2e', color: '#fff', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '800', fontSize: '13px', color: '#fff' }}>🎤 {selectedTopic?.label}</div>
          <div style={{ color: userSide === 'for' ? '#22c55e' : '#ef4444', fontSize: '11px', fontWeight: '700' }}>You: {userSide?.toUpperCase()} · {turnCount} exchanges</div>
        </div>
        {turnCount >= 3 && <button onClick={endDebate} style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', border: 'none', borderRadius: '10px', padding: '7px 12px', color: '#fff', fontWeight: '800', fontSize: '11px', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>End ✓</button>}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: '14px', display: 'flex', flexDirection: msg.role === 'ai' ? 'row' : 'row-reverse', gap: '8px', alignItems: 'flex-start' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0, background: msg.role === 'ai' ? '#1e1e2e' : 'linear-gradient(135deg, #dc2626, #991b1b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{msg.role === 'ai' ? '🤖' : '🙋'}</div>
            <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: msg.role === 'ai' ? '4px 14px 14px 14px' : '14px 4px 14px 14px', background: msg.role === 'ai' ? '#1e1e2e' : 'linear-gradient(135deg, #dc2626, #991b1b)', color: '#fff', fontSize: '13px', lineHeight: '1.6', fontWeight: '600' }}>{msg.content}</div>
          </div>
        ))}
        {loading && <div style={{ color: '#444', fontSize: '13px' }}>AI is thinking...</div>}
        <div ref={bottomRef} />
      </div>
      {listening && <div style={{ margin: '0 16px 8px', padding: '8px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#ef4444', fontSize: '12px', fontWeight: '700' }}>🔴 Listening...</div>}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1e1e2e', display: 'flex', gap: '8px', alignItems: 'center', background: '#0f0f13' }}>
        <button onClick={listening ? () => recognitionRef.current?.stop() : startListening} style={{ width: '44px', height: '44px', borderRadius: '12px', border: listening ? '1px solid #ef4444' : '1px solid #2a2a3e', background: listening ? 'rgba(239,68,68,0.15)' : '#1e1e2e', color: listening ? '#ef4444' : '#888', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{listening ? '⏹' : '🎤'}</button>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Make your argument..." style={{ flex: 1, padding: '12px 14px', borderRadius: '12px', border: '1px solid #2a2a3e', background: '#1e1e2e', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Nunito, sans-serif' }} onFocus={e => e.target.style.border = '1px solid #dc2626'} onBlur={e => e.target.style.border = '1px solid #2a2a3e'} />
        <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ width: '44px', height: '44px', borderRadius: '12px', border: 'none', background: loading || !input.trim() ? '#2a2a3e' : 'linear-gradient(135deg, #dc2626, #991b1b)', color: '#fff', fontSize: '18px', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>➤</button>
      </div>
    </div>
  )
}
