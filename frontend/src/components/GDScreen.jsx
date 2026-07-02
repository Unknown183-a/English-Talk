import { useState, useRef, useEffect } from 'react'

const GD_TOPICS = [
  // Technology
  { id: 'ai', label: 'AI will replace jobs', icon: '🤖', category: 'Technology' },
  { id: 'ev', label: 'Electric vehicles are the future of transport', icon: '⚡', category: 'Technology' },
  { id: 'privacy', label: 'Privacy is more important than security', icon: '🔒', category: 'Technology' },
  { id: 'crypto', label: 'Cryptocurrency should be legalized in India', icon: '💰', category: 'Technology' },
  { id: '5g', label: '5G will transform India more than any policy', icon: '📡', category: 'Technology' },
  // Business & Career
  { id: 'remote', label: 'Remote work is the future', icon: '🏠', category: 'Business' },
  { id: 'startup', label: 'Startups vs Corporate jobs for freshers', icon: '🚀', category: 'Career' },
  { id: 'wlb', label: 'Work-life balance is a myth in India', icon: '⚖️', category: 'Business' },
  { id: 'mba', label: 'MBA is overrated in todays world', icon: '🎓', category: 'Career' },
  { id: 'intern', label: 'Internships matter more than grades', icon: '💼', category: 'Career' },
  // Social
  { id: 'social', label: 'Social media does more harm than good', icon: '📱', category: 'Social' },
  { id: 'cricket', label: 'Cricket gets too much attention in India', icon: '🏏', category: 'Social' },
  { id: 'brain', label: 'Brain drain is a loss for India', icon: '🧠', category: 'Social' },
  { id: 'gender', label: 'Gender diversity improves team performance', icon: '🤝', category: 'Social' },
  { id: 'urban', label: 'Urbanization causes more problems than it solves', icon: '🏙️', category: 'Social' },
  // Education
  { id: 'online', label: 'Online education vs Traditional education', icon: '📚', category: 'Education' },
  { id: 'eng', label: 'English should be the medium of instruction', icon: '🗣️', category: 'Education' },
  { id: 'exam', label: 'Exams are not the best way to test talent', icon: '📝', category: 'Education' },
  // Environment
  { id: 'climate', label: 'Individual action can solve climate change', icon: '🌍', category: 'Environment' },
  { id: 'veg', label: 'Vegetarianism is the only ethical diet', icon: '🥗', category: 'Environment' },
]

const PERSONAS = [
  {
    key: 'arjun', name: 'Arjun', role: 'Agreeer', color: '#6c63ff', bg: '#f0eeff',
    photo: 'https://randomuser.me/api/portraits/men/32.jpg',
    voiceConfig: { pitch: 0.95, rate: 0.92, gender: 'male', preferredVoice: ['Daniel', 'Google UK English Male', 'Alex', 'Fred'] }
  },
  {
    key: 'priya', name: 'Priya', role: "Devil's Advocate", color: '#ef4444', bg: '#fff0f0',
    photo: 'https://randomuser.me/api/portraits/women/44.jpg',
    voiceConfig: { pitch: 1.25, rate: 0.88, gender: 'female', preferredVoice: ['Samantha', 'Google UK English Female', 'Victoria', 'Karen'] }
  },
  {
    key: 'ravi', name: 'Ravi', role: 'Analyst', color: '#f59e0b', bg: '#fffbeb',
    photo: 'https://randomuser.me/api/portraits/men/75.jpg',
    voiceConfig: { pitch: 0.80, rate: 0.85, gender: 'male', preferredVoice: ['Google US English', 'Google IN English', 'Rishi', 'Aaron'] }
  },
]

const GD_TIME = 300 // 5 minutes

function getScoreColor(s) {
  return s >= 8 ? '#22c55e' : s >= 6 ? '#f59e0b' : '#ef4444'
}

function Timer({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds)
  const ref = useRef(null)
  useEffect(() => {
    ref.current = setInterval(() => {
      setLeft(p => { if (p <= 1) { clearInterval(ref.current); onExpire(); return 0 } return p - 1 })
    }, 1000)
    return () => clearInterval(ref.current)
  }, [])
  const m = Math.floor(left / 60), s = left % 60
  const pct = (left / seconds) * 100
  const color = left > 120 ? '#22c55e' : left > 60 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <svg width="36" height="36" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="18" cy="18" r="14" fill="none" stroke="#2a2a3e" strokeWidth="3" />
        <circle cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${2 * Math.PI * 14}`}
          strokeDashoffset={`${2 * Math.PI * 14 * (1 - pct / 100)}`}
          style={{ transition: 'stroke-dashoffset 1s linear' }} />
      </svg>
      <span style={{ color, fontWeight: '900', fontSize: '13px' }}>{m}:{s.toString().padStart(2,'0')}</span>
    </div>
  )
}

function ScoreBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', fontWeight: '700', color: '#555' }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: '900', color }}>{value}/10</span>
      </div>
      <div style={{ background: '#f3f4f6', borderRadius: '100px', height: '7px', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: '100px', background: color, width: `${value * 10}%`, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

export default function GDScreen({ onBack }) {
  const [phase, setPhase] = useState('topics') // topics | briefing | gd | result
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(null) // persona key
  const [waveBars, setWaveBars] = useState(Array.from({ length: 16 }, () => 4))
  const [result, setResult] = useState(null)
  const [timeUp, setTimeUp] = useState(false)
  const [turnCount, setTurnCount] = useState(0)
  const bottomRef = useRef(null)
  const audioRef = useRef(null)
  const waveRef = useRef(null)
  const recognitionRef = useRef(null)
  const historyRef = useRef([])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const stopSpeaking = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    window.speechSynthesis?.cancel()
    setSpeaking(null)
    clearInterval(waveRef.current)
    setWaveBars(Array.from({ length: 16 }, () => 4))
  }

  const speakAs = (text, personaKey) => {
    stopSpeaking()
    setSpeaking(personaKey)
    waveRef.current = setInterval(() => {
      setWaveBars(Array.from({ length: 16 }, () => Math.floor(4 + Math.random() * 24)))
    }, 110)

    const persona = PERSONAS.find(p => p.key === personaKey)
    const vc = persona?.voiceConfig || { pitch: 1, rate: 0.9 }

    const synth = window.speechSynthesis
    // voices may not be loaded yet — wait if needed
    const doSpeak = () => {
      const voices = synth.getVoices()
      let chosen = null
      // try preferred voices in order
      for (const name of (vc.preferredVoice || [])) {
        chosen = voices.find(v => v.name.includes(name))
        if (chosen) break
      }
      // fallback: any voice matching gender lang
      if (!chosen) {
        chosen = voices.find(v =>
          v.lang.startsWith('en') &&
          (vc.gender === 'female' ? v.name.match(/female|woman|girl|samantha|victoria|karen|susan/i) : v.name.match(/male|man|daniel|alex|fred|rishi|aaron/i))
        )
      }
      // last fallback: any English voice
      if (!chosen) chosen = voices.find(v => v.lang.startsWith('en'))

      const u = new window.SpeechSynthesisUtterance(text)
      if (chosen) u.voice = chosen
      u.pitch = vc.pitch ?? 1
      u.rate = vc.rate ?? 0.9
      u.lang = 'en-IN'
      u.onend = () => { stopSpeaking() }
      u.onerror = () => { stopSpeaking() }
      synth.speak(u)
    }

    if (synth.getVoices().length === 0) {
      synth.onvoiceschanged = () => { synth.onvoiceschanged = null; doSpeak() }
    } else {
      doSpeak()
    }
  }

  const startGD = async () => {
    setPhase('gd')
    setLoading(true)
    try {
      const res = await fetch('/api/gd/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic.label,
          history: [],
          userMessage: 'Start the GD with an opening statement to kick off the discussion.',
          speaker: 'ravi'
        })
      })
      const data = await res.json()
      const opening = data.reply
      const msg = { role: 'ravi', name: 'Ravi', content: opening, isAI: true }
      setMessages([msg])
      historyRef.current = [{ role: 'assistant', content: `Ravi: ${opening}` }]
      speakAs(opening, 'ravi')
    } catch (err) {
      console.error('startGD error:', err)
      const opening = `Let's begin our Group Discussion on "${selectedTopic.label}". Who would like to share their opening thoughts?`
      const msg = { role: 'ravi', name: 'Ravi', content: opening, isAI: true }
      setMessages([msg])
      historyRef.current = [{ role: 'assistant', content: `Ravi: ${opening}` }]
    } finally {
      setLoading(false)
    }
  }

  const getNextSpeaker = (turn) => {
    const order = ['arjun', 'priya', 'ravi']
    return order[turn % 3]
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userText = input.trim()
    setInput('')

    const userMsg = { role: 'user', name: 'You', content: userText, isAI: false }
    setMessages(prev => [...prev, userMsg])
    historyRef.current.push({ role: 'user', content: userText })
    setLoading(true)

    const newTurn = turnCount + 1
    setTurnCount(newTurn)

    // Pick which AI responds
    const speakerKey = getNextSpeaker(newTurn)
    const persona = PERSONAS.find(p => p.key === speakerKey)

    try {
      const res = await fetch('/api/gd/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic.label,
          history: historyRef.current.slice(-8),
          userMessage: userText,
          speaker: speakerKey
        })
      })
      const data = await res.json()
      const aiMsg = { role: speakerKey, name: persona.name, content: data.reply, isAI: true }
      setMessages(prev => [...prev, aiMsg])
      historyRef.current.push({ role: 'assistant', content: `${persona.name}: ${data.reply}` })
      setLoading(false)
      await speakAs(data.reply, speakerKey)

      // Every 2 turns, a second AI chimes in naturally
      if (newTurn % 2 === 0) {
        const speakerKey2 = getNextSpeaker(newTurn + 1)
        const persona2 = PERSONAS.find(p => p.key === speakerKey2)
        // small delay so it feels natural
        await new Promise(r => setTimeout(r, 800))
        setLoading(true)
        const res2 = await fetch('/api/gd/chime', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: selectedTopic.label,
            history: historyRef.current.slice(-4),
            lastAIMessage: data.reply,
            speaker: speakerKey2
          })
        })
        const data2 = await res2.json()
        const aiMsg2 = { role: speakerKey2, name: persona2.name, content: data2.reply, isAI: true }
        setMessages(prev => [...prev, aiMsg2])
        historyRef.current.push({ role: 'assistant', content: `${persona2.name}: ${data2.reply}` })
        setLoading(false)
        speakAs(data2.reply, speakerKey2)
      }
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const handleTimeUp = () => {
    setTimeUp(true)
    evaluateGD()
  }

  const evaluateGD = async () => {
    stopSpeaking()
    setLoading(true)
    const transcript = messages.map(m => `${m.name}: ${m.content}`).join('\n')
    try {
      const res = await fetch('/api/gd/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: selectedTopic.label, transcript })
      })
      const data = await res.json()
      setResult(data)
      setPhase('result')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Use Chrome'); return }
    const r = new SR()
    r.lang = 'en-IN'; r.interimResults = true; r.continuous = false
    recognitionRef.current = r
    r.onstart = () => setListening(true)
    r.onresult = e => setInput(Array.from(e.results).map(r => r[0].transcript).join(''))
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    r.start()
  }

  // ── TOPIC SELECTION ──────────────────────────────────────
  if (phase === 'topics') return (
    <div style={{ minHeight: '100vh', background: '#f5f7ff', fontFamily: "'Nunito', sans-serif", paddingBottom: '40px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }`}</style>

      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', padding: '48px 20px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'180px', height:'180px', borderRadius:'50%', background:'rgba(108,99,255,0.15)' }} />
        <div style={{ maxWidth: '480px', margin: '0 auto', position: 'relative' }}>
          <button onClick={onBack} style={{ width:'36px', height:'36px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.1)', color:'#fff', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'20px' }}>←</button>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '900', margin: '0 0 6px' }}>💬 GD Simulator</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>Practice with 3 AI participants in a real GD</p>
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '-48px auto 0', padding: '0 16px', position: 'relative', zIndex: 1 }}>

        {/* Participants preview */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '18px', marginBottom: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <p style={{ margin: '0 0 12px', fontWeight: '800', fontSize: '13px', color: '#888' }}>YOUR GD PANEL</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PERSONAS.map(p => (
              <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: p.bg, borderRadius: '14px', border: `1.5px solid ${p.color}22` }}>
                <img src={p.photo} alt={p.name} style={{ width:'48px', height:'48px', borderRadius:'14px', objectFit:'cover' }} onError={e => { e.target.outerHTML = '<span style="fontSize:28px">👤</span>' }} />
                <div>
                  <div style={{ fontWeight: '900', fontSize: '14px', color: '#1a1a2e' }}>{p.name}</div>
                  <div style={{ color: p.color, fontSize: '11px', fontWeight: '700' }}>{p.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Topic grid */}
        <p style={{ margin: '0 0 12px 4px', fontWeight: '800', fontSize: '15px', color: '#1a1a2e' }}>Choose a Topic</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {GD_TOPICS.map(t => (
            <button key={t.id} onClick={() => setSelectedTopic(t)} style={{
              padding: '16px 18px', borderRadius: '16px', border: 'none', textAlign: 'left',
              background: selectedTopic?.id === t.id ? 'linear-gradient(135deg, #1a1a2e, #16213e)' : '#fff',
              boxShadow: selectedTopic?.id === t.id ? '0 4px 20px rgba(108,99,255,0.25)' : '0 2px 10px rgba(0,0,0,0.05)',
              cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
              display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s'
            }}>
              <span style={{ fontSize: '24px' }}>{t.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '800', fontSize: '14px', color: selectedTopic?.id === t.id ? '#fff' : '#1a1a2e' }}>{t.label}</div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: selectedTopic?.id === t.id ? 'rgba(255,255,255,0.6)' : '#aaa', marginTop: '2px' }}>{t.category}</div>
              </div>
              {selectedTopic?.id === t.id && <span style={{ color: '#6c63ff', fontSize: '18px' }}>✓</span>}
            </button>
          ))}
        </div>

        <button onClick={() => selectedTopic && setPhase('briefing')} style={{
          width: '100%', padding: '16px', borderRadius: '16px',
          background: selectedTopic ? 'linear-gradient(135deg, #6c63ff, #8b5cf6)' : '#e5e7eb',
          border: 'none', color: '#fff', fontWeight: '900', fontSize: '15px',
          cursor: selectedTopic ? 'pointer' : 'not-allowed', fontFamily: 'Nunito, sans-serif',
          boxShadow: selectedTopic ? '0 4px 20px rgba(108,99,255,0.35)' : 'none'
        }}>Start GD →</button>
      </div>
    </div>
  )

  // ── BRIEFING ──────────────────────────────────────
  if (phase === 'briefing') return (
    <div style={{ minHeight: '100vh', background: '#f5f7ff', fontFamily: "'Nunito', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');`}</style>
      <div style={{ maxWidth: '420px', width: '100%' }}>
        <div style={{ background: '#fff', borderRadius: '24px', padding: '28px', boxShadow: '0 8px 40px rgba(0,0,0,0.10)', marginBottom: '16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>{selectedTopic.icon}</div>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '900', color: '#1a1a2e' }}>"{selectedTopic.label}"</h3>
            <span style={{ background: '#f3f4f6', borderRadius: '100px', padding: '3px 12px', fontSize: '11px', fontWeight: '700', color: '#888' }}>{selectedTopic.category}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {[
              ['⏱️', '5 minute discussion'],
              ['🎭', '3 AI participants will respond to you'],
              ['🗣️', 'Speak or type your points clearly'],
              ['📊', 'Get scored on leadership, clarity & logic'],
              ['💡', 'Tip: initiate early, give structured points'],
            ].map(([icon, text], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#f8f7ff', borderRadius: '10px' }}>
                <span style={{ fontSize: '16px' }}>{icon}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#555' }}>{text}</span>
              </div>
            ))}
          </div>
          <button onClick={startGD} style={{
            width: '100%', padding: '16px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
            border: 'none', color: '#fff', fontWeight: '900', fontSize: '15px',
            cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
            boxShadow: '0 4px 20px rgba(108,99,255,0.35)'
          }}>🎤 Start Discussion</button>
        </div>
        <button onClick={() => setPhase('topics')} style={{ width: '100%', background: 'none', border: 'none', color: '#aaa', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'Nunito,sans-serif' }}>← Change topic</button>
      </div>
    </div>
  )

  // ── RESULT ──────────────────────────────────────
  if (phase === 'result') return (
    <div style={{ minHeight: '100vh', background: '#f5f7ff', fontFamily: "'Nunito', sans-serif", paddingBottom: '40px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }`}</style>

      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', padding: '48px 20px 80px' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: '900', margin: '0 0 4px' }}>💬 GD Report</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>{selectedTopic.label}</p>
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '-48px auto 0', padding: '0 16px', position: 'relative', zIndex: 1, animation: 'fadeIn 0.4s ease' }}>

        {/* Overall + verdict */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '22px', marginBottom: '14px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <div style={{ width: '90px', height: '90px', borderRadius: '50%', margin: '0 auto 14px', border: `4px solid ${getScoreColor(result?.overall)}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontWeight: '900', fontSize: '28px', color: getScoreColor(result?.overall), lineHeight: 1 }}>{result?.overall}</div>
            <div style={{ color: '#aaa', fontSize: '10px', fontWeight: '700' }}>/ 10</div>
          </div>
          <p style={{ margin: '0 0 8px', fontWeight: '800', fontSize: '15px', color: '#1a1a2e' }}>{result?.verdict}</p>
          <div style={{ display: 'inline-block', background: `${getScoreColor(result?.overall)}15`, border: `1px solid ${getScoreColor(result?.overall)}33`, borderRadius: '100px', padding: '4px 16px' }}>
            <span style={{ color: getScoreColor(result?.overall), fontWeight: '800', fontSize: '12px' }}>
              {result?.overall >= 8 ? '🏆 Excellent' : result?.overall >= 6 ? '👍 Good' : '📈 Keep Practicing'}
            </span>
          </div>
        </div>

        {/* Score bars */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '22px', marginBottom: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p style={{ margin: '0 0 16px', fontWeight: '800', fontSize: '14px', color: '#1a1a2e' }}>Performance Breakdown</p>
          <ScoreBar label="🎯 Leadership" value={result?.leadership} color={getScoreColor(result?.leadership)} />
          <ScoreBar label="💬 Clarity" value={result?.clarity} color={getScoreColor(result?.clarity)} />
          <ScoreBar label="🧠 Logic" value={result?.logic} color={getScoreColor(result?.logic)} />
          <ScoreBar label="💪 Confidence" value={result?.confidence} color={getScoreColor(result?.confidence)} />
          <ScoreBar label="🙋 Participation" value={result?.participation} color={getScoreColor(result?.participation)} />
        </div>

        {/* Strength + Weakness */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '16px', padding: '14px' }}>
            <p style={{ margin: '0 0 6px', color: '#059669', fontSize: '10px', fontWeight: '800' }}>✅ STRENGTH</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#1a1a2e', fontWeight: '700', lineHeight: '1.5' }}>{result?.strength}</p>
          </div>
          <div style={{ background: '#fff9f9', border: '1.5px solid #fca5a5', borderRadius: '16px', padding: '14px' }}>
            <p style={{ margin: '0 0 6px', color: '#ef4444', fontSize: '10px', fontWeight: '800' }}>⚠️ IMPROVE</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#1a1a2e', fontWeight: '700', lineHeight: '1.5' }}>{result?.weakness}</p>
          </div>
        </div>

        {/* Tip */}
        <div style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1.5px solid #fde68a', borderRadius: '16px', padding: '16px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>💡</span>
          <div>
            <p style={{ margin: '0 0 3px', color: '#b45309', fontSize: '10px', fontWeight: '800' }}>TIP FOR NEXT GD</p>
            <p style={{ margin: 0, color: '#92400e', fontSize: '13px', lineHeight: '1.5' }}>{result?.tip}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => { setPhase('topics'); setMessages([]); setResult(null); setTurnCount(0); setTimeUp(false) }} style={{
            flex: 1, padding: '14px', borderRadius: '14px',
            background: 'none', border: '2px solid #6c63ff', color: '#6c63ff',
            fontWeight: '800', fontSize: '13px', cursor: 'pointer', fontFamily: 'Nunito,sans-serif'
          }}>🔄 New GD</button>
          <button onClick={onBack} style={{
            flex: 1, padding: '14px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
            border: 'none', color: '#fff', fontWeight: '800', fontSize: '13px',
            cursor: 'pointer', fontFamily: 'Nunito,sans-serif'
          }}>🏠 Home</button>
        </div>
      </div>
    </div>
  )

  // ── MAIN GD CHAT ──────────────────────────────────────
  const userName = localStorage.getItem('englishtalk_name') || 'You'

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', maxWidth:'680px', margin:'0 auto', background:'#0f0f13', fontFamily:"'Nunito', sans-serif", overflow:'hidden', position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:'100%' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes speakPulse { 0%,100%{box-shadow:0 0 0 0 rgba(108,99,255,0.4)} 50%{box-shadow:0 0 0 8px rgba(108,99,255,0)} }
        @keyframes greenPulse { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)} 50%{box-shadow:0 0 0 10px rgba(34,197,94,0)} }
      `}</style>

      {/* Header */}
      <div style={{ padding:'10px 16px', borderBottom:'1px solid #1e1e2e', background:'#0a0a10', display:'flex', alignItems:'center', gap:'10px' }}>
        <button onClick={onBack} style={{ width:'32px', height:'32px', borderRadius:'8px', border:'1px solid #2a2a3e', background:'#1e1e2e', color:'#fff', cursor:'pointer', fontSize:'13px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>←</button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:'800', fontSize:'12px', color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>💬 {selectedTopic?.label}</div>
          <div style={{ color:'#22c55e', fontSize:'10px', fontWeight:'700' }}>● Live GD · {turnCount} exchange{turnCount !== 1 ? 's' : ''}</div>
        </div>
        {!timeUp && <Timer seconds={GD_TIME} onExpire={handleTimeUp} />}
        {turnCount >= 3 && !timeUp && (
          <button onClick={evaluateGD} style={{ background:'linear-gradient(135deg, #6c63ff, #8b5cf6)', border:'none', borderRadius:'8px', padding:'6px 10px', color:'#fff', fontWeight:'800', fontSize:'11px', cursor:'pointer', fontFamily:'Nunito,sans-serif', flexShrink:0 }}>End ✓</button>
        )}
      </div>

      {/* VIDEO CALL GRID — 4 participant cards */}
      <div style={{ padding:'12px', background:'#0a0a10', borderBottom:'1px solid #1e1e2e' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'8px' }}>
          {/* AI Participants */}
          {PERSONAS.map(p => {
            const isSpeaking = speaking === p.key
            const lastMsg = [...messages].reverse().find(m => m.role === p.key)
            return (
              <div key={p.key} style={{
                borderRadius:'14px', overflow:'hidden', position:'relative',
                border: isSpeaking ? `2px solid ${p.color}` : '2px solid #1e1e2e',
                transition:'all 0.3s',
                animation: isSpeaking ? 'speakPulse 1.5s infinite' : 'none',
                background: '#1a1a2e'
              }}>
                {/* Avatar image */}
                <div style={{ position:'relative', paddingBottom:'100%', background: p.bg }}>
                  <img src={p.photo} alt={p.name}
                    style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
                    onError={e => { e.target.style.display='none' }}
                  />
                  {/* Speaking waveform overlay */}
                  {isSpeaking && (
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent, rgba(0,0,0,0.8))', padding:'4px 6px', display:'flex', alignItems:'flex-end', gap:'1.5px', height:'40px', justifyContent:'center' }}>
                      {waveBars.slice(0,8).map((h,i) => (
                        <div key={i} style={{ width:'2.5px', borderRadius:'2px', background:p.color, height:`${Math.min(h*0.7+3,28)}px`, transition:'height 0.1s' }} />
                      ))}
                    </div>
                  )}
                  {/* Mic icon */}
                  <div style={{ position:'absolute', top:'4px', right:'4px', width:'16px', height:'16px', borderRadius:'50%', background: isSpeaking ? p.color : '#333', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'8px' }}>
                    {isSpeaking ? '🔊' : '🎤'}
                  </div>
                </div>
                {/* Name bar */}
                <div style={{ padding:'4px 6px', background:'#0f0f13' }}>
                  <div style={{ fontSize:'9px', fontWeight:'900', color: isSpeaking ? p.color : '#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                  <div style={{ fontSize:'8px', color:'#555', fontWeight:'600' }}>{p.role}</div>
                </div>
              </div>
            )
          })}

          {/* YOU card */}
          <div style={{
            borderRadius:'14px', overflow:'hidden', position:'relative',
            border: listening ? '2px solid #22c55e' : '2px solid #2a2a3e',
            background:'#1a1a2e',
            animation: listening ? 'greenPulse 1s infinite' : 'none',
            transition:'all 0.3s'
          }}>
            <div style={{ position:'relative', paddingBottom:'100%', background:'linear-gradient(135deg, #1e1e3e, #2a1a4e)' }}>
              {/* User avatar — Indian student illustration */}
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'2px' }}>
                <div style={{ fontSize:'28px' }}>🧑‍💻</div>
                {listening && (
                  <div style={{ display:'flex', gap:'1.5px', alignItems:'flex-end' }}>
                    {Array.from({length:6},(_,i)=>Math.floor(4+Math.random()*16)).map((h,i)=>(
                      <div key={i} style={{ width:'2px', background:'#22c55e', borderRadius:'2px', height:`${h}px` }} />
                    ))}
                  </div>
                )}
              </div>
              <div style={{ position:'absolute', top:'4px', right:'4px', width:'16px', height:'16px', borderRadius:'50%', background: listening ? '#22c55e' : '#333', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'8px' }}>
                {listening ? '🔴' : '🎤'}
              </div>
            </div>
            <div style={{ padding:'4px 6px', background:'#0f0f13' }}>
              <div style={{ fontSize:'9px', fontWeight:'900', color:'#6c63ff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{userName}</div>
              <div style={{ fontSize:'8px', color:'#555', fontWeight:'600' }}>You</div>
            </div>
          </div>
        </div>

        {/* Currently speaking text */}
        {speaking && (
          <div style={{ marginTop:'8px', background:'#1e1e2e', borderRadius:'10px', padding:'6px 12px', display:'flex', alignItems:'center', gap:'8px' }}>
            {(() => { const p = PERSONAS.find(x=>x.key===speaking); return (
              <>
                <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:p?.color, animation:'speakPulse 1s infinite' }} />
                <span style={{ color:p?.color, fontSize:'11px', fontWeight:'800' }}>{p?.name} is speaking...</span>
              </>
            )})()}
          </div>
        )}
      </div>

      {/* Chat messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px' }}>
        {messages.map((msg, i) => {
          const persona = PERSONAS.find(p => p.key === msg.role)
          const isLatest = i === messages.length - 1
          return (
            <div key={i} style={{ marginBottom:'10px', display:'flex', flexDirection: msg.isAI ? 'row' : 'row-reverse', gap:'8px', alignItems:'flex-start', animation: isLatest ? 'fadeIn 0.3s ease' : 'none' }}>
              {/* Small avatar */}
              <div style={{ width:'28px', height:'28px', borderRadius:'8px', flexShrink:0, overflow:'hidden', background: msg.isAI ? (persona?.bg || '#1e1e2e') : 'linear-gradient(135deg,#6c63ff,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {msg.isAI && persona?.photo
                  ? <img src={persona.photo} alt={persona.name} style={{ width:'28px', height:'28px', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
                  : msg.isAI ? '🤖' : <span style={{fontSize:'14px'}}>🧑‍💻</span>
                }
              </div>
              <div style={{ maxWidth:'78%' }}>
                <div style={{ fontSize:'9px', fontWeight:'800', color: msg.isAI ? (persona?.color||'#aaa') : '#6c63ff', marginBottom:'3px', textAlign: msg.isAI ? 'left' : 'right' }}>
                  {msg.name} {msg.isAI ? `· ${persona?.role||''}` : '· You'}
                </div>
                <div style={{ padding:'8px 12px', borderRadius: msg.isAI ? '3px 12px 12px 12px' : '12px 3px 12px 12px', background: msg.isAI ? '#1e1e2e' : 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color:'#fff', fontSize:'12px', lineHeight:'1.6', fontWeight:'500' }}>
                  {msg.content}
                </div>
              </div>
            </div>
          )
        })}
        {loading && (
          <div style={{ display:'flex', gap:'8px', alignItems:'center', color:'#444', fontSize:'12px', marginBottom:'10px' }}>
            <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'#1e1e2e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px' }}>💬</div>
            <div style={{ display:'flex', gap:'3px' }}>
              {[0,1,2].map(i=>(
                <div key={i} style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#444', animation:`fadeIn 0.6s ${i*0.2}s infinite alternate` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Listening indicator */}
      {listening && (
        <div style={{ margin:'0 16px 6px', padding:'6px 14px', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:'10px', color:'#22c55e', fontSize:'12px', fontWeight:'700', display:'flex', alignItems:'center', gap:'6px' }}>
          <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#22c55e', animation:'speakPulse 1s infinite' }} />
          Listening... make your point clearly
        </div>
      )}

      {/* Input bar */}
      <div style={{ padding:'10px 16px', borderTop:'1px solid #1e1e2e', display:'flex', gap:'8px', alignItems:'center', background:'#0a0a10' }}>
        <button onClick={listening ? () => recognitionRef.current?.stop() : startListening} style={{ width:'44px', height:'44px', borderRadius:'12px', border: listening ? '1px solid #22c55e' : '1px solid #2a2a3e', background: listening ? 'rgba(34,197,94,0.15)' : '#1e1e2e', color: listening ? '#22c55e' : '#888', cursor:'pointer', fontSize:'18px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{listening ? '⏹' : '🎤'}</button>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMessage()}
          placeholder="Make your point in the GD..."
          style={{ flex:1, padding:'11px 14px', borderRadius:'12px', border:'1px solid #2a2a3e', background:'#1e1e2e', color:'#fff', fontSize:'13px', outline:'none', fontFamily:'Nunito,sans-serif' }}
          onFocus={e=>e.target.style.border='1px solid #6c63ff'}
          onBlur={e=>e.target.style.border='1px solid #2a2a3e'}
        />
        <button onClick={sendMessage} disabled={loading||!input.trim()} style={{ width:'44px', height:'44px', borderRadius:'12px', border:'none', flexShrink:0, background: loading||!input.trim() ? '#2a2a3e' : 'linear-gradient(135deg,#6c63ff,#8b5cf6)', color:'#fff', fontSize:'18px', cursor: loading||!input.trim() ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>➤</button>
      </div>
    </div>
  )
}