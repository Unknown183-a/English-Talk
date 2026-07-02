/**
 * useMic — Global mic hook with 8-second silence timeout and append mode.
 * Use this in every component instead of raw SpeechRecognition.
 *
 * Usage:
 *   const { listening, startListening, stopListening } = useMic({
 *     onTranscript: (text) => setInput(text),
 *     append: true,       // append to existing text (default true)
 *     silenceMs: 8000,    // silence before auto-stop (default 8000)
 *   })
 */
import { useRef, useState } from 'react'

export default function useMic({ onTranscript, append = true, silenceMs = 8000 } = {}) {
  const recognitionRef = useRef(null)
  const silenceTimerRef = useRef(null)
  const accumulatedRef = useRef('')
  const [listening, setListening] = useState(false)

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  const stopListening = () => {
    clearSilenceTimer()
    recognitionRef.current?.stop()
    setListening(false)
  }

  const startListening = (existingText = '') => {
    if (listening) { stopListening(); return }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser.')
      return
    }

    accumulatedRef.current = append ? existingText : ''

    const r = new SpeechRecognition()
    r.lang = 'en-IN'
    r.continuous = true
    r.interimResults = true

    r.onresult = (e) => {
      clearSilenceTimer()
      const interim = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('')
      const full = accumulatedRef.current
        ? accumulatedRef.current.trim() + ' ' + interim
        : interim
      onTranscript?.(full)
    }

    r.onspeechend = () => {
      silenceTimerRef.current = setTimeout(() => {
        stopListening()
      }, silenceMs)
    }

    r.onspeechstart = () => clearSilenceTimer()

    r.onend = () => {
      setListening(false)
      clearSilenceTimer()
    }

    recognitionRef.current = r
    r.start()
    setListening(true)
  }

  return { listening, startListening, stopListening }
}
