function parseAIMessage(content) {
  if (!content.includes('SCORE:')) return { type: 'plain', content }
  
  const score = content.match(/SCORE:\s*(\d+)/)?.[1]
  const feedback = content.match(/FEEDBACK:\s*(.+?)(?=IMPROVE:|$)/s)?.[1]?.trim()
  const improve = content.match(/IMPROVE:\s*(.+?)(?=NEXT:|$)/s)?.[1]?.trim()
  const next = content.match(/NEXT:\s*(.+?)$/s)?.[1]?.trim()

  return { type: 'structured', score, feedback, improve, next }
}

function ScoreColor(score) {
  if (score >= 8) return '#22c55e'
  if (score >= 5) return '#f59e0b'
  return '#ef4444'
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  if (!isUser) {
    const parsed = parseAIMessage(message.content)

    if (parsed.type === 'structured') {
      return (
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', flexShrink: 0, marginTop: '4px'
          }}>🎯</div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Score Card */}
            <div style={{
              background: '#1e1e2e', border: '1px solid #2a2a3e',
              borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px'
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                border: `3px solid ${ScoreColor(parsed.score)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '20px', fontWeight: '700', color: ScoreColor(parsed.score) }}>
                  {parsed.score}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}>Your Score</div>
                <div style={{ fontSize: '14px', color: '#fff', fontWeight: '500' }}>
                  {parsed.score >= 8 ? '🔥 Excellent!' : parsed.score >= 5 ? '👍 Good effort!' : '💪 Keep practicing!'}
                </div>
              </div>
            </div>

            {/* Feedback */}
            {parsed.feedback && (
              <div style={{
                background: '#1e1e2e', border: '1px solid #2a2a3e',
                borderRadius: '16px', padding: '14px 16px'
              }}>
                <div style={{ fontSize: '11px', color: '#6c63ff', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📝 Feedback</div>
                <div style={{ fontSize: '14px', color: '#ccc', lineHeight: '1.6' }}>{parsed.feedback}</div>
              </div>
            )}

            {/* Improve */}
            {parsed.improve && (
              <div style={{
                background: '#1a1a2e', border: '1px solid #2a2a4e',
                borderRadius: '16px', padding: '14px 16px'
              }}>
                <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💡 Tip to Improve</div>
                <div style={{ fontSize: '14px', color: '#ccc', lineHeight: '1.6' }}>{parsed.improve}</div>
              </div>
            )}

            {/* Next Question */}
            {parsed.next && (
              <div style={{
                background: 'linear-gradient(135deg, #1e1e3e, #25253a)',
                border: '1px solid #6c63ff44',
                borderRadius: '16px', padding: '14px 16px'
              }}>
                <div style={{ fontSize: '11px', color: '#a78bfa', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎤 Next Question</div>
                <div style={{ fontSize: '15px', color: '#fff', lineHeight: '1.6', fontWeight: '500' }}>{parsed.next}</div>
              </div>
            )}
          </div>
        </div>
      )
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '16px',
      alignItems: 'flex-end',
      gap: '8px'
    }}>
      {!isUser && (
        <div style={{
          width: '32px', height: '32px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', flexShrink: 0
        }}>🎯</div>
      )}
      <div style={{
        maxWidth: '75%', padding: '14px 18px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser ? 'linear-gradient(135deg, #6c63ff, #8b5cf6)' : '#1e1e2e',
        border: isUser ? 'none' : '1px solid #2a2a3e',
        color: '#fff', fontSize: '15px', lineHeight: '1.6',
        boxShadow: isUser ? '0 4px 20px rgba(108,99,255,0.3)' : 'none'
      }}>
        {message.content}
      </div>
      {isUser && (
        <div style={{
          width: '32px', height: '32px', borderRadius: '10px',
          background: '#2a2a3e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', flexShrink: 0
        }}>👤</div>
      )}
    </div>
  )
}
