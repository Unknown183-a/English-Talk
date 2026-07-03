import express from 'express'
const router = express.Router()

router.post('/', async (req, res) => {
  const { text, from, to } = req.body
  if (!text || !from || !to) return res.status(400).json({ error: 'Missing fields' })

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.responseStatus === 200) {
      res.json({ translated: data.responseData.translatedText })
    } else {
      res.status(500).json({ error: 'Translation failed' })
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Translation error' })
  }
})

export default router
