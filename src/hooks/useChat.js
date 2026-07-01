import { useState } from 'react'
import { sendMessage } from '../services/claudeApi'

export const useChat = (topic) => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const sendUserMessage = async (userText) => {
    const newMessages = [
      ...messages,
      { role: 'user', content: userText }
    ]
    setMessages(newMessages)
    setLoading(true)

    try {
      const reply = await sendMessage(newMessages, topic)
      setMessages([
        ...newMessages,
        { role: 'assistant', content: reply }
      ])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return { messages, loading, sendUserMessage }
}
