import { useState } from 'react'
import axios from 'axios'

const API_URL = '/api/chat'

export const useChat = (topic) => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [scores, setScores] = useState([])

  const initWithQuestion = (question) => {
    setMessages([{
      role: 'assistant',
      content: question,
      score: null,
      nextQuestion: question,
      isOpening: true
    }])
  }

  const sendUserMessage = async (userText) => {
    const newMessages = [
      ...messages,
      { role: 'user', content: userText }
    ]
    setMessages(newMessages)
    setLoading(true)

    try {
      const cleanMessages = newMessages
        .filter(m => !m.isOpening)
        .map(({ role, content }) => ({ role, content }))

      const userLevel = localStorage.getItem('englishtalk_level') || 'intermediate'

      const response = await axios.post(API_URL, {
        messages: cleanMessages,
        topic,
        level: userLevel
      })

      const {
        reply, score, fluency, grammar, vocabulary,
        whatGood, grammarTip, betterWord, sample,
        nextQuestion, hindiWords
      } = response.data

      if (score !== null && score !== undefined) {
        setScores(prev => [...prev, score])
      }

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: reply,
          score, fluency, grammar, vocabulary,
          whatGood, grammarTip, betterWord, sample,
          nextQuestion, hindiWords
        }
      ])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return { messages, loading, sendUserMessage, scores, initWithQuestion }
}
