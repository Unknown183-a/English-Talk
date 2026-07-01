import express from 'express'
import Groq from 'groq-sdk'

const router = express.Router()
const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

router.post('/', async (req, res) => {
  const { original, spoken, confidence } = req.body
  if (!original || !spoken) return res.status(400).json({ error: 'Missing text' })

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 512,
      messages: [
        {
          role: 'system',
          content: `You are a pronunciation coach for Indian English speakers. 
Compare what the person was supposed to say vs what they actually said, and score them.

Respond in this EXACT format:

CLARITY: [1-10]
ACCURACY: [1-10]
PACE: [1-10]
OVERALL: [1-10]
MISPRONOUNCED: [comma separated list of words they got wrong, or "None"]
TIP: [one specific, practical pronunciation tip based on their mistake. If no mistake, give a positive tip to sound more natural]
EXAMPLE: [write the target sentence with emphasis marks on key syllables like this: "pre-SEN-ta-tion" to show stress]`
        },
        {
          role: 'user',
          content: `Target sentence: "${original}"
What they said: "${spoken}"
Speech confidence score: ${Math.round((confidence || 0.8) * 100)}%

Score their pronunciation.`
        }
      ]
    })

    const text = response.choices[0].message.content
    const extract = (label) => {
      const m = text.match(new RegExp(`${label}:\\s*(.+?)(?=\\n[A-Z]+:|$)`, 's'))
      return m ? m[1].trim() : ''
    }

    res.json({
      clarity: parseInt(extract('CLARITY')) || 5,
      accuracy: parseInt(extract('ACCURACY')) || 5,
      pace: parseInt(extract('PACE')) || 5,
      overall: parseInt(extract('OVERALL')) || 5,
      mispronounced: extract('MISPRONOUNCED'),
      tip: extract('TIP'),
      example: extract('EXAMPLE'),
      original,
      spoken
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Scoring failed' })
  }
})

export default router
