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
  const { messages, loading, sendUserMessage } = useChat(topic)
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    sendUserMessage('Start the interview. Ask me the first question.')
  }, [])

  const handleSend = () => {
    if (!input.trim() || loading) return
    sendUserMessage(input)
    setInput('')
    inputRef.current?.focus()
  }

  const visibleMessages = messages.filter(m =>
    !(m.role === 'user' && m.content === 'Start the interview. Ask me the first question.')
  )

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      maxWidth: '680px', margin: '0 auto',
      background: '#0f0f13'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #1e1e2e',
        display: 'flex', alignItems: 'center', gap: '12px',
        background: '#0f0f13',
        backdropFilter: 'blur(10px)'
      }}>
        <button onClick={onBack} style={{
          width: '36px', height: '36px', borderRadius: '10px',
          border: '1px solid #2a2a3e', background: '#1e1e2e',
          color: '#fff', cursor: 'pointer', fontSize: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>←</button>
        <div>
          <div style={{ fontWeight: '600', fontSize: '15px' }}>
            {topicLabels[topic] || topic}
          </div>
          <div style={{ color: '#6c63ff', fontSize: '12px' }}>● Live session</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '24px 20px',
        display: 'flex', flexDirection: 'column'
      }}>
        {visibleMessages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#444', marginTop: '40px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
            <p>Starting your interview session...</p>
          </div>
        )}
        {visibleMessages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#666', fontSize: '14px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
            }}>🎯</div>
            <span>AI is thinking...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid #1e1e2e',
        display: 'flex', gap: '12px', alignItems: 'center',
        background: '#0f0f13'
      }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type your answer here..."
          style={{
            flex: 1, padding: '14px 18px',
            borderRadius: '14px',
            border: '1px solid #2a2a3e',
            background: '#1e1e2e',
            color: '#fff', fontSize: '15px',
            outline: 'none',
          }}
          onFocus={e => e.target.style.border = '1px solid #6c63ff'}
          onBlur={e => e.target.style.border = '1px solid #2a2a3e'}
        />
        <button onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: loading || !input.trim()
              ? '#2a2a3e'
              : 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
            border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            color: '#fff', fontSize: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
            flexShrink: 0
          }}>
          ➤
        </button>
      </div>
    </div>
  )
}