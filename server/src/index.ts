import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import type { UserProfile, DuelStatus } from '@code-dual/shared'

import authPlugin from './plugins/auth.js'
import authRoutes from './routes/auth.js'
import profileRoutes from './routes/profile.js'
import executeRoutes from './routes/execute.js'
import usersRoutes from './routes/users.js'
import duelsRoutes from './routes/duels.js'
import { setupSocket } from './socket.js'

dotenv.config()

const app = Fastify({ logger: true })

// Register plugins
await app.register(cors, {
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'https://code-dual-client-git-main-jasser1920s-projects.vercel.app',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET || 'fallback_secret',
  cookie: {
    cookieName: 'refreshToken',
    signed: false,
  },
})

await app.register(cookie)

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
})

await app.register(authPlugin)

// Register routes
app.register(authRoutes, { prefix: '/auth' })
app.register(profileRoutes, { prefix: '/profile' })
app.register(executeRoutes, { prefix: '/execute' })
app.register(usersRoutes, { prefix: '/users' })
app.register(duelsRoutes, { prefix: '/duels' })

// Health check route
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Setup Socket.io
setupSocket(app)

// Start server
const start = async () => {
  try {
    await app.listen({
      port: Number(process.env.PORT) || 4000,
      host: '0.0.0.0',
    })
    console.log(' Server running on http://localhost:4000')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
