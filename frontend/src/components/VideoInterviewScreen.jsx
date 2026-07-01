import { useState, useRef, useEffect } from 'react'

const INTERVIEW_QUESTIONS = [
  { id: 1, question: 'Tell me about yourself.', tip: 'Structure: Present → Past → Future. Keep it under 2 minutes.' },
  { id: 2, question: 'What are your greatest strengths?', tip: 'Give 2-3 strengths with real examples.' },
  { id: 3, question: 'Why do you want to work here?', tip: 'Research the company. Show genuine interest.' },
  { id: 4, question: 'Where do you see yourself in 5 years?', tip: 'Show ambition but stay realistic.' },
  { id: 5, question: 'Tell me about a challenge you faced and how you handled it.', tip: 'Use STAR method: Situation, Task, Action, Result.' },
  { id: 6, question: 'Why should we hire you?', tip: 'Connect your skills directly to what they need.' },
  { id: 7, question: 'What is your biggest weakness?', tip: 'Pick a real weakness, show you are improving it.' },
  { id: 8, question: 'Describe a time you worked in a team.', tip: 'Highlight your specific role and contribution.' },
]

const INTERVIEWERS = [
  { id: 'i1', name: 'Sarah', role: 'HR Manager', photo: 'https://randomuser.me/api/portraits/women/44.jpg', company: 'TCS', color: '#6c63ff' },
  { id: 'i2', name: 'Rahul', role: 'Tech Lead', photo: 'https://randomuser.me/api/portraits/men/32.jpg', company: 'Infosys', color: '#06b6d4' },
  { id: 'i3', name: 'Priya', role: 'Senior Manager', photo: 'https://randomuser.me/api/portraits/women/68.jpg', company: 'Wipro', color: '#10b981' },
]

function getScoreColor(s) { return s >= 8 ? '#22c55e' : s >= 6 ? '#f59e0b' : '#ef4444' }

export default function VideoInterviewScreen({ onBack }) {
  const [phase, setPhase] = useState('setup') // setup | interview | result
  const [selectedInterviewer, setSelectedInterviewer] = useState(INTERVIEWERS[0])
  const [currentQIdx, setCurrentQIdx] = useState(0)
  const [answers, setAnswers] = useState([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [listening, setListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const [result, setResult] = useState(null)
  const [interviewerSpeaking, setInterviewerSpeaking] = useState(false)
  const [timer, setTimer] = useState(0)
  const [timerActive, setTimerActive] = useState(false)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const recognitionRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    return () => {
      stopCamera()
      clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [timerActive])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) {
      console.error('Camera error:', err)
      setCameraError(true)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  const speakText = (text, gender = 'female') => {
    window.speechSynthesis.cancel()
    setInterviewerSpeaking(true)
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-IN'
    u.rate = 0.9
    u.pitch = gender === 'female' ? 1.2 : 0.85
    const voices = window.speechSynthesis.getVoices()
    const v = gender === 'female'
      ? voices.find(v => v.name.match(/samantha|victoria|karen/i)) || voices.find(v => v.lang.startsWith('en'))
      : voices.find(v => v.name.match(/daniel|alex|fred/i)) || voices.find(v => v.lang.startsWith('en'))
    if (v) u.voice = v
    u.onend = () => setInterviewerSpeaking(false)
    u.onerror = () => setInterviewerSpeaking(false)
    window.speechSynthesis.speak(u)
  }

  const startInterview = async () => {
    setPhase('interview')
    await startCamera()
    setTimerActive(true)
    setTimeout(() => {
      const q = INTERVIEW_QUESTIONS[0]
      speakText(q.question, selectedInterviewer.id === 'i2' ? 'male' : 'female')
    }, 1000)
  }

  const startListening = () => {
    window.speechSynthesis.cancel()
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Use Chrome for voice input'); return }
    const r = new SR()
    r.lang = 'en-IN'; r.interimResults = true; r.continuous = true
    recognitionRef.current = r
    r.onstart = () => setListening(true)
    r.onresult = e => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('')
      setCurrentAnswer(transcript)
    }
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    r.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) return
    stopListening()
    setLoading(true)

    const q = INTERVIEW_QUESTIONS[currentQIdx]
    try {
      const res = await fetch('http://localhost:5000/api/modes/video/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q.question,
          answer: currentAnswer,
          level: localStorage.getItem('englishtalk_level') || 'intermediate'
        })
      })
      const data = await res.json()
      setFeedback(data)
      setAnswers(prev => [...prev, { question: q.question, answer: currentAnswer, feedback: data }])
      setShowFeedback(true)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const nextQuestion = () => {
    setShowFeedback(false)
    setCurrentAnswer('')
    setFeedback(null)

    if (currentQIdx + 1 >= INTERVIEW_QUESTIONS.length) {
      endInterview()
      return
    }

    const nextIdx = currentQIdx + 1
    setCurrentQIdx(nextIdx)
    setTimeout(() => {
      speakText(INTERVIEW_QUESTIONS[nextIdx].question, selectedInterviewer.id === 'i2' ? 'male' : 'female')
    }, 500)
  }

  const endInterview = () => {
    stopCamera()
    setTimerActive(false)
    window.speechSynthesis.cancel()

    // Calculate overall results
    const scores = answers.map(a => a.feedback?.overall || 5)
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    setResult({ avgScore, answers, totalTime: timer })
    setPhase('result')
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  // ── SETUP SCREEN ────────────────────────────────────────
  if (phase === 'setup') return (
    <div style={{ minHeight: '100vh', background: '#0f0f13', fontFamily: "'Nunito', sans-serif", padding: '0 0 40px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');`}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a0533, #0f0f13)', padding: '52px 20px 24px' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <button onClick={onBack} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #2a2a3e', background: '#1e1e2e', color: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>←</button>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '900', margin: '0 0 6px' }}>🎬 AI Video Interview</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0 }}>Practice with a real interviewer simulation</p>
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '20px 16px' }}>

        {/* Camera preview */}
        <div style={{ background: '#1a1a2e', borderRadius: '20px', overflow: 'hidden', marginBottom: '20px', position: 'relative', aspectRatio: '16/9' }}>
          <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraError ? 'none' : 'block' }} />
          {cameraError && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📷</div>
              <p style={{ color: '#555', fontSize: '13px', fontWeight: '700' }}>Camera not available</p>
              <p style={{ color: '#444', fontSize: '11px' }}>You can still practice without camera</p>
            </div>
          )}
          <button onClick={startCamera} style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(108,99,255,0.8)', border: 'none', borderRadius: '10px', padding: '8px 14px', color: '#fff', fontWeight: '700', fontSize: '12px', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
            📷 Test Camera
          </button>
        </div>

        {/* Pick interviewer */}
        <p style={{ fontWeight: '900', fontSize: '15px', color: '#fff', margin: '0 0 12px' }}>Choose Your Interviewer</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {INTERVIEWERS.map(iv => (
            <button key={iv.id} onClick={() => setSelectedInterviewer(iv)} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 16px', borderRadius: '16px', border: 'none',
              background: selectedInterviewer.id === iv.id ? `linear-gradient(135deg, ${iv.color}22, #1e1e2e)` : '#1a1a2e',
              outline: selectedInterviewer.id === iv.id ? `2px solid ${iv.color}` : '2px solid transparent',
              cursor: 'pointer', fontFamily: 'Nunito, sans-serif', textAlign: 'left'
            }}>
              <img src={iv.photo} alt={iv.name} style={{ width: '48px', height: '48px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '800', fontSize: '15px', color: '#fff' }}>{iv.name}</div>
                <div style={{ color: '#888', fontSize: '12px' }}>{iv.role} · {iv.company}</div>
              </div>
              {selectedInterviewer.id === iv.id && <div style={{ color: iv.color, fontSize: '20px' }}>✓</div>}
            </button>
          ))}
        </div>

        {/* Info */}
        <div style={{ background: '#1a1a2e', borderRadius: '16px', padding: '16px', marginBottom: '24px', border: '1px solid #2a2a3e' }}>
          {[
            ['🎤', 'Speak your answers clearly'],
            ['📹', 'Camera shows your body language'],
            ['🤖', 'AI scores content, fluency & confidence'],
            ['❓', `${INTERVIEW_QUESTIONS.length} interview questions`],
          ].map(([icon, text], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: i < 3 ? '10px' : 0 }}>
              <span style={{ fontSize: '16px' }}>{icon}</span>
              <span style={{ color: '#aaa', fontSize: '13px', fontWeight: '600' }}>{text}</span>
            </div>
          ))}
        </div>

        <button onClick={startInterview} style={{
          width: '100%', padding: '16px', borderRadius: '16px',
          background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
          border: 'none', color: '#fff', fontWeight: '900', fontSize: '15px',
          cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
          boxShadow: '0 4px 20px rgba(108,99,255,0.4)'
        }}>🎬 Start Interview</button>
      </div>
    </div>
  )

  // ── RESULT SCREEN ────────────────────────────────────────
  if (phase === 'result') return (
    <div style={{ minHeight: '100vh', background: '#f5f7ff', fontFamily: "'Nunito', sans-serif", padding: '40px 16px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');`}</style>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>

        {/* Trophy + score */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '64px', marginBottom: '8px' }}>🎬</div>
          <h2 style={{ fontWeight: '900', fontSize: '24px', color: '#1a1a2e', margin: '0 0 4px' }}>Interview Complete!</h2>
          <p style={{ color: '#888', fontSize: '13px', margin: '0 0 16px' }}>with {selectedInterviewer.name} · {formatTime(result.totalTime)}</p>
          <div style={{ fontSize: '48px', fontWeight: '900', color: getScoreColor(result.avgScore) }}>{result.avgScore}/10</div>
          <div style={{ color: '#aaa', fontSize: '13px', fontWeight: '700', marginTop: '4px' }}>Average Score</div>
        </div>

        {/* Per question breakdown */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p style={{ fontWeight: '800', fontSize: '14px', color: '#1a1a2e', margin: '0 0 14px' }}>Question Breakdown</p>
          {result.answers.map((a, i) => (
            <div key={i} style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: i < result.answers.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#555' }}>Q{i + 1}: {a.question.slice(0, 40)}...</span>
                <span style={{ fontWeight: '900', fontSize: '14px', color: getScoreColor(a.feedback?.overall) }}>{a.feedback?.overall}/10</span>
              </div>
              <div style={{ background: '#f3f4f6', borderRadius: '100px', height: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '100px', background: getScoreColor(a.feedback?.overall), width: `${(a.feedback?.overall || 0) * 10}%`, transition: 'width 0.6s ease' }} />
              </div>
              {a.feedback?.tip && <p style={{ margin: '6px 0 0', color: '#888', fontSize: '11px' }}>💡 {a.feedback.tip}</p>}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => { setPhase('setup'); setCurrentQIdx(0); setAnswers([]); setCurrentAnswer(''); setTimer(0) }} style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'none', border: '2px solid #6c63ff', color: '#6c63ff', fontWeight: '800', fontSize: '13px', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>🔄 Try Again</button>
          <button onClick={onBack} style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)', border: 'none', color: '#fff', fontWeight: '800', fontSize: '13px', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>🏠 Home</button>
        </div>
      </div>
    </div>
  )

  // ── INTERVIEW SCREEN ────────────────────────────────────────
  const currentQ = INTERVIEW_QUESTIONS[currentQIdx]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '680px', height: '100vh', background: '#0f0f13', fontFamily: "'Nunito', sans-serif", zIndex: 100 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e2e', background: '#0f0f13', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={endInterview} style={{ width: '34px', height: '34px', borderRadius: '10px', border: '1px solid #2a2a3e', background: '#1e1e2e', color: '#fff', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '800', fontSize: '13px', color: '#fff' }}>🎬 Video Interview · {selectedInterviewer.name}</div>
          <div style={{ color: '#6c63ff', fontSize: '11px' }}>Q{currentQIdx + 1}/{INTERVIEW_QUESTIONS.length} · {formatTime(timer)}</div>
        </div>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {INTERVIEW_QUESTIONS.map((_, i) => (
            <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i < currentQIdx ? '#22c55e' : i === currentQIdx ? '#6c63ff' : '#2a2a3e' }} />
          ))}
        </div>
      </div>

      {/* Main video area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Interviewer + user webcam */}
        <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', flex: '0 0 auto' }}>

          {/* Interviewer card */}
          <div style={{ flex: 1, background: '#1a1a2e', borderRadius: '16px', overflow: 'hidden', position: 'relative', aspectRatio: '4/3' }}>
            <img src={selectedInterviewer.photo} alt={selectedInterviewer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8)', padding: '12px 10px 8px' }}>
              <div style={{ color: '#fff', fontWeight: '800', fontSize: '12px' }}>{selectedInterviewer.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px' }}>{selectedInterviewer.role}</div>
            </div>
            {interviewerSpeaking && (
              <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#22c55e', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', fontWeight: '700', color: '#fff', animation: 'pulse 1s infinite' }}>
                🎤 Speaking
              </div>
            )}
          </div>

          {/* User webcam */}
          <div style={{ flex: 1, background: '#111118', borderRadius: '16px', overflow: 'hidden', position: 'relative', aspectRatio: '4/3' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: cameraError ? 'none' : 'block' }} />
            {cameraError && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '32px' }}>📷</div>
                <div style={{ color: '#555', fontSize: '10px', fontWeight: '700' }}>No Camera</div>
              </div>
            )}
            <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.7)', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', fontWeight: '700', color: '#fff' }}>You</div>
            {listening && (
              <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#ef4444', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', fontWeight: '700', color: '#fff', animation: 'pulse 1s infinite' }}>
                🔴 REC
              </div>
            )}
          </div>
        </div>

        {/* Question card */}
        {!showFeedback && (
          <div style={{ margin: '0 16px 12px', background: '#1a1a2e', borderRadius: '16px', padding: '16px', border: '1px solid #2a2a3e' }}>
            <div style={{ color: '#6c63ff', fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>QUESTION {currentQIdx + 1}</div>
            <p style={{ margin: '0 0 8px', color: '#fff', fontSize: '15px', fontWeight: '800', lineHeight: '1.4' }}>{currentQ.question}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px' }}>💡</span>
              <span style={{ color: '#666', fontSize: '11px', fontWeight: '600' }}>{currentQ.tip}</span>
            </div>
            <button onClick={() => speakText(currentQ.question, selectedInterviewer.id === 'i2' ? 'male' : 'female')} style={{ marginTop: '10px', background: 'none', border: '1px solid #2a2a3e', borderRadius: '8px', padding: '5px 12px', color: '#888', fontWeight: '700', fontSize: '11px', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
              🔊 Hear question
            </button>
          </div>
        )}

        {/* Answer area */}
        {!showFeedback && (
          <div style={{ margin: '0 16px 12px', background: '#1a1a2e', borderRadius: '16px', padding: '14px', border: '1px solid #2a2a3e', flex: 1, minHeight: 0 }}>
            <div style={{ color: '#888', fontSize: '10px', fontWeight: '800', marginBottom: '6px' }}>YOUR ANSWER</div>
            <p style={{ color: currentAnswer ? '#fff' : '#444', fontSize: '13px', lineHeight: '1.6', margin: 0, minHeight: '60px' }}>
              {currentAnswer || 'Tap the mic to start speaking...'}
            </p>
          </div>
        )}

        {/* Feedback card */}
        {showFeedback && feedback && (
          <div style={{ margin: '0 16px 12px', background: '#1a1a2e', borderRadius: '16px', padding: '16px', border: `1px solid ${getScoreColor(feedback.overall)}44`, flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontWeight: '800', fontSize: '14px', color: '#fff' }}>AI Feedback</div>
              <div style={{ fontWeight: '900', fontSize: '22px', color: getScoreColor(feedback.overall) }}>{feedback.overall}/10</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {[['💬 Content', feedback.content], ['🗣️ Fluency', feedback.fluency], ['💪 Confidence', feedback.confidence]].map(([label, val], i) => (
                <div key={i} style={{ background: '#111118', borderRadius: '10px', padding: '10px 6px', textAlign: 'center' }}>
                  <div style={{ fontWeight: '900', fontSize: '18px', color: getScoreColor(val) }}>{val}</div>
                  <div style={{ color: '#555', fontSize: '9px', fontWeight: '700', marginTop: '2px' }}>{label}</div>
                </div>
              ))}
            </div>
            {feedback.strength && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', padding: '10px', marginBottom: '8px' }}><p style={{ margin: 0, color: '#22c55e', fontSize: '12px', fontWeight: '700' }}>✅ {feedback.strength}</p></div>}
            {feedback.tip && <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '10px', marginBottom: '8px' }}><p style={{ margin: 0, color: '#f59e0b', fontSize: '12px', fontWeight: '700' }}>💡 {feedback.tip}</p></div>}
            {feedback.betterAnswer && <div style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '10px', padding: '10px' }}><p style={{ margin: '0 0 4px', color: '#a78bfa', fontSize: '10px', fontWeight: '800' }}>BETTER ANSWER</p><p style={{ margin: 0, color: '#ddd', fontSize: '12px', lineHeight: '1.5' }}>"{feedback.betterAnswer}"</p></div>}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1e1e2e', background: '#0f0f13', display: 'flex', gap: '10px', alignItems: 'center' }}>
        {!showFeedback ? (
          <>
            <button onClick={listening ? stopListening : startListening} style={{
              flex: 1, height: '48px', borderRadius: '14px',
              border: listening ? '1px solid #ef4444' : '1px solid #2a2a3e',
              background: listening ? 'rgba(239,68,68,0.15)' : '#1e1e2e',
              color: listening ? '#ef4444' : '#888',
              cursor: 'pointer', fontSize: '14px', fontWeight: '800',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontFamily: 'Nunito, sans-serif'
            }}>
              {listening ? '⏹ Stop Recording' : '🎤 Start Speaking'}
            </button>
            <button onClick={submitAnswer} disabled={!currentAnswer.trim() || loading} style={{
              flex: 1, height: '48px', borderRadius: '14px', border: 'none',
              background: !currentAnswer.trim() || loading ? '#2a2a3e' : 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
              color: '#fff', fontWeight: '800', fontSize: '14px',
              cursor: !currentAnswer.trim() || loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Nunito, sans-serif'
            }}>{loading ? '🤔 Analyzing...' : '📊 Get Feedback'}</button>
          </>
        ) : (
          <button onClick={nextQuestion} style={{
            flex: 1, height: '48px', borderRadius: '14px', border: 'none',
            background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
            color: '#fff', fontWeight: '800', fontSize: '14px',
            cursor: 'pointer', fontFamily: 'Nunito, sans-serif'
          }}>
            {currentQIdx + 1 >= INTERVIEW_QUESTIONS.length ? '🏁 Finish Interview' : `Next Question →`}
          </button>
        )}
      </div>
    </div>
  )
}
