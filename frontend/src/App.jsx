import LiveTranslator from './components/LiveTranslator'
import { useState } from 'react'
import TopicSelector from './components/TopicSelector'

function updateProgressAfterSession(score) {
  try {
    const data = localStorage.getItem('englishtalk_progress')
    const p = data ? JSON.parse(data) : { xp: 0, streak: 0, lastPracticeDate: null, todaySessions: 0, totalSessions: 0, level: 1 }
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (p.lastPracticeDate === yesterday) p.streak += 1
    else if (p.lastPracticeDate !== today) p.streak = 1
    p.xp += score * 10
    p.lastPracticeDate = today
    p.todaySessions = (p.todaySessions || 0) + 1
    p.totalSessions += 1
    p.level = Math.floor(p.xp / 500) + 1
    localStorage.setItem('englishtalk_progress', JSON.stringify(p))
  } catch {}
}
import ChatWindow from './components/ChatWindow'
import ProfileScreen from './components/ProfileScreen'
import HistoryScreen from './components/HistoryScreen'
import ProgressScreen from './components/ProgressScreen'
import PronunciationScreen from './components/PronunciationScreen'
import WordOfDayScreen from './components/WordOfDayScreen'
import GDScreen from './components/GDScreen'
import DebateScreen from './components/DebateScreen'
import SituationalScreen from './components/SituationalScreen'
import AICallScreen from './components/AICallScreen'
import VideoInterviewScreen from './components/VideoInterviewScreen'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [topic, setTopic] = useState(null)

  const goHome = () => setScreen('home')

  const handleBack = (lastScore) => {
    if (lastScore) updateProgressAfterSession(lastScore)
    goHome()
  }

  if (screen === 'chat') return <ChatWindow topic={topic} onBack={handleBack} />
  if (screen === 'profile') return <ProfileScreen onBack={goHome} />
  if (screen === 'history') return <HistoryScreen onBack={goHome} />
  if (screen === 'progress') return <ProgressScreen onBack={goHome} />
  if (screen === 'pronunciation') return <PronunciationScreen onBack={goHome} />
  if (screen === 'translator') return <LiveTranslator onBack={() => setScreen('home')} />
  if (screen === 'word') return <WordOfDayScreen onBack={goHome} />
  if (screen === 'gd') return <GDScreen onBack={goHome} />
  if (screen === 'debate') return <DebateScreen onBack={goHome} />
  if (screen === 'situational') return <SituationalScreen onBack={goHome} />
  if (screen === 'call') return <AICallScreen onBack={goHome} />
  if (screen === 'video') return <VideoInterviewScreen onBack={goHome} />

  return (
    <TopicSelector
      onSelect={(t) => { setTopic(t); setScreen('chat') }}
      onProfile={() => setScreen('profile')}
      onHistory={() => setScreen('history')}
      onProgress={() => setScreen('progress')}
      onPronunciation={() => setScreen('pronunciation')}
      onWord={() => setScreen('word')}
      onGD={() => setScreen('gd')}
      onDebate={() => setScreen('debate')}
      onSituational={() => setScreen('situational')}
      onCall={() => setScreen('call')}
      onVideo={() => setScreen('video')}
      onTranslator={() => setScreen('translator')}
    />
  )
}
