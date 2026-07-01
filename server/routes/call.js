import express from 'express'
import Groq from 'groq-sdk'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()
const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TMP = path.join(__dirname, '../../tmp')
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true })

const AI_PERSONAS = {
  recruiter: {
    name: 'Priya Sharma',
    role: 'HR Recruiter · TCS',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    color: '#6c63ff',
    system: `You are Priya Sharma, a friendly but professional HR recruiter at TCS calling a fresher for a campus placement interview over phone.
Start by greeting them and asking them to introduce themselves.
After each response, give brief natural feedback like a real interviewer would ("Good!", "Interesting, tell me more", "I see") then ask the next question.
Keep responses SHORT — max 2-3 sentences. Sound natural, warm, professional.
Ask about: intro, education, projects, strengths, why TCS, salary expectations.`
  },
  tech_interviewer: {
    name: 'Rahul Verma',
    role: 'Senior Engineer · Google',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    color: '#06b6d4',
    system: `You are Rahul Verma, a senior software engineer at Google doing a technical phone screen for a fresher.
Ask technical questions about DSA, OOP, system design basics, CS fundamentals.
After each answer give brief natural reactions ("Nice approach", "That's correct but can you optimize?", "Good thinking").
Keep responses SHORT — max 2-3 sentences. Sound like a real tech interviewer on a call.`
  },
  english_coach: {
    name: 'Sarah Mitchell',
    role: 'English Coach · British Council',
    avatar: 'https://randomuser.me/api/portraits/women/29.jpg',
    color: '#10b981',
    system: `You are Sarah Mitchell, a friendly English speaking coach from British Council on a practice call with an Indian student.
Help them practice conversational English. Ask about their day, interests, goals, opinions on topics.
Gently correct grammar mistakes naturally ("You could also say it as...").
Keep responses SHORT — max 2-3 sentences. Be warm, encouraging, natural.`
  },
  manager: {
    name: 'Vikram Nair',
    role: 'Engineering Manager · Infosys',
    avatar: 'https://randomuser.me/api/portraits/men/75.jpg',
    color: '#f59e0b',
    system: `You are Vikram Nair, an engineering manager at Infosys calling for a managerial round interview.
Ask behavioral questions: leadership, teamwork, conflict resolution, career goals, achievements.
React naturally and ask follow-up questions. Keep it conversational.
Keep responses SHORT — max 2-3 sentences.`
  }
}

// Get AI text response
router.post('/respond', async (req, res) => {
  const { persona, history, userMessage, level } = req.body
  const ai = AI_PERSONAS[persona] || AI_PERSONAS.recruiter
  const levelInstruction = level === 'beginner' 
    ? 'The student is a BEGINNER - ask very simple questions, speak slowly and clearly, be very encouraging, use simple vocabulary.' 
    : level === 'advanced' 
    ? 'The student is ADVANCED - ask challenging questions, use professional vocabulary, push for detailed and structured answers.'
    : 'The student is INTERMEDIATE - moderate difficulty questions, balanced feedback.'

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 150,
      messages: [
        { role: 'system', content: ai.system + '\n\n' + levelInstruction },
        ...history.slice(-8),
        { role: 'user', content: userMessage }
      ]
    })
    res.json({ reply: response.choices[0].message.content.trim() })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'AI response failed' })
  }
})

// Text to speech
router.post('/speak', async (req, res) => {
  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'No text' })

  const outFile = path.join(TMP, `call_${Date.now()}.mp3`)
  const pyFile = path.join(TMP, `call_${Date.now()}.py`)
  try {
    const safe = text.slice(0, 300)
    const pyCode = `from gtts import gTTS\ngTTS(${JSON.stringify(safe)}, lang='en', tld='co.in').save(${JSON.stringify(outFile)})\n`
    fs.writeFileSync(pyFile, pyCode)
    execSync(`python3 "${pyFile}"`)
    fs.unlinkSync(pyFile)
    res.setHeader('Content-Type', 'audio/mpeg')
    const stream = fs.createReadStream(outFile)
    stream.pipe(res)
    stream.on('end', () => { try { fs.unlinkSync(outFile) } catch {} })
    stream.on('error', () => res.status(500).json({ error: 'Stream error' }))
  } catch (err) {
    try { fs.unlinkSync(pyFile) } catch {}
    console.error('TTS error:', err.message)
    res.status(500).json({ error: 'TTS failed' })
  }
})

// Evaluate call
router.post('/evaluate', async (req, res) => {
  const { persona, transcript } = req.body
  const ai = AI_PERSONAS[persona] || AI_PERSONAS.recruiter
  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: `You are evaluating a student's English speaking performance on a phone call with ${ai.name} (${ai.role}).
Evaluate ONLY the student's responses.

Respond in EXACT format:
FLUENCY: [1-10]
CONFIDENCE: [1-10]
GRAMMAR: [1-10]
VOCABULARY: [1-10]
OVERALL: [1-10]
STRENGTH: [one specific strength]
IMPROVE: [one specific area to improve]
TIP: [one practical tip for next call]
VERDICT: [one punchy line verdict]`
        },
        { role: 'user', content: `Call transcript:\n${transcript}\n\nEvaluate the student.` }
      ]
    })
    const text = response.choices[0].message.content
    const extract = (label) => {
      const m = text.match(new RegExp(`${label}:\\s*(.+?)(?=\\n[A-Z]+:|$)`, 's'))
      return m ? m[1].trim() : ''
    }
    res.json({
      fluency: parseInt(extract('FLUENCY')) || 5,
      confidence: parseInt(extract('CONFIDENCE')) || 5,
      grammar: parseInt(extract('GRAMMAR')) || 5,
      vocabulary: parseInt(extract('VOCABULARY')) || 5,
      overall: parseInt(extract('OVERALL')) || 5,
      strength: extract('STRENGTH'),
      improve: extract('IMPROVE'),
      tip: extract('TIP'),
      verdict: extract('VERDICT'),
      personas: AI_PERSONAS[persona]
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Evaluation failed' })
  }
})

// AI_PERSONAS exported inline
export default router
