export default function TopicSelector({ onSelect }) {
  const topics = [
    { id: 'hr', label: 'HR Interview', icon: '👔', desc: 'Behavioral & personality questions' },
    { id: 'tech', label: 'Technical', icon: '💻', desc: 'DSA, CS fundamentals & coding' },
    { id: 'gd', label: 'Group Discussion', icon: '🗣', desc: 'Topics & debate practice' },
    { id: 'intro', label: 'Introduce Yourself', icon: '🙋', desc: 'Perfect your self introduction' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: '#0f0f13',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '20px',
          background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', margin: '0 auto 16px',
          boxShadow: '0 0 40px rgba(108, 99, 255, 0.4)'
        }}>🎯</div>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#fff' }}>
          English Talk
        </h1>
        <p style={{ color: '#888', marginTop: '8px', fontSize: '15px' }}>
          AI-powered placement interview practice
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        width: '100%',
        maxWidth: '480px'
      }}>
        {topics.map(t => (
          <button key={t.id} onClick={() => onSelect(t.id)}
            style={{
              background: '#1e1e2e',
              border: '1px solid #2a2a3e',
              borderRadius: '16px',
              padding: '24px 20px',
              cursor: 'pointer',
              textAlign: 'left',
              color: '#fff',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => {
              e.currentTarget.style.border = '1px solid #6c63ff'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseOut={e => {
              e.currentTarget.style.border = '1px solid #2a2a3e'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>{t.icon}</div>
            <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '6px' }}>{t.label}</div>
            <div style={{ color: '#666', fontSize: '12px', lineHeight: '1.4' }}>{t.desc}</div>
          </button>
        ))}
      </div>

      <p style={{ color: '#444', fontSize: '12px', marginTop: '32px' }}>
        Powered by Groq AI • Built for engineering students
      </p>
    </div>
  )
}