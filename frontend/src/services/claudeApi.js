import axios from 'axios'

const API_URL = '/api/chat'

export const sendMessage = async (messages, topic) => {
  const response = await axios.post(API_URL, { messages, topic })
  return response.data.reply
}