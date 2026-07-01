import express from 'express'
import Groq from 'groq-sdk'

const router = express.Router()
const client = new Groq({ apiKey: process.env.GROQ_API_KEY || process.env.GROQ_API_KEY })

router.post('/', async (req, res) => {
  const { messages, topic, level } = req.body

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: `You are an English speaking coach helping Indian engineering students prepare for campus placements and internship interviews.

Your job:
- Ask ONE interview question at a time based on the topic: ${topic}
- After the student answers, respond in EXACTLY this format:

SCORE: [number from 1-10]
FEEDBACK: [2-3 lines on clarity, grammar, confidence]
IMPROVE: [1 specific tip to do better]
NEXT: [your next interview question]

Keep tone friendly and encouraging. Use simple English.`
        },
        ...messages
      ]
    })

    res.json({ reply: response.choices[0].message.content })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

export default router
