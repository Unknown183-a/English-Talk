import express from 'express'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TMP = path.join(__dirname, '../../tmp')
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true })

router.post('/', async (req, res) => {
  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'No text' })

  const outFile = path.join(TMP, `tts_${Date.now()}.mp3`)
  const pyFile = path.join(TMP, `tts_${Date.now()}.py`)
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
    res.status(200).json({ error: 'TTS unavailable' })
  }
})

export default router
