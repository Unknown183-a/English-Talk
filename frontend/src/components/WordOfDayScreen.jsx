import { useState, useEffect, useRef } from 'react'

function getToday() {
  return new Date().toISOString().split('T')[0]
}

function getScoreColor(s) {
  return s >= 8 ? '#22c55e' : s >= 6 ? '#f59e0b' : '#ef4444'
}

export default function WordOfDayScreen({ onBack }) {
  const [wordData, setWordData] = useState(null)
  const [words, setWords] = useState([])
  const [activeWordIdx, setActiveWordIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('word') // 'word' | 'quiz' | 'bank'
  const [userSentence, setUserSentence] = useState('')
  const [quizResult, setQuizResult] = useState(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [wordBank, setWordBank] = useState([])
  const [speaking, setSpeaking] = useState(false)
  const [waveBars, setWaveBars] = useState(Array.from({ length: 18 }, () => 4))
  const [listening, setListening] = useState(false)
  const audioRef = useRef(null)
  const waveRef = useRef(null)
  const recognitionRef = useRef(null)
  const today = getToday()

  useEffect(() => {
    loadWordBank()
    fetchTodayWord()
  }, [])

  const loadWordBank = () => {
    try {
      const bank = JSON.parse(localStorage.getItem('englishtalk_wordbank') || '[]')
      setWordBank(bank)
    } catch {}
  }

  const fetchTodayWord = async () => {
    // Check cache first
    try {
      const cached = JSON.parse(localStorage.getItem('englishtalk_word_today') || '{}')
      if (cached.date === today && cached.words?.length) {
        setWords(cached.words)
        setWordData(cached.words[0])
        setLoading(false)
        return
      }
    } catch {}

    setLoading(true)
    try {
      const res = await fetch('/api/word/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today })
      })
      const data = await res.json()
      const wordList = data.words || [data]
      setWords(wordList)
      setWordData(wordList[0])
      localStorage.setItem('englishtalk_word_today', JSON.stringify({ date: today, words: wordList }))

      // Save all to word bank
      const bank = JSON.parse(localStorage.getItem('englishtalk_wordbank') || '[]')
      let updated = [...bank]
      for (const w of wordList) {
        if (!updated.find(b => b.word === w.word)) {
          updated = [{ ...w, learned: false }, ...updated]
        }
      }
      localStorage.setItem('englishtalk_wordbank', JSON.stringify(updated))
      setWordBank(updated)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const stopSpeaking = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    window.speechSynthesis?.cancel()
    setSpeaking(false)
    clearInterval(waveRef.current)
    setWaveBars(Array.from({ length: 18 }, () => 4))
  }

  const speakText = async (text) => {
    stopSpeaking()
    setSpeaking(true)
    waveRef.current = setInterval(() => {
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
      clearInterval(waveRef.current)
      const u = new window.SpeechSynthesisUtterance(text)
      u.lang = 'en-IN'; u.rate = 0.88
      u.onend = () => { setSpeaking(false); setWaveBars(Array.from({ length: 18 }, () => 4)) }
      window.speechSynthesis.speak(u)
    }
  }

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Use Chrome for voice input.'); return }
    const r = new SR()
    r.lang = 'en-IN'; r.interimResults = true; r.continuous = false
    recognitionRef.current = r
    r.onstart = () => setListening(true)
    r.continuous = true
    r.interimResults = true
    r.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('')
      setUserSentence(prev => {
        // Append new speech to existing text
        const base = prev.trim()
        return base ? base + ' ' + transcript : transcript
      })
    }
    // Wait 8 seconds of silence before stopping
    let silenceTimer = null
    r.onspeechend = () => {
      silenceTimer = setTimeout(() => {
        recognitionRef.current?.stop()
      }, 8000)
    }
    r.onspeechstart = () => {
      if (silenceTimer) clearTimeout(silenceTimer)
    }
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    r.start()
  }

  const submitQuiz = async () => {
    if (!userSentence.trim() || !wordData) return
    setQuizLoading(true)
    try {
      const res = await fetch('/api/word/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: wordData.word,
          meaning: wordData.meaning,
          userSentence
        })
      })
      const data = await res.json()
      setQuizResult(data)

      // Mark word as learned if score >= 7
      if (data.score >= 7) {
        const bank = JSON.parse(localStorage.getItem('englishtalk_wordbank') || '[]')
        const updated = bank.map(w => w.word === wordData.word ? { ...w, learned: true } : w)
        localStorage.setItem('englishtalk_wordbank', JSON.stringify(updated))
        setWordBank(updated)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setQuizLoading(false)
    }
  }

  const selectWord = (idx) => {
    setActiveWordIdx(idx)
    setWordData(words[idx])
    setUserSentence('')
    setQuizResult(null)
    stopSpeaking()
  }

  const learnedCount = wordBank.filter(w => w.learned).length

  return (
    <div style={{
      minHeight: '100vh', background: '#f5f7ff',
      fontFamily: "'Nunito', sans-serif", paddingBottom: '40px'
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        padding: '48px 20px 80px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'180px', height:'180px', borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
        <div style={{ position:'absolute', bottom:'-60px', left:'-30px', width:'200px', height:'200px', borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
        <div style={{ maxWidth: '480px', margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <button onClick={onBack} style={{
              width: '36px', height: '36px', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)',
              color: '#fff', cursor: 'pointer', fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>←</button>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '6px 14px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontWeight: '900', fontSize: '18px' }}>{learnedCount}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: '700' }}>WORDS LEARNED</div>
            </div>
          </div>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '900', margin: '16px 0 4px' }}>📖 Word of the Day</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: 0 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '-48px auto 0', padding: '0 16px', position: 'relative', zIndex: 1 }}>

        {/* Tabs */}
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '6px',
          marginBottom: '16px', boxShadow: '0 4px 24px rgba(16,185,129,0.12)',
          display: 'flex', gap: '4px'
        }}>
          {[['word', '📖 Today'], ['quiz', '✏️ Quiz'], ['bank', '📚 My Words']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: '10px 6px', borderRadius: '12px', border: 'none',
              background: tab === id ? 'linear-gradient(135deg, #10b981, #059669)' : 'none',
              color: tab === id ? '#fff' : '#888',
              fontWeight: '800', fontSize: '12px', cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif', transition: 'all 0.2s'
            }}>{label}</button>
          ))}
        </div>

        {/* WORD TAB */}
        {tab === 'word' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Word pills */}
            {words.length > 1 && (
              <div style={{
                display: 'flex', gap: '8px', overflowX: 'auto',
                marginBottom: '14px', paddingBottom: '4px'
              }}>
                {words.map((w, i) => {
                  const isLearned = wordBank.find(b => b.word === w.word)?.learned
                  return (
                    <button key={i} onClick={() => selectWord(i)} style={{
                      padding: '6px 14px', borderRadius: '100px', border: 'none',
                      background: activeWordIdx === i
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : isLearned ? '#d1fae5' : '#f3f4f6',
                      color: activeWordIdx === i ? '#fff' : isLearned ? '#059669' : '#888',
                      fontWeight: '800', fontSize: '12px', cursor: 'pointer',
                      fontFamily: 'Nunito, sans-serif', whiteSpace: 'nowrap', flexShrink: 0
                    }}>
                      {isLearned ? '✅ ' : ''}{w.word}
                    </button>
                  )
                })}
              </div>
            )}

            {loading ? (
              <div style={{
                background: '#fff', borderRadius: '20px', padding: '48px 20px',
                textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
              }}>
                <div style={{ fontSize: '36px', marginBottom: '12px', animation: 'pulse 1s infinite' }}>📖</div>
                <p style={{ color: '#aaa', fontWeight: '700' }}>Loading today's word...</p>
              </div>
            ) : wordData ? (
              <>
                {/* Main word card */}
                <div style={{
                  background: '#fff', borderRadius: '20px', padding: '24px',
                  marginBottom: '14px', boxShadow: '0 4px 24px rgba(16,185,129,0.12)'
                }}>
                  {/* Word + phonetic + speak */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h3 style={{ margin: 0, fontSize: '32px', fontWeight: '900', color: '#1a1a2e' }}>
                          {wordData.word}
                        </h3>
                        <span style={{
                          background: '#d1fae5', color: '#059669',
                          borderRadius: '8px', padding: '2px 10px',
                          fontSize: '11px', fontWeight: '800'
                        }}>{wordData.partOfSpeech}</span>
                      </div>
                      {wordData.phonetic && (
                        <p style={{ margin: 0, color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                          {wordData.phonetic}
                        </p>
                      )}
                    </div>
                    <button onClick={() => speakText(wordData.word)} disabled={speaking} style={{
                      width: '48px', height: '48px', borderRadius: '14px', border: 'none',
                      background: speaking ? '#d1fae5' : 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff', fontSize: '20px', cursor: speaking ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                    }}>🔊</button>
                  </div>

                  {/* Waveform */}
                  {speaking && (
                    <div style={{
                      marginBottom: '14px', padding: '8px 14px',
                      background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                      borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px'
                    }}>
                      <span style={{ color: '#059669', fontSize: '11px', fontWeight: '700' }}>🔊</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '28px', flex: 1 }}>
                        {waveBars.map((h, i) => (
                          <div key={i} style={{
                            width: '3px', borderRadius: '100px',
                            background: 'linear-gradient(180deg, #10b981, #059669)',
                            height: `${h}px`, transition: 'height 0.1s ease'
                          }} />
                        ))}
                      </div>
                      <button onClick={stopSpeaking} style={{
                        background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
                        borderRadius: '8px', color: '#059669', cursor: 'pointer',
                        fontSize: '11px', fontWeight: '700', padding: '3px 8px', fontFamily: 'Nunito,sans-serif'
                      }}>Stop ⏹</button>
                    </div>
                  )}

                  {/* Meaning */}
                  <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '14px', padding: '14px', marginBottom: '12px' }}>
                    <p style={{ margin: '0 0 4px', color: '#059669', fontSize: '10px', fontWeight: '800' }}>MEANING</p>
                    <p style={{ margin: 0, fontSize: '15px', color: '#1a1a2e', fontWeight: '700', lineHeight: '1.5' }}>{wordData.meaning}</p>
                  </div>

                  {/* Example */}
                  <div style={{ background: '#f8f7ff', border: '1.5px solid #ddd6fe', borderRadius: '14px', padding: '14px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <p style={{ margin: 0, color: '#6c63ff', fontSize: '10px', fontWeight: '800' }}>EXAMPLE</p>
                      <button onClick={() => speakText(wordData.example)} disabled={speaking} style={{
                        background: 'none', border: '1px solid #a78bfa', borderRadius: '6px',
                        color: '#6c63ff', cursor: 'pointer', fontSize: '10px',
                        fontWeight: '700', padding: '2px 8px', fontFamily: 'Nunito,sans-serif'
                      }}>🔊 Hear</button>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: '#555', fontStyle: 'italic', lineHeight: '1.5' }}>
                      "{wordData.example}"
                    </p>
                  </div>

                  {/* Synonyms */}
                  {wordData.synonyms && (
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ margin: '0 0 8px', color: '#888', fontSize: '10px', fontWeight: '800' }}>SYNONYMS</p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {wordData.synonyms.split(',').map((s, i) => (
                          <span key={i} style={{
                            background: '#f3f4f6', borderRadius: '100px',
                            padding: '4px 12px', fontSize: '13px', fontWeight: '700', color: '#555'
                          }}>{s.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Memory tip */}
                  {wordData.memoryTip && (
                    <div style={{
                      background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                      border: '1.5px solid #fde68a', borderRadius: '14px', padding: '12px',
                      display: 'flex', gap: '8px', alignItems: 'flex-start'
                    }}>
                      <span style={{ fontSize: '18px' }}>🧠</span>
                      <div>
                        <p style={{ margin: '0 0 2px', color: '#b45309', fontSize: '10px', fontWeight: '800' }}>MEMORY TIP</p>
                        <p style={{ margin: 0, color: '#92400e', fontSize: '13px', lineHeight: '1.5' }}>{wordData.memoryTip}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Try it button */}
                <button onClick={() => setTab('quiz')} style={{
                  width: '100%', padding: '16px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none', color: '#fff', fontWeight: '900', fontSize: '15px',
                  cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
                  boxShadow: '0 4px 20px rgba(16,185,129,0.35)'
                }}>✏️ Use it in a sentence →</button>
              </>
            ) : (
              <div style={{ background: '#fff', borderRadius: '20px', padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ color: '#ef4444' }}>Failed to load word. Check your server.</p>
                <button onClick={fetchTodayWord} style={{ marginTop: '12px', padding: '10px 24px', borderRadius: '12px', background: '#10b981', border: 'none', color: '#fff', fontWeight: '800', cursor: 'pointer', fontFamily: 'Nunito,sans-serif' }}>Retry</button>
              </div>
            )}
          </div>
        )}

        {/* QUIZ TAB */}
        {tab === 'quiz' && wordData && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ background: '#fff', borderRadius: '20px', padding: '22px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '14px' }}>

              {/* Word reminder */}
              <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '14px', padding: '14px', marginBottom: '18px' }}>
                <p style={{ margin: '0 0 4px', color: '#059669', fontSize: '10px', fontWeight: '800' }}>TODAY'S WORD</p>
                <p style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '900', color: '#1a1a2e' }}>{wordData.word}</p>
                <p style={{ margin: 0, color: '#555', fontSize: '13px' }}>{wordData.meaning}</p>
              </div>

              <p style={{ margin: '0 0 14px', fontWeight: '800', fontSize: '14px', color: '#1a1a2e' }}>
                ✏️ Write a sentence using <span style={{ color: '#10b981' }}>"{wordData.word}"</span>:
              </p>

              <textarea
                value={userSentence}
                onChange={e => { setUserSentence(e.target.value); setQuizResult(null) }}
                placeholder={`Use "${wordData.word}" naturally in a sentence...`}
                rows={3}
                style={{
                  width: '100%', padding: '14px', borderRadius: '14px',
                  border: '1.5px solid #e5e7eb', background: '#f9fafb',
                  fontSize: '14px', color: '#1a1a2e', fontFamily: 'Nunito, sans-serif',
                  fontWeight: '600', resize: 'none', outline: 'none', boxSizing: 'border-box',
                  lineHeight: '1.6'
                }}
                onFocus={e => e.target.style.border = '1.5px solid #10b981'}
                onBlur={e => e.target.style.border = '1.5px solid #e5e7eb'}
              />

              {/* Voice input */}
              <button onClick={listening ? () => recognitionRef.current?.stop() : startListening} style={{
                marginTop: '8px', background: listening ? 'rgba(239,68,68,0.1)' : '#f3f4f6',
                border: listening ? '1px solid #ef4444' : '1px solid #e5e7eb',
                borderRadius: '10px', padding: '8px 14px', color: listening ? '#ef4444' : '#888',
                fontWeight: '700', fontSize: '12px', cursor: 'pointer', fontFamily: 'Nunito,sans-serif',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                {listening ? '⏹ Stop listening' : '🎤 Speak your sentence'}
              </button>

              <button onClick={submitQuiz} disabled={!userSentence.trim() || quizLoading} style={{
                marginTop: '14px', width: '100%', padding: '14px', borderRadius: '14px',
                background: !userSentence.trim() || quizLoading ? '#e5e7eb' : 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none', color: '#fff', fontWeight: '900', fontSize: '14px',
                cursor: !userSentence.trim() || quizLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'Nunito, sans-serif'
              }}>{quizLoading ? '🤔 Checking...' : '📊 Check My Sentence'}</button>
            </div>

            {/* Quiz result */}
            {quizResult && (
              <div style={{ background: '#fff', borderRadius: '20px', padding: '22px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', animation: 'fadeIn 0.3s ease' }}>

                {/* Score */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: '16px', padding: '14px 18px',
                  background: `${getScoreColor(quizResult.score)}12`,
                  border: `1.5px solid ${getScoreColor(quizResult.score)}33`,
                  borderRadius: '14px'
                }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontWeight: '900', fontSize: '15px', color: '#1a1a2e' }}>
                      {quizResult.correct === 'Yes' ? '✅ Correct usage!' : '❌ Needs improvement'}
                    </p>
                    <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>{quizResult.feedback}</p>
                  </div>
                  <div style={{ fontWeight: '900', fontSize: '28px', color: getScoreColor(quizResult.score) }}>
                    {quizResult.score}/10
                  </div>
                </div>

                {/* Better sentence */}
                {quizResult.better && quizResult.better !== 'Great job!' && (
                  <div style={{ background: '#f8f7ff', border: '1.5px solid #ddd6fe', borderRadius: '14px', padding: '14px', marginBottom: '12px' }}>
                    <p style={{ margin: '0 0 6px', color: '#6c63ff', fontSize: '10px', fontWeight: '800' }}>BETTER VERSION</p>
                    <p style={{ margin: '0 0 8px', color: '#1a1a2e', fontSize: '14px', fontStyle: 'italic' }}>"{quizResult.better}"</p>
                    <button onClick={() => speakText(quizResult.better)} disabled={speaking} style={{
                      background: 'none', border: '1px solid #a78bfa', borderRadius: '6px',
                      color: '#6c63ff', cursor: 'pointer', fontSize: '11px',
                      fontWeight: '700', padding: '3px 10px', fontFamily: 'Nunito,sans-serif'
                    }}>🔊 Hear it</button>
                  </div>
                )}

                {quizResult.score >= 7 && (
                  <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontWeight: '800', color: '#059669' }}>🎉 Word marked as learned in your Word Bank!</p>
                  </div>
                )}

                <button onClick={() => { setUserSentence(''); setQuizResult(null) }} style={{
                  marginTop: '12px', width: '100%', padding: '13px', borderRadius: '14px',
                  background: 'none', border: '2px solid #10b981', color: '#10b981',
                  fontWeight: '800', fontSize: '13px', cursor: 'pointer', fontFamily: 'Nunito, sans-serif'
                }}>🔄 Try Again</button>
              </div>
            )}
          </div>
        )}

        {/* WORD BANK TAB */}
        {tab === 'bank' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {wordBank.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '20px', padding: '48px 20px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
                <p style={{ fontWeight: '800', color: '#1a1a2e', fontSize: '16px', margin: '0 0 6px' }}>No words yet</p>
                <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>Come back daily to grow your word bank!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <p style={{ margin: 0, fontWeight: '800', fontSize: '15px', color: '#1a1a2e' }}>{wordBank.length} words collected</p>
                  <span style={{ background: '#d1fae5', color: '#059669', borderRadius: '100px', padding: '3px 10px', fontSize: '11px', fontWeight: '800' }}>
                    {learnedCount} learned ✅
                  </span>
                </div>
                {wordBank.map((w, i) => (
                  <div key={i} style={{
                    background: '#fff', borderRadius: '16px', padding: '14px 16px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    border: w.learned ? '1.5px solid #bbf7d0' : '1.5px solid #f3f4f6',
                    display: 'flex', alignItems: 'center', gap: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{ fontWeight: '900', fontSize: '16px', color: '#1a1a2e' }}>{w.word}</span>
                        {w.learned && <span style={{ background: '#d1fae5', color: '#059669', borderRadius: '6px', padding: '1px 7px', fontSize: '9px', fontWeight: '800' }}>LEARNED</span>}
                        <span style={{ background: '#f3f4f6', color: '#888', borderRadius: '6px', padding: '1px 7px', fontSize: '9px', fontWeight: '700' }}>{w.partOfSpeech}</span>
                      </div>
                      <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>{w.meaning}</p>
                    </div>
                    <button onClick={() => speakText(w.word)} disabled={speaking} style={{
                      width: '36px', height: '36px', borderRadius: '10px', border: 'none', flexShrink: 0,
                      background: '#f0fdf4', color: '#10b981', fontSize: '16px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>🔊</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
