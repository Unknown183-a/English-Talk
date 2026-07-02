import express from 'express'
import Groq from 'groq-sdk'

const router = express.Router()
const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

router.post('/daily', async (req, res) => {
  const { date } = req.body
  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: `You are a vocabulary coach for Indian English learners preparing for interviews.
Give exactly 12 useful professional/interview English words for today.
Respond in this EXACT JSON format, no extra text:
[
  {
    "word": "...",
    "phonetic": "...",
    "partOfSpeech": "...",
    "meaning": "...",
    "example": "...",
    "synonyms": "...",
    "memoryTip": "..."
  }
]`
        },
        { role: 'user', content: `Date: ${date}. Give me 12 words for today. Return only JSON array.` }
      ]
    })

    let text = response.choices[0].message.content.trim()
    text = text.replace(/^\`\`\`json\n?/, '').replace(/\`\`\`$/, '').trim()
    const words = JSON.parse(text)
    res.json({ words, date })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get words' })
  }
})

router.post('/quiz', async (req, res) => {
  const { word, meaning, userSentence } = req.body
  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 256,
      messages: [
        {
          role: 'system',
          content: `You are an encouraging English coach helping Indian students prepare for interviews. You ALWAYS motivate and uplift — never discourage. Respond in this EXACT format:

SCORE: [1-10]
CORRECT: [Yes/No]
FEEDBACK: [1-2 lines — always start with something positive, then gently suggest improvement. Never say "incorrect" or "wrong". Say things like "Good attempt!", "Nice try!", "You're on the right track!"]
BETTER: [a better sentence example, or "Perfect! Keep it up!" if score is 8+]`
        },
        {
          role: 'user',
          content: `Word: "${word}" (meaning: ${meaning})\nUser sentence: "${userSentence}"\nScore their usage.`
        }
      ]
    })

    const text = response.choices[0].message.content
    const extract = (label) => {
      const m = text.match(new RegExp(label + ':\\s*(.+?)(?=\\n[A-Z]+:|$)', 's'))
      return m ? m[1].trim() : ''
    }
    res.json({
      score: parseInt(extract('SCORE')) || 5,
      correct: extract('CORRECT'),
      feedback: extract('FEEDBACK'),
      better: extract('BETTER')
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Quiz check failed' })
  }
})

export default router
