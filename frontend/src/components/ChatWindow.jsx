import useMic from '../hooks/useMic'
import { useState, useEffect, useRef } from 'react'
import { useChat } from '../hooks/useChat'
import MessageBubble from './MessageBubble'

const topicLabels = {
  hr: '👔 HR Interview',
  tech: '💻 Technical',
  gd: '🗣️ Group Discussion',
  intro: '🙋 Introduce Yourself'
}

export default function ChatWindow({ topic, onBack }) {
  const { messages, loading, sendUserMessage, initWithQuestion } = useChat(topic)
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(false)
  const [sessionScores, setSessionScores] = useState([])
  const [showSummary, setShowSummary] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)
  const waveIntervalRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const FIRST_Q = {
      hr: { beginner: "What is your name and where are you from?", intermediate: "Tell me about yourself and your background.", advanced: "Walk me through a project where you demonstrated leadership." },
      tech: { beginner: "What programming language do you know best?", intermediate: "Explain the difference between a stack and a queue.", advanced: "Design a URL shortener system. Walk me through your architecture." },
      gd: { beginner: "Do you think mobile phones are good or bad for students?", intermediate: "Should India focus more on startups or established companies?", advanced: "Analyze the impact of AI on employment in the next decade." },
      intro: { beginner: "Can you tell me your name and which college you study in?", intermediate: "Please introduce yourself - your background, education, and interests.", advanced: "Give me a 2-minute structured introduction covering your background and career vision." }
    }
    const userLevel = localStorage.getItem('englishtalk_level') || 'intermediate'
    const firstQ = FIRST_Q[topic]?.[userLevel] || FIRST_Q.hr[userLevel]
    initWithQuestion(firstQ)
  }, [])

  useEffect(() => {
    if (!autoSpeak) return
    const last = messages[messages.length - 1]
    if (last?.role === 'assistant') speakText(extractSpeakableText(last.content, last))
  }, [messages, autoSpeak])

  useEffect(() => {
    const scores = messages.filter(m => m.role === 'assistant' && m.score != null).map(m => m.score)
    setSessionScores(scores)
  }, [messages])

  const extractSpeakableText = (content, message) => {
    if (message && message.whatGood) {
      const parts = []
      if (message.whatGood) parts.push(message.whatGood)
      if (message.grammarTip && message.grammarTip !== 'No major grammar issues!') parts.push('Grammar tip: ' + message.grammarTip)
      if (message.betterWord && message.betterWord !== 'Good word choice!') parts.push('Better word: ' + message.betterWord)
      if (message.sample) parts.push('Here is an ideal answer: ' + message.sample)
      if (message.nextQuestion) parts.push('Next question: ' + message.nextQuestion)
      return parts.join('. ')
    }
    const nextMatch = content.match(/NEXT:\s*(.+)/s)
    const feedbackMatch = content.match(/FEEDBACK:\s*(.+?)(?=NEXT:|$)/s)
    if (nextMatch) {
      const feedback = feedbackMatch ? feedbackMatch[1].trim() : ''
      return `${feedback} Next question: ${nextMatch[1].trim()}`
    }
    return content
  }

  const speakText = (text) => {
    window.speechSynthesis.cancel()
    setSpeaking(true)
    waveIntervalRef.current = setInterval(() => {}, 120)
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-IN'; u.rate = 0.92; u.pitch = 1.0
    const voices = window.speechSynthesis.getVoices()
    const best = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en'))
    if (best) u.voice = best
    u.onend = () => { setSpeaking(false); clearInterval(waveIntervalRef.current) }
    u.onerror = () => { setSpeaking(false); clearInterval(waveIntervalRef.current) }
    window.speechSynthesis.speak(u)
  }

  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
    clearInterval(waveIntervalRef.current)
  }

  const handleSpeakLast = () => {
    if (speaking) { stopSpeaking(); return }
    const aiMessages = messages.filter(m => m.role === 'assistant')
    if (aiMessages.length === 0) return
    const last = aiMessages[aiMessages.length - 1]
    speakText(extractSpeakableText(last.content, last))
  }

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Please use Chrome for voice input.'); return }
    const r = new SR()
    // mic handled by useMic hook
    r.onerror = (e) => { console.error('Mic error:', e.error); setListening(false) }
    r.start()
  }

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false) }

  const handleSend = () => {
    if (!input.trim() || loading) return
    sendUserMessage(input)
    setInput('')
    inputRef.current?.focus()
  }

  const avgScore = sessionScores.length
    ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length) : 0

  const handleFinish = () => {
    if (sessionScores.length > 0) setShowSummary(true)
    else onBack(null)
  }

  const visibleMessages = messages.filter(m =>
    !(m.role === 'user' && m.content === 'Start the interview. Ask me the first question.')
  )

  // Session Summary Screen
  if (showSummary) {
    const getGrade = (s) => s >= 9 ? 'A+' : s >= 8 ? 'A' : s >= 7 ? 'B+' : s >= 6 ? 'B' : s >= 5 ? 'C' : 'D'
    const getColor = (s) => s >= 8 ? '#22c55e' : s >= 6 ? '#f59e0b' : '#ef4444'
    const xpEarned = avgScore * 10

    return (
      <div style={{ minHeight: '100vh', background: '#f5f7ff', fontFamily: "'Nunito', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'); * { box-sizing: border-box; }`}</style>
        <div style={{ width: '90px', height: '90px', borderRadius: '28px', background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '44px', marginBottom: '16px', boxShadow: '0 8px 32px rgba(108,99,255,0.3)' }}>🏆</div>
        <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#1a1a2e', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Session Complete!</h2>
        <p style={{ color: '#888', fontSize: '14px', margin: '0 0 32px' }}>{sessionScores.length} question{sessionScores.length > 1 ? 's' : ''} answered</p>
        <div style={{ width: '130px', height: '130px', borderRadius: '50%', background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', border: `4px solid ${getColor(avgScore)}` }}>
          <div style={{ fontSize: '36px', fontWeight: '900', color: getColor(avgScore), lineHeight: 1 }}>{getGrade(avgScore)}</div>
          <div style={{ fontSize: '13px', color: '#aaa', fontWeight: '600' }}>{avgScore}/10 avg</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', width: '100%', maxWidth: '400px', marginBottom: '28px' }}>
          {[{ icon: '⭐', value: `+${xpEarned}`, label: 'XP Earned' }, { icon: '🎯', value: avgScore + '/10', label: 'Avg Score' }, { icon: '💬', value: sessionScores.length, label: 'Answers' }].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '16px', padding: '16px 8px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '22px', marginBottom: '4px' }}>{s.icon}</div>
              <div style={{ fontWeight: '900', fontSize: '18px', color: '#1a1a2e' }}>{s.value}</div>
              <div style={{ color: '#aaa', fontSize: '11px', fontWeight: '600' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '400px', marginBottom: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p style={{ fontWeight: '800', fontSize: '14px', color: '#1a1a2e', margin: '0 0 14px' }}>Score Breakdown</p>
          {sessionScores.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{ color: '#888', fontSize: '12px', fontWeight: '600', minWidth: '60px' }}>Q{i + 1}</span>
              <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '100px', height: '8px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '100px', background: getColor(s), width: `${s * 10}%`, transition: 'width 0.6s ease' }} />
              </div>
              <span style={{ color: getColor(s), fontWeight: '800', fontSize: '13px', minWidth: '30px' }}>{s}/10</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '400px' }}>
          <button onClick={() => onBack(avgScore)} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)', border: 'none', color: '#fff', fontWeight: '800', fontSize: '15px', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>🏠 Home</button>
          <button onClick={() => { setShowSummary(false); onBack(avgScore) }} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: '#fff', border: '2px solid #6c63ff', color: '#6c63ff', fontWeight: '800', fontSize: '15px', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>🔄 Again</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '680px', margin: '0 auto', background: '#0f0f13', fontFamily: "'Nunito', sans-serif", position: 'fixed', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', overflow: 'hidden' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'); * { box-sizing: border-box; }`}</style>

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e2e', display: 'flex', alignItems: 'center', gap: '12px', background: '#0f0f13', flexShrink: 0 }}>
        <button onClick={handleFinish} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #2a2a3e', background: '#1e1e2e', color: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '800', fontSize: '15px', color: '#fff' }}>{topicLabels[topic] || topic}</div>
          <div style={{ color: '#6c63ff', fontSize: '12px' }}>● Live session · Indian English</div>
        </div>
        {sessionScores.length > 0 && (
          <div style={{ background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '12px', padding: '6px 12px', textAlign: 'center' }}>
            <div style={{ color: '#a78bfa', fontSize: '11px', fontWeight: '700' }}>AVG</div>
            <div style={{ color: '#fff', fontWeight: '900', fontSize: '16px', lineHeight: 1 }}>{avgScore}/10</div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#666', fontSize: '11px' }}>🔊</span>
          <div onClick={() => { setAutoSpeak(p => !p); stopSpeaking() }} style={{ width: '36px', height: '20px', borderRadius: '10px', background: autoSpeak ? '#6c63ff' : '#2a2a3e', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: autoSpeak ? '19px' : '3px', transition: 'all 0.2s' }} />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', minHeight: 0 }}>
        {visibleMessages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#444', marginTop: '40px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
            <p>Starting your session...</p>
          </div>
        )}
        {visibleMessages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
        {loading && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#666', fontSize: '14px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🎯</div>
            <span>AI is thinking...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {listening && (
        <div style={{ margin: '0 16px 8px', padding: '10px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>🔴 Listening... speak now</div>
      )}

      {speaking && (
        <div style={{ margin: '0 16px 8px', padding: '10px 16px', background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '12px', color: '#a78bfa', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>🔊 AI speaking...</span>
          <button onClick={stopSpeaking} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>Stop</button>
        </div>
      )}

      {/* Input bar */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1e1e2e', display: 'flex', gap: '10px', alignItems: 'center', background: '#0f0f13', flexShrink: 0, paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <button onClick={listening ? stopListening : startListening} style={{ width: '48px', height: '48px', borderRadius: '14px', border: listening ? '1px solid #ef4444' : '1px solid #2a2a3e', background: listening ? 'rgba(239,68,68,0.15)' : '#1e1e2e', color: listening ? '#ef4444' : '#888', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {listening ? '⏹' : '🎤'}
        </button>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={listening ? 'Listening...' : 'Type or tap 🎤 to speak...'}
          style={{ flex: 1, padding: '14px 18px', borderRadius: '14px', border: '1px solid #2a2a3e', background: '#1e1e2e', color: '#fff', fontSize: '15px', outline: 'none', fontFamily: 'Nunito, sans-serif' }}
          onFocus={e => e.target.style.border = '1px solid #6c63ff'}
          onBlur={e => e.target.style.border = '1px solid #2a2a3e'}
        />
        <button onClick={handleSpeakLast} style={{ width: '48px', height: '48px', borderRadius: '14px', border: speaking ? '1px solid #a78bfa' : '1px solid #2a2a3e', background: speaking ? 'rgba(108,99,255,0.15)' : '#1e1e2e', color: speaking ? '#a78bfa' : '#888', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {speaking ? '⏸' : '🔊'}
        </button>
        <button onClick={handleSend} disabled={loading || !input.trim()} style={{ width: '48px', height: '48px', borderRadius: '14px', background: loading || !input.trim() ? '#2a2a3e' : 'linear-gradient(135deg, #6c63ff, #8b5cf6)', border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', color: '#fff', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>➤</button>
      </div>
    </div>
  )
}
