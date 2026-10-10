import http from 'http'
import mongoose from 'mongoose'
import { app } from './app'
import { connectDB } from '@shared/config/db.config'
import { env } from '@shared/config/env.config'

const server = http.createServer(app)

const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`)
  server.close(async () => {
    await mongoose.connection.close()
    console.log('MongoDB connection closed.')
    process.exit(0)
  })
  setTimeout(() => {
    console.error('Forced shutdown after timeout.')
    process.exit(1)
  }, 30_000)
}

const start = async () => {
  await connectDB()
  server.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`)
    if (env.NODE_ENV !== 'production') {
      console.log(`Swagger docs: http://localhost:${env.PORT}/api-docs`)
    }
  })
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

start()
