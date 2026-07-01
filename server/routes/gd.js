import express from 'express'
import Groq from 'groq-sdk'

const router = express.Router()
const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

const personas = {
  arjun: {
    name: 'Arjun',
    role: 'The Agreeer',
    background: '3rd year CSE student from Delhi, interned at a startup, speaks confidently',
    style: `You agree with good points but add your own examples and data. 
You say things like "That's a valid point, and I'd like to add...", "Building on what was said...", "I completely agree, in fact...".
You bring in real Indian examples like IITs, Infosys, ISRO, Zomato, etc.
You are enthusiastic and positive but not a pushover.`,
    phrases: ['Absolutely right!', 'I agree, and to add to that...', 'That is a valid point.', 'Building on this idea...', 'In fact, research shows that...']
  },
  priya: {
    name: 'Priya',
    role: "Devil's Advocate",
    background: '4th year student from Mumbai, very sharp, questions everything politely but firmly',
    style: `You challenge every point with a counter-argument or tough question.
You say things like "But have we considered...", "I respectfully disagree because...", "That sounds good in theory but...", "What about the flip side?".
You bring up real problems, failures, and opposing views.
You are not rude but you are direct and sharp.`,
    phrases: ['But wait, have we considered...', 'I respectfully disagree.', 'That sounds good in theory, but...', 'What about the flip side?', 'Let me challenge that point...']
  },
  ravi: {
    name: 'Ravi',
    role: 'The Analyst',
    background: '3rd year student from Bangalore, calm, structured thinker, likes to summarize and give structure',
    style: `You are neutral and analytical. You summarize what has been said, bring structure, and redirect the discussion.
You say things like "Let me summarize the key points so far...", "Looking at this from a data perspective...", "I think we need to consider both sides...", "To conclude this point...".
You bring in statistics, frameworks like pros/cons, and keep the GD on track.`,
    phrases: ['Let me summarize...', 'Looking at the data...', 'From a structured perspective...', 'Both sides have merit, but...', 'To bring this together...']
  },
}

router.post('/respond', async (req, res) => {
  const { topic, history, userMessage, speaker } = req.body
  const persona = personas[speaker] || personas.arjun

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 150,
      messages: [
        {
          role: 'system',
          content: `You are ${persona.name} in a real campus placement Group Discussion on: "${topic}".

Your background: ${persona.background}
Your speaking style: ${persona.style}

STRICT RULES:
- Reply in 2-3 sentences ONLY. No more.
- Sound like a real Indian engineering student speaking in a GD — natural, confident, professional.
- React DIRECTLY to what the user just said. Don't ignore their point.
- Do NOT start with your own name.
- Do NOT use bullet points or lists.
- Use natural transitions like: ${persona.phrases.join(', ')}.
- Speak in flowing conversational English, not robotic or formal essay style.
- Occasionally address the user directly: "You raised a good point about X, but..."
- Keep it real — mention Indian context, companies, colleges when relevant.`
        },
        ...history.slice(-6).map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })),
        { role: 'user', content: `[User said]: ${userMessage}` }
      ]
    })
    res.json({ reply: response.choices[0].message.content.trim(), speaker: persona.name })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'GD response failed' })
  }
})

router.post('/chime', async (req, res) => {
  // Second AI chimes in naturally without being prompted by user
  const { topic, history, lastAIMessage, speaker } = req.body
  const persona = personas[speaker] || personas.ravi

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 120,
      messages: [
        {
          role: 'system',
          content: `You are ${persona.name} in a GD on "${topic}". ${persona.style}
Another participant just said: "${lastAIMessage}"
React to THAT naturally in 1-2 sentences. Sound like you're jumping into the conversation spontaneously.
Do NOT start with your name. Keep it very short and punchy.`
        },
        { role: 'user', content: lastAIMessage }
      ]
    })
    res.json({ reply: response.choices[0].message.content.trim(), speaker: persona.name })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Chime failed' })
  }
})

router.post('/evaluate', async (req, res) => {
  const { topic, transcript } = req.body
  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 700,
      messages: [
        {
          role: 'system',
          content: `You are a senior HR evaluator from a top Indian company evaluating a student's GD performance for campus placement.
Evaluate the USER's performance ONLY (not Arjun, Priya, or Ravi).

Be specific — mention actual things the user said in your feedback.

Respond in this EXACT format:

LEADERSHIP: [1-10]
CLARITY: [1-10]
LOGIC: [1-10]
CONFIDENCE: [1-10]
PARTICIPATION: [1-10]
OVERALL: [1-10]
STRENGTH: [one specific strength based on what they actually said]
WEAKNESS: [one specific weakness based on what they actually said or failed to say]
TIP: [one very practical, actionable tip for their next GD - be specific]
VERDICT: [one punchy verdict line like "Strong contributor - ready for placement GDs" or "Good start but needs more assertiveness"]`
        },
        {
          role: 'user',
          content: `GD Topic: "${topic}"\n\nFull transcript:\n${transcript}\n\nEvaluate only the USER's contributions.`
        }
      ]
    })

    const text = response.choices[0].message.content
    const extract = (label) => {
      const m = text.match(new RegExp(`${label}:\\s*(.+?)(?=\\n[A-Z]+:|$)`, 's'))
      return m ? m[1].trim() : ''
    }

    res.json({
      leadership: parseInt(extract('LEADERSHIP')) || 5,
      clarity: parseInt(extract('CLARITY')) || 5,
      logic: parseInt(extract('LOGIC')) || 5,
      confidence: parseInt(extract('CONFIDENCE')) || 5,
      participation: parseInt(extract('PARTICIPATION')) || 5,
      overall: parseInt(extract('OVERALL')) || 5,
      strength: extract('STRENGTH'),
      weakness: extract('WEAKNESS'),
      tip: extract('TIP'),
      verdict: extract('VERDICT'),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Evaluation failed' })
  }
})

export default router
