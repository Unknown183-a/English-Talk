import rateLimit from 'express-rate-limit'

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // max 50 requests per 15 min per IP
  message: { error: 'Too many requests, please try again later.' }
})