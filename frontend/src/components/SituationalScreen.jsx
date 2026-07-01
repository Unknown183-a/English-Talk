import { useState, useRef, useEffect } from 'react'

const BADGES = ['MOST VIEWED', 'TRENDING NOW', 'NEWLY ADDED', 'MOST VIEWED', 'TRENDING NOW']
const BADGE_COLORS = { 'MOST VIEWED': '#f59e0b', 'TRENDING NOW': '#22c55e', 'NEWLY ADDED': '#6c63ff' }

const CATEGORIES = [
  {
    id: 'job',
    label: 'Job Interview',
    icon: '💼',
    scenarios: [
      { id: 's1', label: 'Introduce Yourself', difficulty: 'Easy', mins: 8, badge: 'MOST VIEWED', gender: 'male', photo: 'https://randomuser.me/api/portraits/men/32.jpg', sceneImg: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=280&fit=crop', name: 'Mr. Sharma', role: 'You are a strict HR manager interviewing a fresher for a software job. Start by asking them to introduce themselves.' },
      { id: 's2', label: 'Describe Your Education', difficulty: 'Easy', mins: 6, badge: 'TRENDING NOW', gender: 'female', photo: 'https://randomuser.me/api/portraits/women/44.jpg', sceneImg: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=280&fit=crop', name: 'Ms. Priya', role: 'You are a friendly HR from an IT company. Ask the candidate about their educational background.' },
      { id: 's3', label: 'Talk About Experience', difficulty: 'Medium', mins: 6, badge: 'MOST VIEWED', gender: 'male', photo: 'https://randomuser.me/api/portraits/men/55.jpg', sceneImg: 'https://images.unsplash.com/photo-1565688534245-05d6b5be184a?w=400&h=280&fit=crop', name: 'Mr. Raj', role: 'You are a senior technical interviewer. Ask about their project experience and internships.' },
      { id: 's4', label: 'Salary Negotiation', difficulty: 'Hard', mins: 8, badge: 'NEWLY ADDED', gender: 'female', photo: 'https://randomuser.me/api/portraits/women/68.jpg', sceneImg: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=280&fit=crop', name: 'Ms. Anita', role: 'You are an HR discussing salary package with a candidate who has another offer. Be firm but fair.' },
      { id: 's5', label: 'Why Should We Hire You', difficulty: 'Medium', mins: 7, badge: 'TRENDING NOW', gender: 'male', photo: 'https://randomuser.me/api/portraits/men/75.jpg', sceneImg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=280&fit=crop', name: 'Mr. Vikram', role: 'You are a hiring manager for a top MNC. Challenge the candidate to justify why they are the best fit.' },
    ]
  },
  {
    id: 'office',
    label: 'Talk in Office',
    icon: '🏢',
    scenarios: [
      { id: 'o1', label: 'Greet & Chat with Co-workers', difficulty: 'Easy', mins: 7, badge: 'MOST VIEWED', gender: 'female', photo: 'https://randomuser.me/api/portraits/women/22.jpg', sceneImg: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=280&fit=crop', name: 'Neha', role: 'You are a friendly colleague on the first day of a new employee. Make small talk and introduce them to office culture.' },
      { id: 'o2', label: 'Talk in Team Meetings', difficulty: 'Medium', mins: 6, badge: 'NEWLY ADDED', gender: 'male', photo: 'https://randomuser.me/api/portraits/men/41.jpg', sceneImg: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=280&fit=crop', name: 'Arjun', role: 'You are a team lead running a weekly sprint meeting. Ask for status updates and push the user for clarity.' },
      { id: 'o3', label: 'Appraisal Meeting', difficulty: 'Hard', mins: 8, badge: 'MOST VIEWED', gender: 'female', photo: 'https://randomuser.me/api/portraits/women/55.jpg', sceneImg: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=280&fit=crop', name: 'Ms. Kavya', role: 'You are a manager conducting annual appraisal. Ask the employee to rate their own performance and discuss growth.' },
      { id: 'o4', label: 'Present Your Ideas', difficulty: 'Medium', mins: 7, badge: 'TRENDING NOW', gender: 'male', photo: 'https://randomuser.me/api/portraits/men/62.jpg', sceneImg: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=280&fit=crop', name: 'Mr. Rahul', role: 'You are a senior manager listening to a team member pitch a new product idea. Ask tough but fair questions.' },
      { id: 'o5', label: 'Handle a Complaint', difficulty: 'Hard', mins: 6, badge: 'NEWLY ADDED', gender: 'female', photo: 'https://randomuser.me/api/portraits/women/33.jpg', sceneImg: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=280&fit=crop', name: 'Ms. Divya', role: 'You are an angry client complaining about delayed project delivery. The user must handle your complaint professionally.' },
    ]
  },
  {
    id: 'daily',
    label: 'Talk to Family & Friends',
    icon: '👨‍👩‍👧',
    scenarios: [
      { id: 'd1', label: 'Make New Friends', difficulty: 'Easy', mins: 7, badge: 'MOST VIEWED', gender: 'male', photo: 'https://randomuser.me/api/portraits/men/28.jpg', sceneImg: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=280&fit=crop', name: 'Rohan', role: 'You are a new student at a college. Strike up a friendly conversation with another student.' },
      { id: 'd2', label: 'Plan a Family Dinner', difficulty: 'Easy', mins: 5, badge: 'TRENDING NOW', gender: 'female', photo: 'https://randomuser.me/api/portraits/women/12.jpg', sceneImg: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=280&fit=crop', name: 'Meera', role: 'You are planning a family dinner and discussing options with a family member. Be cheerful and practical.' },
      { id: 'd3', label: 'Convince Your Parents', difficulty: 'Medium', mins: 8, badge: 'NEWLY ADDED', gender: 'male', photo: 'https://randomuser.me/api/portraits/men/85.jpg', sceneImg: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=400&h=280&fit=crop', name: 'Dad', role: 'You are a traditional Indian father. The user wants to convince you to let them study abroad. Be skeptical but open.' },
      { id: 'd4', label: 'Catch Up with Old Friend', difficulty: 'Easy', mins: 6, badge: 'MOST VIEWED', gender: 'female', photo: 'https://randomuser.me/api/portraits/women/48.jpg', sceneImg: 'https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=400&h=280&fit=crop', name: 'Priyanka', role: 'You are an old school friend reconnecting after 5 years. Be excited and ask lots of catching up questions.' },
    ]
  },
  {
    id: 'travel',
    label: 'Travel & Places',
    icon: '✈️',
    scenarios: [
      { id: 't1', label: 'At the Airport', difficulty: 'Easy', mins: 6, badge: 'MOST VIEWED', gender: 'female', photo: 'https://randomuser.me/api/portraits/women/29.jpg', sceneImg: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=280&fit=crop', name: 'Airport Staff', role: 'You are an airport check-in staff. Help the passenger with boarding but ask for their documents and details.' },
      { id: 't2', label: 'Hotel Check-in', difficulty: 'Easy', mins: 7, badge: 'TRENDING NOW', gender: 'male', photo: 'https://randomuser.me/api/portraits/men/36.jpg', sceneImg: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=280&fit=crop', name: 'Hotel Staff', role: 'You are a 5-star hotel receptionist. Welcome the guest professionally and handle their check-in requests.' },
      { id: 't3', label: 'Ask for Directions', difficulty: 'Easy', mins: 5, badge: 'NEWLY ADDED', gender: 'female', photo: 'https://randomuser.me/api/portraits/women/60.jpg', sceneImg: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=280&fit=crop', name: 'Local', role: 'You are a local person in a new city. Help the tourist find their way to a famous landmark using English.' },
      { id: 't4', label: 'Taxi/Cab Driver', difficulty: 'Easy', mins: 6, badge: 'MOST VIEWED', gender: 'male', photo: 'https://randomuser.me/api/portraits/men/48.jpg', sceneImg: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=280&fit=crop', name: 'Driver', role: 'You are a cab driver in a new city. Make small talk with the passenger and tell them about local places.' },
    ]
  },
  {
    id: 'services',
    label: 'Services & Shops',
    icon: '🏪',
    scenarios: [
      { id: 'sv1', label: 'At the Restaurant', difficulty: 'Easy', mins: 6, badge: 'MOST VIEWED', gender: 'male', photo: 'https://randomuser.me/api/portraits/men/20.jpg', sceneImg: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=280&fit=crop', name: 'Waiter', role: 'You are a polite waiter at a fine dining restaurant. Take the order, suggest specials, and handle requests.' },
      { id: 'sv2', label: 'Doctor Consultation', difficulty: 'Medium', mins: 8, badge: 'TRENDING NOW', gender: 'female', photo: 'https://randomuser.me/api/portraits/women/38.jpg', sceneImg: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=280&fit=crop', name: 'Dr. Sharma', role: 'You are a doctor. Ask the patient about their symptoms, medical history, and give basic advice.' },
      { id: 'sv3', label: 'Bank Visit', difficulty: 'Medium', mins: 7, badge: 'NEWLY ADDED', gender: 'male', photo: 'https://randomuser.me/api/portraits/men/52.jpg', sceneImg: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=400&h=280&fit=crop', name: 'Bank Manager', role: 'You are a bank manager helping a customer open an account or resolve an issue. Be professional and ask for KYC.' },
      { id: 'sv4', label: 'Shopping Assistant', difficulty: 'Easy', mins: 6, badge: 'MOST VIEWED', gender: 'female', photo: 'https://randomuser.me/api/portraits/women/71.jpg', sceneImg: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400&h=280&fit=crop', name: 'Sales Staff', role: 'You are a sales assistant at a clothing store. Help the customer find what they need and upsell politely.' },
      { id: 'sv5', label: 'Customer Support Call', difficulty: 'Hard', mins: 8, badge: 'NEWLY ADDED', gender: 'male', photo: 'https://randomuser.me/api/portraits/men/67.jpg', sceneImg: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=400&h=280&fit=crop', name: 'Support Agent', role: 'You are a customer support agent. The user has a complaint about a product. Handle it professionally.' },
    ]
  },
]

const ALL_SCENARIOS = CATEGORIES.flatMap(c => c.scenarios.map(s => ({ ...s, category: c.label })))

const DIFF_COLOR = { Easy: '#22c55e', Medium: '#f59e0b', Hard: '#ef4444' }
const DIFF_BG = { Easy: '#f0fdf4', Medium: '#fffbeb', Hard: '#fff5f5' }

function getScoreColor(s) { return s >= 8 ? '#22c55e' : s >= 6 ? '#f59e0b' : '#ef4444' }

function speakWithVoice(text, gender) {
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-IN'
  u.rate = 0.92
  const voices = window.speechSynthesis.getVoices()
  let chosen = null
  if (gender === 'female') {
    chosen = voices.find(v => v.name.match(/samantha|victoria|karen|female|woman/i) && v.lang.startsWith('en'))
      || voices.find(v => v.lang.startsWith('en') && v.name.includes('Google') && v.name.toLowerCase().includes('female'))
      || voices.find(v => v.lang.startsWith('en-IN'))
  } else {
    chosen = voices.find(v => v.name.match(/daniel|alex|fred|rishi|male|man/i) && v.lang.startsWith('en'))
      || voices.find(v => v.lang.startsWith('en') && v.name.includes('Google UK English Male'))
  }
  if (!chosen) chosen = voices.find(v => v.lang.startsWith('en'))
  if (chosen) u.voice = chosen
  u.pitch = gender === 'female' ? 1.3 : 0.85
  window.speechSynthesis.speak(u)
}

export default function SituationalScreen({ onBack }) {
  const [phase, setPhase] = useState('select')
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [result, setResult] = useState(null)
  const [turnCount, setTurnCount] = useState(0)
  const [activeCategory, setActiveCategory] = useState('all')
  const bottomRef = useRef(null)
  const recognitionRef = useRef(null)
  const historyRef = useRef([])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const pickRandom = () => {
    const r = ALL_SCENARIOS[Math.floor(Math.random() * ALL_SCENARIOS.length)]
    setSelected(r)
    startScenario(r)
  }

  const startScenario = async (scenario) => {
    const s = scenario || selected
    setPhase('chat')
    setLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/modes/situation/start', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: s })
      })
      const data = await res.json()
      setMessages([{ role: 'ai', content: data.reply }])
      historyRef.current = [{ role: 'assistant', content: data.reply }]
      speakWithVoice(data.reply, s.gender)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userText = input.trim(); setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userText }])
    historyRef.current.push({ role: 'user', content: userText })
    setLoading(true); setTurnCount(p => p + 1)
    try {
      const res = await fetch('http://localhost:5000/api/modes/situation/respond', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: selected, history: historyRef.current.slice(-6), userMessage: userText })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }])
      historyRef.current.push({ role: 'assistant', content: data.reply })
      speakWithVoice(data.reply, selected.gender)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const endScenario = async () => {
    window.speechSynthesis.cancel(); setLoading(true)
    const transcript = messages.map(m => `${m.role === 'user' ? 'User' : selected.name}: ${m.content}`).join('\n')
    try {
      const res = await fetch('http://localhost:5000/api/modes/situation/evaluate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: selected, transcript })
      })
      const data = await res.json(); setResult(data); setPhase('result')
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Use Chrome'); return }
    const r = new SR(); r.lang = 'en-IN'; r.interimResults = true; r.continuous = false
    recognitionRef.current = r
    r.onstart = () => setListening(true)
    r.onresult = e => setInput(Array.from(e.results).map(r => r[0].transcript).join(''))
    r.onend = () => setListening(false); r.onerror = () => setListening(false)
    r.start()
  }

  // ── SELECT SCREEN ──────────────────────────────────────
  const DIFF_DOTS = { Easy: 1, Medium: 2, Hard: 3 }
  const userLevel = localStorage.getItem('englishtalk_level') || 'beginner'
  const isLocked = (difficulty) => {
    if (userLevel === 'beginner' && difficulty === 'Hard') return true
    if (userLevel === 'beginner' && difficulty === 'Medium') return false
    return false
  }

  if (phase === 'select') return (
    <div style={{ minHeight:'100vh', background:'#fff', fontFamily:"'Nunito', sans-serif", paddingBottom:'40px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        .scene-card:active { transform: scale(0.97); }
        .scene-card { transition: transform 0.15s ease; cursor: pointer; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header */}
      <div style={{ padding:'16px 20px 12px', display:'flex', alignItems:'center', gap:'12px', borderBottom:'1px solid #f0f0f5', position:'sticky', top:0, background:'#fff', zIndex:10 }}>
        <button onClick={onBack} style={{ width:'36px', height:'36px', borderRadius:'10px', border:'1px solid #e5e7eb', background:'#f8f8f8', color:'#333', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
        <div>
          <h2 style={{ margin:0, fontSize:'18px', fontWeight:'900', color:'#1a1a2e' }}>AI Conversations</h2>
          <p style={{ margin:0, fontSize:'12px', color:'#aaa', fontWeight:'600' }}>Practice real-life English situations</p>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ padding:'12px 20px' }}>
        <div style={{ background:'#f5f5f8', borderRadius:'14px', padding:'10px 16px', display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'16px', color:'#aaa' }}>🔍</span>
          <span style={{ color:'#bbb', fontSize:'14px', fontWeight:'600' }}>Search conversations...</span>
        </div>
      </div>

      {/* Categories with horizontal scroll cards */}
      {CATEGORIES.map(cat => (
        <div key={cat.id} style={{ marginBottom:'8px' }}>
          {/* Category header */}
          <div style={{ padding:'8px 20px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <h3 style={{ margin:0, fontSize:'16px', fontWeight:'900', color:'#1a1a2e' }}>{cat.label}</h3>
            <span style={{ color:'#6c63ff', fontSize:'12px', fontWeight:'800', cursor:'pointer' }}>See all →</span>
          </div>

          {/* Horizontal scroll */}
          <div style={{ display:'flex', gap:'12px', overflowX:'auto', padding:'0 20px 12px', scrollbarWidth:'none' }}>
            {cat.scenarios.map(s => (
              <div key={s.id} className="scene-card" onClick={() => { if(!isLocked(s.difficulty)){setSelected(s); setPhase('chat')} }}
                style={{ flexShrink:0, width:'180px', borderRadius:'18px', overflow:'hidden', background: isLocked(s.difficulty) ? '#f9f9fb' : '#fff', boxShadow:'0 2px 16px rgba(0,0,0,0.10)', border:'1px solid #f0f0f5', opacity: isLocked(s.difficulty) ? 0.7 : 1 }}>

                {/* Scene image */}
                <div style={{ position:'relative', height:'130px', overflow:'hidden', background:'#f0f0f5' }}>
                  <img src={s.sceneImg} alt={s.label}
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}
                    onError={e => { e.target.style.display='none'; e.target.parentElement.style.background='linear-gradient(135deg,#6c63ff,#8b5cf6)' }}
                  />
                  {isLocked(s.difficulty) && (
                  <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:'24px' }}>🔒</div>
                      <div style={{ color:'#fff', fontSize:'10px', fontWeight:'800', marginTop:'4px' }}>Level Up to Unlock</div>
                    </div>
                  </div>
                )}
                {/* Badge */}
                  <div style={{
                    position:'absolute', top:'8px', left:'8px',
                    background: BADGE_COLORS[s.badge] || '#f59e0b',
                    borderRadius:'6px', padding:'2px 7px',
                    fontSize:'8px', fontWeight:'900', color:'#fff', letterSpacing:'0.5px'
                  }}>{s.badge}</div>
                  {/* AI person avatar */}
                  <div style={{ position:'absolute', bottom:'-16px', left:'12px', width:'36px', height:'36px', borderRadius:'50%', border:'2px solid #fff', overflow:'hidden', background:'#e5e7eb' }}>
                    <img src={s.photo} alt={s.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
                  </div>
                </div>

                {/* Card info */}
                <div style={{ padding:'20px 12px 14px' }}>
                  {/* Difficulty dots */}
                  <div style={{ display:'flex', alignItems:'center', gap:'4px', marginBottom:'6px' }}>
                    <span style={{ fontSize:'10px', color:'#aaa', fontWeight:'700' }}>🕐 {s.mins} Mins</span>
                    <span style={{ color:'#ddd', margin:'0 4px' }}>·</span>
                    <div style={{ display:'flex', gap:'2px' }}>
                      {[1,2,3].map(d => (
                        <div key={d} style={{ width:'6px', height:'6px', borderRadius:'50%', background: d <= DIFF_DOTS[s.difficulty] ? DIFF_COLOR[s.difficulty] : '#e5e7eb' }} />
                      ))}
                    </div>
                    <span style={{ fontSize:'10px', color: DIFF_COLOR[s.difficulty], fontWeight:'700', marginLeft:'2px' }}>{s.difficulty}</span>
                  </div>
                  <p style={{ margin:0, fontSize:'13px', fontWeight:'800', color:'#1a1a2e', lineHeight:'1.3' }}>{s.label}</p>
                  <p style={{ margin:'3px 0 0', fontSize:'11px', color:'#aaa', fontWeight:'600' }}>with {s.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  if (phase === 'result') return (
    <div style={{ minHeight: '100vh', background: '#f5f7ff', fontFamily: "'Nunito', sans-serif", padding: '40px 16px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');`}</style>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src={selected.photo} alt={selected.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '12px', border: `4px solid ${getScoreColor(result?.overall)}` }} />
          <h2 style={{ fontWeight: '900', fontSize: '22px', color: '#1a1a2e', margin: '0 0 4px' }}>{selected.label}</h2>
          <p style={{ color: '#888', fontSize: '13px', margin: '0 0 8px' }}>with {selected.name}</p>
          <div style={{ fontWeight: '900', fontSize: '40px', color: getScoreColor(result?.overall) }}>{result?.overall}/10</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[['🗣️ Naturalness', result?.naturalness], ['📚 Vocabulary', result?.vocabulary], ['✏️ Grammar', result?.grammar], ['💪 Confidence', result?.confidence]].map(([label, val], i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '16px', padding: '14px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: '900', fontSize: '22px', color: getScoreColor(val) }}>{val}/10</div>
              <div style={{ color: '#888', fontSize: '11px', fontWeight: '700' }}>{label}</div>
            </div>
          ))}
        </div>
        {result?.bestPhrase && (
          <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '16px', padding: '14px', marginBottom: '10px' }}>
            <p style={{ margin: '0 0 5px', color: '#059669', fontSize: '10px', fontWeight: '800' }}>✅ BEST PHRASE YOU USED</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#1a1a2e', fontStyle: 'italic' }}>"{result.bestPhrase}"</p>
          </div>
        )}
        <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '16px', padding: '14px', marginBottom: '20px' }}>
          <p style={{ margin: '0 0 5px', color: '#b45309', fontSize: '10px', fontWeight: '800' }}>💡 TIP</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#92400e' }}>{result?.tip}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => { setPhase('select'); setMessages([]); setResult(null); setTurnCount(0); setSelected(null) }} style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'none', border: '2px solid #7c3aed', color: '#7c3aed', fontWeight: '800', fontSize: '13px', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>🔄 Try Another</button>
          <button onClick={onBack} style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'linear-gradient(135deg, #7c3aed, #4c1d95)', border: 'none', color: '#fff', fontWeight: '800', fontSize: '13px', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>🏠 Home</button>
        </div>
      </div>
    </div>
  )

  // ── CHAT SCREEN ──────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '680px', height: '100vh', background: '#0f0f13', fontFamily: "'Nunito', sans-serif", zIndex: 100 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }`}</style>

      {/* Header with photo */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e2e', background: '#0f0f13', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={onBack} style={{ width: '34px', height: '34px', borderRadius: '10px', border: '1px solid #2a2a3e', background: '#1e1e2e', color: '#fff', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
        <img src={selected?.photo} alt={selected?.name} style={{ width: '38px', height: '38px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '800', fontSize: '14px', color: '#fff' }}>{selected?.name}</div>
          <div style={{ color: '#6c63ff', fontSize: '11px' }}>● {selected?.label} · {selected?.gender === 'female' ? '👩 Female voice' : '👨 Male voice'}</div>
        </div>
        <div style={{ display: 'flex', flex: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ background: DIFF_BG[selected?.difficulty], color: DIFF_COLOR[selected?.difficulty], borderRadius: '8px', padding: '3px 8px', fontSize: '10px', fontWeight: '800' }}>{selected?.difficulty}</span>
        </div>
        {turnCount >= 3 && <button onClick={endScenario} style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)', border: 'none', borderRadius: '10px', padding: '7px 12px', color: '#fff', fontWeight: '800', fontSize: '11px', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', flexShrink: 0 }}>End ✓</button>}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: '14px', display: 'flex', flexDirection: msg.role === 'ai' ? 'row' : 'row-reverse', gap: '8px', alignItems: 'flex-start', animation: 'fadeIn 0.3s ease' }}>
            {msg.role === 'ai'
              ? <img src={selected?.photo} alt={selected?.name} style={{ width: '34px', height: '34px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #7c3aed, #4c1d95)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>🙋</div>
            }
            <div style={{ maxWidth: '75%' }}>
              {msg.role === 'ai' && <div style={{ fontSize: '10px', fontWeight: '800', color: '#7c3aed', marginBottom: '4px' }}>{selected?.name}</div>}
              <div style={{ padding: '10px 14px', borderRadius: msg.role === 'ai' ? '4px 14px 14px 14px' : '14px 4px 14px 14px', background: msg.role === 'ai' ? '#1e1e2e' : 'linear-gradient(135deg, #7c3aed, #4c1d95)', color: '#fff', fontSize: '13px', lineHeight: '1.6', fontWeight: '600' }}>{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <img src={selected?.photo} alt="" style={{ width: '34px', height: '34px', borderRadius: '10px', objectFit: 'cover' }} />
            <div style={{ color: '#555', fontSize: '13px' }}>typing...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {listening && <div style={{ margin: '0 16px 8px', padding: '8px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#ef4444', fontSize: '12px', fontWeight: '700' }}>🔴 Listening...</div>}

      <div style={{ padding: '12px 16px', borderTop: '1px solid #1e1e2e', display: 'flex', gap: '8px', alignItems: 'center', background: '#0f0f13' }}>
        <button onClick={listening ? () => recognitionRef.current?.stop() : startListening} style={{ width: '44px', height: '44px', borderRadius: '12px', border: listening ? '1px solid #ef4444' : '1px solid #2a2a3e', background: listening ? 'rgba(239,68,68,0.15)' : '#1e1e2e', color: listening ? '#ef4444' : '#888', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{listening ? '⏹' : '🎤'}</button>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder={`Reply to ${selected?.name}...`} style={{ flex: 1, padding: '12px 14px', borderRadius: '12px', border: '1px solid #2a2a3e', background: '#1e1e2e', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'Nunito, sans-serif' }} onFocus={e => e.target.style.border = '1px solid #7c3aed'} onBlur={e => e.target.style.border = '1px solid #2a2a3e'} />
        <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ width: '44px', height: '44px', borderRadius: '12px', border: 'none', background: loading || !input.trim() ? '#2a2a3e' : 'linear-gradient(135deg, #7c3aed, #4c1d95)', color: '#fff', fontSize: '18px', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>➤</button>
      </div>
    </div>
  )
}
