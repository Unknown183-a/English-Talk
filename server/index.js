import dotenv from 'dotenv'
dotenv.config()
import path from 'path'
import { fileURLToPath } from 'url'

import express from 'express'
import cors from 'cors'
import chatRoute from './routes/chat.js'
import speakRoute from './routes/speak.js'
import pronunciationRoute from './routes/pronunciation.js'
import wordRoute from './routes/word.js'
import gdRoute from './routes/gd.js'
import modesRoute from './routes/modes.js'
import callRoute from './routes/call.js'

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.use('/api/chat', chatRoute)
app.use('/api/speak', speakRoute)
app.use('/api/pronunciation', pronunciationRoute)
app.use('/api/word', wordRoute)
app.use('/api/gd', gdRoute)
app.use('/api/modes', modesRoute)
app.use('/api/call', callRoute)

// Serve React frontend
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use(express.static(path.join(__dirname, '../frontend/dist')))
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

// DEBUG
app.post('/api/test', (req, res) => res.json({ ok: true }))

// DEBUG
app.post('/api/test', (req, res) => res.json({ ok: true }))
