import express from 'express'
const router = express.Router()

router.post('/', async (req, res) => {
  // TTS handled client-side via Web Speech API
  // This endpoint kept for compatibility
  res.json({ clientSide: true })
})

export default router
