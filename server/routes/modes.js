import express from 'express'
import Groq from 'groq-sdk'

const router = express.Router()
const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ── DEBATE ──────────────────────────────────────────────────
router.post('/debate/respond', async (req, res) => {
  const { topic, userSide, history, userMessage } = req.body
  const aiSide = userSide === 'for' ? 'against' : 'for'
  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content: `You are a sharp debate opponent. The debate topic is: "${topic}".
You are arguing ${aiSide.toUpperCase()} this topic. The user is arguing ${userSide.toUpperCase()}.
Rules:
- Give ONE strong counter-argument in 2-3 sentences max
- Be logical, use facts/examples
- Sound like a confident Indian student in a debate competition
- Do NOT repeat the user's points — challenge them directly
- End with a pointed question to the user`
        },
        ...history,
        { role: 'user', content: userMessage }
      ]
    })
    res.json({ reply: response.choices[0].message.content.trim() })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Debate response failed' })
  }
})

router.post('/debate/evaluate', async (req, res) => {
  const { topic, userSide, transcript } = req.body
  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: `You are a debate judge. Evaluate only the USER's arguments.
Respond in EXACT format:
ARGUMENT_STRENGTH: [1-10]
LOGIC: [1-10]
EVIDENCE: [1-10]
REBUTTAL: [1-10]
OVERALL: [1-10]
BEST_POINT: [their strongest argument in one line]
WEAKNESS: [their weakest argument in one line]
VERDICT: [Did they win or lose? One sentence]`
        },
        { role: 'user', content: `Topic: "${topic}"\nUser argued: ${userSide}\n\nTranscript:\n${transcript}` }
      ]
    })
    const text = response.choices[0].message.content
    const extract = (label) => {
      const m = text.match(new RegExp(`${label}:\\s*(.+?)(?=\\n[A-Z_]+:|$)`, 's'))
      return m ? m[1].trim() : ''
    }
    res.json({
      argumentStrength: parseInt(extract('ARGUMENT_STRENGTH')) || 5,
      logic: parseInt(extract('LOGIC')) || 5,
      evidence: parseInt(extract('EVIDENCE')) || 5,
      rebuttal: parseInt(extract('REBUTTAL')) || 5,
      overall: parseInt(extract('OVERALL')) || 5,
      bestPoint: extract('BEST_POINT'),
      weakness: extract('WEAKNESS'),
      verdict: extract('VERDICT'),
    })
  } catch (err) {
    res.status(500).json({ error: 'Evaluation failed' })
  }
})

// ── NEWS DISCUSSION ──────────────────────────────────────────
router.post('/news/headline', async (req, res) => {
  const { category } = req.body
  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: `Generate a realistic current affairs news headline relevant to India for category: ${category}.
Respond in EXACT format:
HEADLINE: [the headline]
CONTEXT: [2-3 sentences of background context]
QUESTION: [one open-ended discussion question about this news]`
        },
        { role: 'user', content: `Give me a news headline for: ${category}` }
      ]
    })
    const text = response.choices[0].message.content
    const extract = (label) => {
      const m = text.match(new RegExp(`${label}:\\s*(.+?)(?=\\n[A-Z]+:|$)`, 's'))
      return m ? m[1].trim() : ''
    }
    res.json({
      headline: extract('HEADLINE'),
      context: extract('CONTEXT'),
      question: extract('QUESTION'),
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to get headline' })
  }
})

router.post('/news/respond', async (req, res) => {
  const { headline, history, userMessage } = req.body
  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content: `You are a news anchor hosting a discussion on: "${headline}".
- Ask follow-up questions, challenge the user's views politely
- Give brief reactions to their points (1-2 sentences)
- Keep it like a TV panel discussion — professional but engaging
- End each response with a follow-up question`
        },
        ...history,
        { role: 'user', content: userMessage }
      ]
    })
    res.json({ reply: response.choices[0].message.content.trim() })
  } catch (err) {
    res.status(500).json({ error: 'News response failed' })
  }
})

router.post('/news/evaluate', async (req, res) => {
  const { headline, transcript } = req.body
  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: `Evaluate the user's English communication in this news discussion.
Respond in EXACT format:
FLUENCY: [1-10]
VOCABULARY: [1-10]
KNOWLEDGE: [1-10]
CONFIDENCE: [1-10]
OVERALL: [1-10]
STRENGTH: [one thing they did well]
TIP: [one improvement tip]`
        },
        { role: 'user', content: `News: "${headline}"\n\nTranscript:\n${transcript}` }
      ]
    })
    const text = response.choices[0].message.content
    const extract = (label) => {
      const m = text.match(new RegExp(`${label}:\\s*(.+?)(?=\\n[A-Z]+:|$)`, 's'))
      return m ? m[1].trim() : ''
    }
    res.json({
      fluency: parseInt(extract('FLUENCY')) || 5,
      vocabulary: parseInt(extract('VOCABULARY')) || 5,
      knowledge: parseInt(extract('KNOWLEDGE')) || 5,
      confidence: parseInt(extract('CONFIDENCE')) || 5,
      overall: parseInt(extract('OVERALL')) || 5,
      strength: extract('STRENGTH'),
      tip: extract('TIP'),
    })
  } catch (err) {
    res.status(500).json({ error: 'Evaluation failed' })
  }
})

// ── SITUATIONAL ENGLISH ──────────────────────────────────────
router.post('/situation/start', async (req, res) => {
  const { scenario } = req.body
  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 150,
      messages: [
        {
          role: 'system',
          content: `You are playing a character in a real-life English conversation scenario: ${scenario.role}.
Start the conversation naturally in 1-2 sentences as your character would.
Be realistic, use natural spoken English (not formal).`
        },
        { role: 'user', content: 'Start the scenario.' }
      ]
    })
    res.json({ reply: response.choices[0].message.content.trim() })
  } catch (err) {
    res.status(500).json({ error: 'Failed to start scenario' })
  }
})

router.post('/situation/respond', async (req, res) => {
  const { scenario, history, userMessage } = req.body
  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 150,
      messages: [
        {
          role: 'system',
          content: `You are playing: ${scenario.role} in scenario: ${scenario.label}.
Rules:
- Stay in character completely
- Use natural conversational English (not too formal)
- React realistically to what the user says
- Keep responses short (1-3 sentences)
- If user makes a major English mistake, gently correct it in character`
        },
        ...history,
        { role: 'user', content: userMessage }
      ]
    })
    res.json({ reply: response.choices[0].message.content.trim() })
  } catch (err) {
    res.status(500).json({ error: 'Response failed' })
  }
})

router.post('/situation/evaluate', async (req, res) => {
  const { scenario, transcript } = req.body
  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: `Evaluate the user's English in this real-life conversation scenario.
Respond in EXACT format:
NATURALNESS: [1-10]
VOCABULARY: [1-10]
GRAMMAR: [1-10]
CONFIDENCE: [1-10]
OVERALL: [1-10]
BEST_PHRASE: [best sentence they used]
TIP: [one improvement tip for real life conversations]`
        },
        { role: 'user', content: `Scenario: ${scenario.label}\n\nTranscript:\n${transcript}` }
      ]
    })
    const text = response.choices[0].message.content
    const extract = (label) => {
      const m = text.match(new RegExp(`${label}:\\s*(.+?)(?=\\n[A-Z_]+:|$)`, 's'))
      return m ? m[1].trim() : ''
    }
    res.json({
      naturalness: parseInt(extract('NATURALNESS')) || 5,
      vocabulary: parseInt(extract('VOCABULARY')) || 5,
      grammar: parseInt(extract('GRAMMAR')) || 5,
      confidence: parseInt(extract('CONFIDENCE')) || 5,
      overall: parseInt(extract('OVERALL')) || 5,
      bestPhrase: extract('BEST_PHRASE'),
      tip: extract('TIP'),
    })
  } catch (err) {
    res.status(500).json({ error: 'Evaluation failed' })
  }
})

export default router

// ── VIDEO INTERVIEW EVALUATE ─────────────────────────────────
router.post('/video/evaluate', async (req, res) => {
  const { question, answer, level } = req.body
  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: `You are an expert interview coach evaluating a video interview answer.
Respond in EXACT format:
OVERALL: [1-10]
CONTENT: [1-10]
FLUENCY: [1-10]
CONFIDENCE: [1-10]
STRENGTH: [one thing they did well in one line]
TIP: [one specific improvement tip]
BETTER_ANSWER: [a better version of their answer in 2-3 sentences]`
        },
        {
          role: 'user',
          content: `Question: "${question}"\nAnswer: "${answer}"\nLevel: ${level}`
        }
      ]
    })
    const text = response.choices[0].message.content
    const extract = (label) => {
      const m = text.match(new RegExp(`${label}:\\s*(.+?)(?=\\n[A-Z_]+:|$)`, 's'))
      return m ? m[1].trim() : ''
    }
    res.json({
      overall: parseInt(extract('OVERALL')) || 5,
      content: parseInt(extract('CONTENT')) || 5,
      fluency: parseInt(extract('FLUENCY')) || 5,
      confidence: parseInt(extract('CONFIDENCE')) || 5,
      strength: extract('STRENGTH'),
      tip: extract('TIP'),
      betterAnswer: extract('BETTER_ANSWER'),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Evaluation failed' })
  }
})
