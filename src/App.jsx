import { useState } from 'react'
import TopicSelector from './components/TopicSelector'
import ChatWindow from './components/ChatWindow'

export default function App() {
  const [topic, setTopic] = useState(null)

  return topic
    ? <ChatWindow topic={topic} onBack={() => setTopic(null)} />
    : <TopicSelector onSelect={setTopic} />
}
