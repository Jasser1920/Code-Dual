import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import { Server } from 'socket.io'
import dotenv from 'dotenv'

dotenv.config()

const app = Fastify({ logger: true })

// Register plugins
await app.register(cors, {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
})

await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'fallback_secret'
})

await app.register(cookie)

// Health check route
app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
})

// Start server
const start = async () => {
    try {
        await app.listen({
            port: Number(process.env.PORT) || 4000,
            host: '0.0.0.0'
        })
        console.log('🚀 Server running on http://localhost:4000')
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}

start()