import { useState, useEffect, useRef } from 'react'

const PERSONAS = [
  { id: 'recruiter', name: 'Priya Sharma', role: 'HR Recruiter · TCS', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', color: '#6c63ff', desc: 'Campus placement HR round', duration: '8 min' },
  { id: 'tech_interviewer', name: 'Rahul Verma', role: 'Senior Engineer · Google', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', color: '#06b6d4', desc: 'Technical phone screen', duration: '10 min' },
  { id: 'english_coach', name: 'Sarah Mitchell', role: 'English Coach · British Council', avatar: 'https://randomuser.me/api/portraits/women/29.jpg', color: '#10b981', desc: 'Conversational English practice', duration: '7 min' },
  { id: 'manager', name: 'Vikram Nair', role: 'Engg Manager · Infosys', avatar: 'https://randomuser.me/api/portraits/men/75.jpg', color: '#f59e0b', desc: 'Managerial round interview', duration: '8 min' },
]

function getScoreColor(s) { return s >= 8 ? '#22c55e' : s >= 6 ? '#f59e0b' : '#ef4444' }

function ScoreRing({ value, label, color }) {
  const r = 24, circ = 2 * Math.PI * r
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
      <div style={{ position:'relative', width:'60px', height:'60px' }}>
        <svg width="60" height="60" style={{ transform:'rotate(-90deg)' }}>
          <circle cx="30" cy="30" r={r} fill="none" stroke="#1e1e2e" strokeWidth="4" />
          <circle cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={`${(value/10)*circ} ${circ}`} strokeLinecap="round"
            style={{ transition:'stroke-dasharray 1s ease' }} />
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'900', fontSize:'15px', color }}>{value}</div>
      </div>
      <span style={{ color:'#666', fontSize:'10px', fontWeight:'700' }}>{label}</span>
    </div>
  )
}

export default function AICallScreen({ onBack }) {
  const [phase, setPhase] = useState('select') // select | calling | connected | summary
  const [selectedPersona, setSelectedPersona] = useState(null)
  const [callTime, setCallTime] = useState(0)
  const [history, setHistory] = useState([])
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [userSpeaking, setUserSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('') // last user speech
  const [aiText, setAiText] = useState('')
  const [waveBars, setWaveBars] = useState(Array.from({length:20},()=>4))
  const [result, setResult] = useState(null)
  const [callLog, setCallLog] = useState([])
  const [muted, setMuted] = useState(false)

  const timerRef = useRef(null)
  const waveRef = useRef(null)
  const audioRef = useRef(null)
  const recognitionRef = useRef(null)
  const historyRef = useRef([])

  // Call timer
  useEffect(() => {
    if (phase === 'connected') {
      timerRef.current = setInterval(() => setCallTime(t => t + 1), 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [phase])

  // Wave animation
  useEffect(() => {
    if (aiSpeaking || userSpeaking) {
      waveRef.current = setInterval(() => {
        setWaveBars(Array.from({length:20}, () => Math.floor(4 + Math.random() * 32)))
      }, 100)
    } else {
      clearInterval(waveRef.current)
      setWaveBars(Array.from({length:20}, ()=>4))
    }
    return () => clearInterval(waveRef.current)
  }, [aiSpeaking, userSpeaking])

  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  const stopAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    setAiSpeaking(false)
  }

  const speakAI = async (text) => {
    stopAudio()
    setAiSpeaking(true)
    setAiText(text)
    try {
      const res = await fetch('http://localhost:5000/api/call/speak', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      if (!res.ok) throw new Error('TTS failed')
      const blob = await res.blob()
      if (blob.size < 1000) { setAiSpeaking(false); return } // not a real audio file
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.volume = 1.0
      audio.onended = () => { setAiSpeaking(false); URL.revokeObjectURL(url); audioRef.current = null }
      audio.onerror = (e) => { console.error('Audio error:', e); setAiSpeaking(false) }
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.error('Play failed:', e)
          // Autoplay blocked — show a button to manually play
          setAiSpeaking(false)
        })
      }
    } catch(e) { console.error('speakAI error:', e); setAiSpeaking(false) }
  }

  const getAIResponse = async (userText) => {
    const newHistory = [...historyRef.current, { role: 'user', content: userText }]
    historyRef.current = newHistory
    setCallLog(prev => [...prev, { role: 'user', text: userText }])

    try {
      const res = await fetch('http://localhost:5000/api/call/respond', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: selectedPersona.id, history: newHistory, userMessage: userText, level: localStorage.getItem('englishtalk_level') || 'intermediate' })
      })
      const data = await res.json()
      historyRef.current = [...newHistory, { role: 'assistant', content: data.reply }]
      setCallLog(prev => [...prev, { role: 'ai', text: data.reply }])
      await speakAI(data.reply)
    } catch (err) { console.error(err) }
  }

  const startListening = () => {
    if (aiSpeaking) { stopAudio() }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Use Chrome for voice'); return }
    const r = new SR()
    r.lang = 'en-IN'; r.interimResults = true; r.continuous = false
    recognitionRef.current = r
    r.onstart = () => { setListening(true); setUserSpeaking(true) }
    r.onresult = (e) => setTranscript(Array.from(e.results).map(r => r[0].transcript).join(''))
    r.onend = async () => {
      setListening(false); setUserSpeaking(false)
      if (transcript.trim()) { await getAIResponse(transcript); setTranscript('') }
    }
    r.onerror = () => { setListening(false); setUserSpeaking(false) }
    r.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false); setUserSpeaking(false)
  }

  const startCall = async (persona) => {
    if (persona) setSelectedPersona(persona)
    setPhase('calling')
    historyRef.current = []
    setCallLog([])
    setCallTime(0)

    // Unlock audio context on user gesture
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (AudioContext) {
        const ctx = new AudioContext()
        await ctx.resume()
        ctx.close()
      }
    } catch(e) {}

    // Simulate ringing for 2.5s
    await new Promise(r => setTimeout(r, 2500))
    setPhase('connected')

    // AI speaks first
    try {
      const activePersona = persona || selectedPersona
      const res = await fetch('http://localhost:5000/api/call/respond', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: activePersona.id, history: [],
          userMessage: 'Start the call with a greeting and your first question.'
        })
      })
      const data = await res.json()
      historyRef.current = [{ role: 'assistant', content: data.reply }]
      setCallLog([{ role: 'ai', text: data.reply }])
      await speakAI(data.reply)
    } catch (err) { console.error(err) }
  }

  const endCall = async () => {
    stopAudio()
    recognitionRef.current?.stop()
    clearInterval(timerRef.current)
    setPhase('summary')

    const transcriptText = callLog.map(l => `${l.role === 'ai' ? selectedPersona.name : 'Student'}: ${l.text}`).join('\n')

    try {
      const res = await fetch('http://localhost:5000/api/call/evaluate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: selectedPersona.id, transcript: transcriptText })
      })
      const data = await res.json()
      setResult(data)
    } catch (err) { console.error(err) }
  }

  // ── SELECT SCREEN ──
  if (phase === 'select') return (
    <div style={{ minHeight:'100vh', background:'#f7f7fb', fontFamily:"'Nunito',sans-serif", paddingBottom:'40px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');`}</style>

      <div style={{ background:'linear-gradient(135deg,#1a0533,#0f0f13)', padding:'52px 20px 80px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'180px', height:'180px', borderRadius:'50%', background:'rgba(108,99,255,0.2)', filter:'blur(40px)' }} />
        <div style={{ maxWidth:'480px', margin:'0 auto', position:'relative' }}>
          <button onClick={onBack} style={{ width:'36px', height:'36px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.1)', color:'#fff', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'20px' }}>←</button>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'6px' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:'linear-gradient(135deg,#6c63ff,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px' }}>🎧</div>
            <div>
              <h2 style={{ color:'#fff', fontSize:'22px', fontWeight:'900', margin:0 }}>AI Voice Calls</h2>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'12px', margin:0 }}>Practice speaking with AI interviewers</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:'480px', margin:'-48px auto 0', padding:'0 16px', position:'relative', zIndex:1 }}>
        <p style={{ fontWeight:'900', fontSize:'15px', color:'#1a1a2e', margin:'0 0 12px 4px' }}>Choose who to call</p>
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {PERSONAS.map(p => (
            <div key={p.id} onClick={() => { setSelectedPersona(p); setTimeout(() => startCall(p), 50) }} style={{
              background:'#fff', borderRadius:'20px', padding:'16px',
              boxShadow:'0 2px 12px rgba(0,0,0,0.08)', cursor:'pointer',
              display:'flex', alignItems:'center', gap:'14px',
              border:`1.5px solid transparent`,
              transition:'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.border=`1.5px solid ${p.color}44`}
            onMouseLeave={e => e.currentTarget.style.border='1.5px solid transparent'}
            >
              <div style={{ position:'relative', flexShrink:0 }}>
                <img src={p.avatar} alt={p.name} style={{ width:'60px', height:'60px', borderRadius:'18px', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
                <div style={{ position:'absolute', bottom:'-2px', right:'-2px', width:'16px', height:'16px', borderRadius:'50%', background:'#22c55e', border:'2px solid #fff' }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:'900', fontSize:'15px', color:'#1a1a2e' }}>{p.name}</div>
                <div style={{ color:p.color, fontSize:'11px', fontWeight:'700', marginTop:'2px' }}>{p.role}</div>
                <div style={{ color:'#aaa', fontSize:'11px', marginTop:'3px' }}>{p.desc}</div>
              </div>
              <div style={{ flexShrink:0, textAlign:'right' }}>
                <div style={{ background:`${p.color}15`, color:p.color, borderRadius:'10px', padding:'6px 12px', fontWeight:'800', fontSize:'12px', marginBottom:'4px' }}>📞 Call</div>
                <div style={{ color:'#ccc', fontSize:'10px', fontWeight:'600' }}>~{p.duration}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── CALLING SCREEN ──
  if (phase === 'calling') return (
    <div style={{ height:'100vh', background:'linear-gradient(160deg,#1a0533,#0f0f13)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Nunito',sans-serif", position:'fixed', inset:0, zIndex:200 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes ringPulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.3);opacity:0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ position:'relative', marginBottom:'32px' }}>
        <div style={{ position:'absolute', inset:'-20px', borderRadius:'50%', background:`${selectedPersona.color}33`, animation:'ringPulse 1.5s infinite' }} />
        <div style={{ position:'absolute', inset:'-40px', borderRadius:'50%', background:`${selectedPersona.color}1a`, animation:'ringPulse 1.5s 0.5s infinite' }} />
        <img src={selectedPersona.avatar} alt={selectedPersona.name} style={{ width:'120px', height:'120px', borderRadius:'50%', objectFit:'cover', border:`4px solid ${selectedPersona.color}`, position:'relative' }} onError={e=>e.target.style.display='none'} />
      </div>

      <h2 style={{ color:'#fff', fontSize:'24px', fontWeight:'900', margin:'0 0 6px', animation:'fadeIn 0.5s ease' }}>{selectedPersona.name}</h2>
      <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'14px', margin:'0 0 8px' }}>{selectedPersona.role}</p>
      <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'13px', margin:'0 0 60px' }}>Calling...</p>

      {/* Ringing dots */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'60px' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width:'8px', height:'8px', borderRadius:'50%', background:selectedPersona.color, animation:`ringPulse 1s ${i*0.3}s infinite` }} />
        ))}
      </div>

      <button onClick={() => setPhase('select')} style={{
        width:'64px', height:'64px', borderRadius:'50%', background:'#ef4444',
        border:'none', cursor:'pointer', fontSize:'28px',
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 4px 20px rgba(239,68,68,0.4)'
      }}>📵</button>
      <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'12px', marginTop:'10px' }}>Decline</p>
    </div>
  )

  // ── CONNECTED CALL SCREEN ──
  if (phase === 'connected') return (
    <div style={{ height:'100vh', background:'linear-gradient(160deg,#1a0533,#0f0f13)', display:'flex', flexDirection:'column', alignItems:'center', fontFamily:"'Nunito',sans-serif", position:'fixed', inset:0, zIndex:200, overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
      `}</style>

      {/* Call header */}
      <div style={{ width:'100%', maxWidth:'480px', padding:'52px 24px 20px', textAlign:'center' }}>
        <p style={{ color:'#22c55e', fontSize:'12px', fontWeight:'800', margin:'0 0 4px', letterSpacing:'1px' }}>● CONNECTED</p>
        <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'13px', margin:0, fontWeight:'600' }}>{formatTime(callTime)}</p>
      </div>

      {/* AI Avatar */}
      <div style={{ position:'relative', marginBottom:'20px' }}>
        {aiSpeaking && (
          <>
            <div style={{ position:'absolute', inset:'-16px', borderRadius:'50%', background:`${selectedPersona.color}33`, animation:'pulse 1s infinite' }} />
            <div style={{ position:'absolute', inset:'-32px', borderRadius:'50%', background:`${selectedPersona.color}15`, animation:'pulse 1s 0.3s infinite' }} />
          </>
        )}
        <img src={selectedPersona.avatar} alt={selectedPersona.name}
          style={{ width:'110px', height:'110px', borderRadius:'50%', objectFit:'cover', border:`3px solid ${aiSpeaking ? selectedPersona.color : 'rgba(255,255,255,0.2)'}`, position:'relative', transition:'border 0.3s' }}
          onError={e=>e.target.style.display='none'}
        />
      </div>

      <h2 style={{ color:'#fff', fontSize:'20px', fontWeight:'900', margin:'0 0 4px' }}>{selectedPersona.name}</h2>
      <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'12px', margin:'0 0 20px' }}>{selectedPersona.role}</p>

      {/* Waveform */}
      <div style={{ width:'240px', height:'48px', display:'flex', alignItems:'center', justifyContent:'center', gap:'3px', marginBottom:'16px' }}>
        {waveBars.map((h,i) => (
          <div key={i} style={{
            width:'3px', borderRadius:'3px',
            background: userSpeaking ? '#22c55e' : aiSpeaking ? selectedPersona.color : 'rgba(255,255,255,0.15)',
            height:`${h}px`, transition:'height 0.1s ease'
          }} />
        ))}
      </div>

      {/* Status text */}
      <div style={{ height:'48px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'12px' }}>
        {aiSpeaking ? (
          <div style={{ background:`${selectedPersona.color}22`, border:`1px solid ${selectedPersona.color}44`, borderRadius:'12px', padding:'8px 16px', maxWidth:'300px' }}>
            <p style={{ color:selectedPersona.color, fontSize:'12px', fontWeight:'700', margin:0, textAlign:'center', lineHeight:'1.4' }}>{aiText.slice(0,80)}{aiText.length>80?'...':''}</p>
          </div>
        ) : listening ? (
          <div style={{ background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:'12px', padding:'8px 20px' }}>
            <p style={{ color:'#22c55e', fontSize:'12px', fontWeight:'800', margin:0 }}>🔴 Listening... speak now</p>
          </div>
        ) : (
          <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'12px', margin:0 }}>Tap mic to speak your answer</p>
        )}
      </div>

      {/* Transcript preview */}
      {transcript && (
        <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:'12px', padding:'8px 16px', marginBottom:'12px', maxWidth:'300px' }}>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'12px', margin:0, fontStyle:'italic' }}>"{transcript}"</p>
        </div>
      )}

      {/* Call log preview - last exchange */}
      {callLog.length > 0 && !aiSpeaking && !listening && (
        <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:'12px', padding:'10px 16px', marginBottom:'16px', maxWidth:'320px', width:'100%' }}>
          <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'9px', fontWeight:'800', margin:'0 0 4px', letterSpacing:'1px' }}>LAST EXCHANGE</p>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'11px', margin:0, lineHeight:'1.4' }}>
            {callLog[callLog.length-1]?.text?.slice(0,80)}...
          </p>
        </div>
      )}

      {/* Call controls */}
      <div style={{ display:'flex', gap:'24px', alignItems:'center', marginTop:'32px', marginBottom:'40px' }}>
        {/* Mute */}
        <button onClick={() => setMuted(m => !m)} style={{
          width:'52px', height:'52px', borderRadius:'50%',
          background: muted ? '#ef4444' : 'rgba(255,255,255,0.1)',
          border:'none', cursor:'pointer', fontSize:'22px',
          display:'flex', alignItems:'center', justifyContent:'center'
        }}>{muted ? '🔇' : '🔊'}</button>

        {/* Mic - main button */}
        <button onClick={listening ? stopListening : startListening} style={{
          width:'80px', height:'80px', borderRadius:'50%',
          background: listening ? '#22c55e' : aiSpeaking ? 'rgba(255,255,255,0.15)' : 'linear-gradient(135deg,#6c63ff,#8b5cf6)',
          border:'none', cursor:'pointer', fontSize:'32px',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow: listening ? '0 0 0 12px rgba(34,197,94,0.2)' : '0 4px 20px rgba(108,99,255,0.4)',
          transition:'all 0.2s'
        }}>{listening ? '⏹' : '🎤'}</button>

        {/* End call */}
        <button onClick={endCall} style={{
          width:'52px', height:'52px', borderRadius:'50%',
          background:'#ef4444', border:'none', cursor:'pointer', fontSize:'22px',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 4px 16px rgba(239,68,68,0.4)'
        }}>📵</button>
      </div>
    </div>
  )

  // ── SUMMARY SCREEN ──
  if (phase === 'summary') return (
    <div style={{ minHeight:'100vh', background:'#f7f7fb', fontFamily:"'Nunito',sans-serif", paddingBottom:'40px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');`}</style>

      <div style={{ background:'linear-gradient(135deg,#1a0533,#0f0f13)', padding:'52px 20px 80px' }}>
        <div style={{ maxWidth:'480px', margin:'0 auto', textAlign:'center' }}>
          <img src={selectedPersona.avatar} alt={selectedPersona.name} style={{ width:'80px', height:'80px', borderRadius:'50%', objectFit:'cover', border:`3px solid ${selectedPersona.color}`, marginBottom:'12px' }} />
          <h2 style={{ color:'#fff', fontSize:'20px', fontWeight:'900', margin:'0 0 4px' }}>Call Ended</h2>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'13px', margin:'0 0 6px' }}>with {selectedPersona.name}</p>
          <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'12px', margin:0 }}>Duration: {formatTime(callTime)}</p>
        </div>
      </div>

      <div style={{ maxWidth:'480px', margin:'-48px auto 0', padding:'0 16px', position:'relative', zIndex:1 }}>

        {!result ? (
          <div style={{ background:'#fff', borderRadius:'20px', padding:'32px', textAlign:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize:'32px', marginBottom:'12px' }}>⏳</div>
            <p style={{ fontWeight:'800', color:'#1a1a2e', margin:0 }}>Analysing your call...</p>
          </div>
        ) : (
          <>
            {/* Overall score */}
            <div style={{ background:'#fff', borderRadius:'20px', padding:'22px', marginBottom:'12px', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', textAlign:'center' }}>
              <div style={{ width:'90px', height:'90px', borderRadius:'50%', margin:'0 auto 14px', border:`4px solid ${getScoreColor(result.overall)}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <div style={{ fontWeight:'900', fontSize:'28px', color:getScoreColor(result.overall), lineHeight:1 }}>{result.overall}</div>
                <div style={{ color:'#aaa', fontSize:'10px', fontWeight:'700' }}>/10</div>
              </div>
              <p style={{ margin:'0 0 6px', fontWeight:'900', fontSize:'15px', color:'#1a1a2e' }}>{result.verdict}</p>
              <div style={{ display:'inline-block', background:`${getScoreColor(result.overall)}15`, border:`1px solid ${getScoreColor(result.overall)}33`, borderRadius:'100px', padding:'4px 16px' }}>
                <span style={{ color:getScoreColor(result.overall), fontWeight:'800', fontSize:'12px' }}>
                  {result.overall >= 8 ? '🏆 Excellent' : result.overall >= 6 ? '👍 Good' : '📈 Keep Practicing'}
                </span>
              </div>
            </div>

            {/* Score rings */}
            <div style={{ background:'#fff', borderRadius:'20px', padding:'20px', marginBottom:'12px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ margin:'0 0 16px', fontWeight:'800', fontSize:'14px', color:'#1a1a2e' }}>Performance</p>
              <div style={{ display:'flex', justifyContent:'space-around' }}>
                <ScoreRing value={result.fluency} label="Fluency" color={getScoreColor(result.fluency)} />
                <ScoreRing value={result.confidence} label="Confidence" color={getScoreColor(result.confidence)} />
                <ScoreRing value={result.grammar} label="Grammar" color={getScoreColor(result.grammar)} />
                <ScoreRing value={result.vocabulary} label="Vocab" color={getScoreColor(result.vocabulary)} />
              </div>
            </div>

            {/* Strength & Improve */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }}>
              <div style={{ background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:'16px', padding:'14px' }}>
                <p style={{ margin:'0 0 6px', color:'#059669', fontSize:'10px', fontWeight:'800' }}>✅ STRENGTH</p>
                <p style={{ margin:0, fontSize:'12px', color:'#1a1a2e', fontWeight:'700', lineHeight:'1.5' }}>{result.strength}</p>
              </div>
              <div style={{ background:'#fff9f9', border:'1.5px solid #fca5a5', borderRadius:'16px', padding:'14px' }}>
                <p style={{ margin:'0 0 6px', color:'#ef4444', fontSize:'10px', fontWeight:'800' }}>⚠️ IMPROVE</p>
                <p style={{ margin:0, fontSize:'12px', color:'#1a1a2e', fontWeight:'700', lineHeight:'1.5' }}>{result.improve}</p>
              </div>
            </div>

            {/* Tip */}
            <div style={{ background:'linear-gradient(135deg,#fffbeb,#fef3c7)', border:'1.5px solid #fde68a', borderRadius:'16px', padding:'16px', marginBottom:'20px', display:'flex', gap:'10px' }}>
              <span style={{ fontSize:'20px' }}>💡</span>
              <div>
                <p style={{ margin:'0 0 3px', color:'#b45309', fontSize:'10px', fontWeight:'800' }}>TIP FOR NEXT CALL</p>
                <p style={{ margin:0, color:'#92400e', fontSize:'13px', lineHeight:'1.5' }}>{result.tip}</p>
              </div>
            </div>

            {/* Call log */}
            <div style={{ background:'#fff', borderRadius:'20px', padding:'18px', marginBottom:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ margin:'0 0 12px', fontWeight:'800', fontSize:'13px', color:'#1a1a2e' }}>📋 Call Transcript</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px', maxHeight:'200px', overflowY:'auto' }}>
                {callLog.map((l,i) => (
                  <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start' }}>
                    <span style={{ fontSize:'10px', fontWeight:'800', color: l.role==='ai' ? selectedPersona.color : '#6c63ff', minWidth:'40px', paddingTop:'2px' }}>
                      {l.role==='ai' ? selectedPersona.name.split(' ')[0] : 'You'}
                    </span>
                    <p style={{ margin:0, fontSize:'12px', color:'#555', lineHeight:'1.5', flex:1 }}>{l.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={() => { setPhase('select'); setResult(null); setCallLog([]) }} style={{
                flex:1, padding:'14px', borderRadius:'14px',
                background:'none', border:'2px solid #6c63ff', color:'#6c63ff',
                fontWeight:'800', fontSize:'13px', cursor:'pointer', fontFamily:'Nunito,sans-serif'
              }}>📞 Call Again</button>
              <button onClick={onBack} style={{
                flex:1, padding:'14px', borderRadius:'14px',
                background:'linear-gradient(135deg,#6c63ff,#8b5cf6)',
                border:'none', color:'#fff', fontWeight:'800', fontSize:'13px',
                cursor:'pointer', fontFamily:'Nunito,sans-serif'
              }}>🏠 Home</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
