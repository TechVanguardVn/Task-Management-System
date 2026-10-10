import mongoose from 'mongoose'
import { env } from '@shared/config/env.config'

export const connectDB = async (): Promise<void> => {
  await mongoose.connect(env.MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  console.log('MongoDB connected')
}

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected')
})

mongoose.connection.on('error', err => {
  console.error('MongoDB error:', err.message)
})
