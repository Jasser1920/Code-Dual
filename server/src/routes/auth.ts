import type { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcryptjs'
import { prisma } from '../db.ts'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const CLIENT_ID = process.env.GITHUB_CLIENT_ID
  const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET
  const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000'

  // Rate limiting config for auth routes
  const rateLimitConfig = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }

  // 1. GitHub OAuth Redirect
  fastify.get('/login/github', rateLimitConfig, async (request, reply) => {
    const redirectUri = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=read:user user:email`
    reply.redirect(redirectUri)
  })

  // 2. GitHub Callback
  fastify.get('/callback/github', rateLimitConfig, async (request, reply) => {
    const { code } = request.query as { code: string }
    if (!code) {
      return reply.status(400).send({ error: 'No code provided' })
    }

    try {
      // Exchange code for token
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code
        })
      })
      const tokenData = await tokenRes.json()
      if (tokenData.error) {
        throw new Error(tokenData.error_description)
      }

      const accessToken = tokenData.access_token

      // Fetch user profile from GitHub
      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const githubUser = await userRes.json()

      // Fetch user emails
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const githubEmails = await emailsRes.json()
      const primaryEmail = githubEmails.find((e: any) => e.primary)?.email || githubEmails[0]?.email

      // Upsert User in Database
      const user = await prisma.user.upsert({
        where: { githubId: String(githubUser.id) },
        update: {
          username: githubUser.login,
          email: primaryEmail
        },
        create: {
          githubId: String(githubUser.id),
          username: githubUser.login,
          email: primaryEmail,
          elo: 1000,
          rankTier: 'Bronze',
          preferredLang: 'javascript'
        }
      })

      // Generate JWT Access Token
      const jwtToken = fastify.jwt.sign({ userId: user.id, username: user.username }, { expiresIn: '15m' })
      
      // Generate Refresh Token
      const refreshToken = fastify.jwt.sign({ userId: user.id, username: user.username }, { expiresIn: '7d' })

      // Set Refresh Token as HTTP-only Cookie
      reply.setCookie('refreshToken', refreshToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })

      reply.redirect(`${CLIENT_URL}/auth-success?token=${jwtToken}`)
    } catch (error: any) {
      request.log.error(error)
      reply.redirect(`${CLIENT_URL}/login?error=oauth_failed`)
    }
  })

  // 3. Normal Registration
  fastify.post('/register', rateLimitConfig, async (request, reply) => {
    const { email, username, password } = request.body as any
    if (!email || !username || !password) {
      return reply.status(400).send({ error: 'Missing required fields' })
    }

    try {
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] }
      })

      if (existingUser) {
        return reply.status(409).send({ error: 'Email or username already in use' })
      }

      const passwordHash = await bcrypt.hash(password, 10)

      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          elo: 1000,
          rankTier: 'Bronze',
          preferredLang: 'javascript'
        }
      })

      const jwtToken = fastify.jwt.sign({ userId: user.id, username: user.username }, { expiresIn: '15m' })
      const refreshToken = fastify.jwt.sign({ userId: user.id, username: user.username }, { expiresIn: '7d' })

      reply.setCookie('refreshToken', refreshToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60,
      })

      return { accessToken: jwtToken, user: { id: user.id, username: user.username, email: user.email, elo: user.elo, rankTier: user.rankTier, location: user.location, mobileNumber: user.mobileNumber, avatarUrl: user.avatarUrl, preferredLang: user.preferredLang } }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // 4. Normal Login
  fastify.post('/login', rateLimitConfig, async (request, reply) => {
    const { email, password } = request.body as any
    if (!email || !password) {
      return reply.status(400).send({ error: 'Missing required fields' })
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user || !user.passwordHash) {
        return reply.status(401).send({ error: 'Invalid email or password' })
      }

      const isValid = await bcrypt.compare(password, user.passwordHash)
      if (!isValid) {
        return reply.status(401).send({ error: 'Invalid email or password' })
      }

      const jwtToken = fastify.jwt.sign({ userId: user.id, username: user.username }, { expiresIn: '15m' })
      const refreshToken = fastify.jwt.sign({ userId: user.id, username: user.username }, { expiresIn: '7d' })

      reply.setCookie('refreshToken', refreshToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60,
      })

      return { accessToken: jwtToken, user: { id: user.id, username: user.username, email: user.email, elo: user.elo, rankTier: user.rankTier, location: user.location, mobileNumber: user.mobileNumber, avatarUrl: user.avatarUrl, preferredLang: user.preferredLang } }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // 5. Refresh Token
  fastify.post('/refresh', rateLimitConfig, async (request, reply) => {
    const refreshToken = request.cookies.refreshToken
    if (!refreshToken) {
      return reply.status(401).send({ error: 'No refresh token' })
    }

    try {
      const decoded = fastify.jwt.verify<{ userId: string }>(refreshToken)
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
      
      if (!user) {
        return reply.status(401).send({ error: 'User not found' })
      }

      const jwtToken = fastify.jwt.sign({ userId: user.id, username: user.username }, { expiresIn: '15m' })
      return { accessToken: jwtToken, user: { id: user.id, username: user.username, email: user.email, elo: user.elo, rankTier: user.rankTier, location: user.location, mobileNumber: user.mobileNumber, avatarUrl: user.avatarUrl, preferredLang: user.preferredLang } }
    } catch (err) {
      reply.clearCookie('refreshToken', { path: '/' })
      return reply.status(401).send({ error: 'Invalid refresh token' })
    }
  })

  // 6. Logout
  fastify.post('/logout', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    reply.clearCookie('refreshToken', { path: '/' })
    return { success: true }
  })
}

export default authRoutes
