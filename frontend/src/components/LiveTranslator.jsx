import { useState, useRef } from 'react'

const LANGUAGES = [
  { code: 'en', label: '🇬🇧 English', voice: 'en-IN' },
  { code: 'hi', label: '🇮🇳 Hindi', voice: 'hi-IN' },
  { code: 'te', label: '🌐 Telugu', voice: 'te-IN' },
  { code: 'ta', label: '🌐 Tamil', voice: 'ta-IN' },
  { code: 'bn', label: '🌐 Bengali', voice: 'bn-IN' },
  { code: 'mr', label: '🌐 Marathi', voice: 'mr-IN' },
  { code: 'gu', label: '🌐 Gujarati', voice: 'gu-IN' },
  { code: 'fr', label: '🇫🇷 French', voice: 'fr-FR' },
  { code: 'es', label: '🇪🇸 Spanish', voice: 'es-ES' },
  { code: 'ar', label: '🇸🇦 Arabic', voice: 'ar-SA' },
  { code: 'zh', label: '🇨🇳 Chinese', voice: 'zh-CN' },
  { code: 'ja', label: '🇯🇵 Japanese', voice: 'ja-JP' },
]

export default function LiveTranslator({ onBack }) {
  const [langA, setLangA] = useState(LANGUAGES[0]) // Person A
  const [langB, setLangB] = useState(LANGUAGES[1]) // Person B
  const [transcript, setTranscript] = useState('')
  const [translated, setTranslated] = useState('')
  const [listening, setListening] = useState(false)
  const [activePerson, setActivePerson] = useState(null) // 'A' or 'B'
  const [status, setStatus] = useState('Tap a mic button to start')
  const recognitionRef = useRef(null)
  const silenceRef = useRef(null)

  const speak = (text, voiceLang) => {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = voiceLang
    u.rate = 0.9
    window.speechSynthesis.speak(u)
  }

  const translate = async (text, from, to) => {
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, from, to })
      })
      const data = await res.json()
      return data.translated || ''
    } catch {
      return ''
    }
  }

  const startListening = (person) => {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      setActivePerson(null)
      return
    }

    const lang = person === 'A' ? langA : langB
    const targetLang = person === 'A' ? langB : langA

    setTranscript('')
    setTranslated('')
    setActivePerson(person)
    setListening(true)
    setStatus(`${lang.label} listening...`)

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new SpeechRecognition()
    r.lang = lang.voice
    r.continuous = true
    r.interimResults = true

    r.onresult = (e) => {
      if (silenceRef.current) clearTimeout(silenceRef.current)
      const text = Array.from(e.results).map(r => r[0].transcript).join('')
      setTranscript(text)
    }

    r.onspeechend = () => {
      silenceRef.current = setTimeout(async () => {
        r.stop()
        setListening(false)
        setActivePerson(null)
        setStatus('Translating...')

        const currentText = transcript || ''
        if (!currentText.trim()) { setStatus('No speech detected'); return }

        const result = await translate(currentText, lang.code, targetLang.code)
        setTranslated(result)
        setStatus(`Playing in ${targetLang.label}...`)
        speak(result, targetLang.voice)
        setTimeout(() => setStatus('Tap a mic button to continue'), 3000)
      }, 8000)
    }

    r.onspeechstart = () => {
      if (silenceRef.current) clearTimeout(silenceRef.current)
    }

    r.onend = () => {
      setListening(false)
    }

    recognitionRef.current = r
    r.start()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f13, #1a1a2e)', color: '#fff', fontFamily: 'Nunito, sans-serif', padding: '0' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', fontSize: '18px' }}>←</button>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>🌐 Live Translator</h2>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.85 }}>Speak in any language, hear in another</p>
        </div>
      </div>

      <div style={{ padding: '20px' }}>

        {/* Status */}
        <div style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', padding: '12px', textAlign: 'center', marginBottom: '20px', fontSize: '14px', color: '#a5b4fc' }}>
          {status}
        </div>

        {/* Person A */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: activePerson === 'A' ? '2px solid #6366f1' : '2px solid transparent' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 800, fontSize: '16px' }}>👤 Person A</span>
            <select
              value={langA.code}
              onChange={e => setLangA(LANGUAGES.find(l => l.code === e.target.value))}
              style={{ background: '#1e1e2e', color: '#fff', border: '1px solid #444', borderRadius: '8px', padding: '4px 8px', fontSize: '13px' }}
            >
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          <button
            onClick={() => startListening('A')}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '15px',
              background: activePerson === 'A' && listening ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff'
            }}
          >
            {activePerson === 'A' && listening ? '⏹ Stop' : `🎤 Speak in ${langA.label}`}
          </button>
        </div>

        {/* Person B */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: activePerson === 'B' ? '2px solid #10b981' : '2px solid transparent' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 800, fontSize: '16px' }}>👤 Person B</span>
            <select
              value={langB.code}
              onChange={e => setLangB(LANGUAGES.find(l => l.code === e.target.value))}
              style={{ background: '#1e1e2e', color: '#fff', border: '1px solid #444', borderRadius: '8px', padding: '4px 8px', fontSize: '13px' }}
            >
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          <button
            onClick={() => startListening('B')}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '15px',
              background: activePerson === 'B' && listening ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff'
            }}
          >
            {activePerson === 'B' && listening ? '⏹ Stop' : `🎤 Speak in ${langB.label}`}
          </button>
        </div>

        {/* Transcript + Translation */}
        {transcript && (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#888' }}>HEARD</p>
            <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.5 }}>{transcript}</p>
          </div>
        )}

        {translated && (
          <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '16px', padding: '16px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#a5b4fc' }}>TRANSLATED</p>
            <p style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 700, lineHeight: 1.5 }}>{translated}</p>
            <button
              onClick={() => speak(translated, activePerson === 'A' ? langB.voice : langA.voice)}
              style={{ background: 'rgba(99,102,241,0.3)', border: 'none', color: '#a5b4fc', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}
            >
              🔊 Replay
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
