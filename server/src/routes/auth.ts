import type { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../db.js'
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../utils/mailer.js'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const CLIENT_ID = process.env.GITHUB_CLIENT_ID
  const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET
  const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000'

  // Rate limiting config for auth routes
  const rateLimitConfig = {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }

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
      const tokenRes = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
          }),
        }
      )
      const tokenData = await tokenRes.json()
      if (tokenData.error) {
        throw new Error(tokenData.error_description)
      }

      const accessToken = tokenData.access_token

      // Fetch user profile from GitHub
      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const githubUser = await userRes.json()

      // Fetch user emails
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const githubEmails = await emailsRes.json()
      const primaryEmail =
        githubEmails.find((e: any) => e.primary)?.email ||
        githubEmails[0]?.email

      // Upsert User in Database
      const user = await prisma.user.upsert({
        where: { githubId: String(githubUser.id) },
        update: {
          username: githubUser.login,
          email: primaryEmail,
          emailVerified: true,
        },
        create: {
          githubId: String(githubUser.id),
          username: githubUser.login,
          email: primaryEmail,
          emailVerified: true,
          elo: 0,
          rankTier: 'Bronze',
          preferredLang: 'javascript',
        },
      })

      // Generate JWT Access Token
      const jwtToken = fastify.jwt.sign(
        { userId: user.id, username: user.username },
        { expiresIn: '15m' }
      )

      // Generate Refresh Token
      const refreshToken = fastify.jwt.sign(
        { userId: user.id, username: user.username },
        { expiresIn: '7d' }
      )

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
    const { email, username, password, primaryLanguage, skillLevel } =
      request.body as any
    if (!email || !username || !password) {
      return reply.status(400).send({ error: 'Missing required fields' })
    }

    try {
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
      })

      if (existingUser) {
        if (existingUser.email === email) {
          return reply.status(409).send({ error: 'Email already exists' })
        }
        return reply.status(409).send({ error: 'Username already exists' })
      }

      const passwordHash = await bcrypt.hash(password, 10)
      const verificationToken = crypto.randomBytes(32).toString('hex')
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      let startingElo = 0
      // We can keep skillLevel modifiers if desired, but base is 0.
      // If the user wants 0 strictly:
      if (skillLevel === 'Advanced') startingElo = 200
      else if (skillLevel === 'Expert') startingElo = 400

      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          elo: startingElo,
          rankTier: 'Bronze',
          preferredLang: primaryLanguage || 'javascript',
          verificationToken,
          verificationExpires,
        },
      })

      // Fire and forget email sending
      sendVerificationEmail(user.email, user.username, verificationToken).catch(
        (err) => request.log.error('Failed to send verification email:', err)
      )

      const jwtToken = fastify.jwt.sign(
        { userId: user.id, username: user.username },
        { expiresIn: '15m' }
      )
      const refreshToken = fastify.jwt.sign(
        { userId: user.id, username: user.username },
        { expiresIn: '7d' }
      )

      reply.setCookie('refreshToken', refreshToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60,
      })

      return {
        accessToken: jwtToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          elo: user.elo,
          rankTier: user.rankTier,
          location: user.location,
          mobileNumber: user.mobileNumber,
          avatarUrl: user.avatarUrl,
          preferredLang: user.preferredLang,
          emailVerified: user.emailVerified,
        },
      }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // 3b. Verify Email
  fastify.get('/verify-email', rateLimitConfig, async (request, reply) => {
    const { token } = request.query as { token: string }
    if (!token) {
      return reply.status(400).send({ error: 'Missing token' })
    }

    try {
      const user = await prisma.user.findFirst({
        where: {
          verificationToken: token,
          verificationExpires: { gt: new Date() },
        },
      })

      if (!user) {
        return reply
          .status(400)
          .send({ error: 'Invalid or expired verification token' })
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
          verificationExpires: null,
        },
      })

      return { success: true, message: 'Email verified successfully' }
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
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: email }, { username: email }],
        },
      })
      if (!user || !user.passwordHash) {
        return reply.status(401).send({ error: 'Invalid email or password' })
      }

      const isValid = await bcrypt.compare(password, user.passwordHash)
      if (!isValid) {
        return reply.status(401).send({ error: 'Invalid email or password' })
      }

      const jwtToken = fastify.jwt.sign(
        { userId: user.id, username: user.username },
        { expiresIn: '15m' }
      )
      const refreshToken = fastify.jwt.sign(
        { userId: user.id, username: user.username },
        { expiresIn: '7d' }
      )

      reply.setCookie('refreshToken', refreshToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60,
      })

      return {
        accessToken: jwtToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          elo: user.elo,
          rankTier: user.rankTier,
          location: user.location,
          mobileNumber: user.mobileNumber,
          avatarUrl: user.avatarUrl,
          preferredLang: user.preferredLang,
          emailVerified: user.emailVerified,
        },
      }
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
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      })

      if (!user) {
        return reply.status(401).send({ error: 'User not found' })
      }

      const jwtToken = fastify.jwt.sign(
        { userId: user.id, username: user.username },
        { expiresIn: '15m' }
      )
      return {
        accessToken: jwtToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          elo: user.elo,
          rankTier: user.rankTier,
          location: user.location,
          mobileNumber: user.mobileNumber,
          avatarUrl: user.avatarUrl,
          preferredLang: user.preferredLang,
          emailVerified: user.emailVerified,
        },
      }
    } catch (err) {
      reply.clearCookie('refreshToken', { path: '/' })
      return reply.status(401).send({ error: 'Invalid refresh token' })
    }
  })

  // 6. Logout
  fastify.post(
    '/logout',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      reply.clearCookie('refreshToken', { path: '/' })
      return { success: true }
    }
  )

  // 7. Forgot Password
  fastify.post('/forgot-password', rateLimitConfig, async (request, reply) => {
    const { email } = request.body as { email: string }
    if (!email) return reply.status(400).send({ error: 'Email is required' })

    try {
      const user = await prisma.user.findUnique({ where: { email } })
      if (user && !user.githubId) {
        // Only send reset for native accounts
        const resetPasswordToken = crypto.randomBytes(32).toString('hex')
        const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

        await prisma.user.update({
          where: { id: user.id },
          data: { resetPasswordToken, resetPasswordExpires },
        })

        sendPasswordResetEmail(
          user.email,
          user.username,
          resetPasswordToken
        ).catch((err) => request.log.error('Failed to send reset email:', err))
      }

      // Always return success to prevent email enumeration
      return {
        success: true,
        message: 'If that email exists, a reset link was sent.',
      }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // 8. Reset Password
  fastify.post('/reset-password', rateLimitConfig, async (request, reply) => {
    const { token, newPassword } = request.body as any
    if (!token || !newPassword) {
      return reply
        .status(400)
        .send({ error: 'Token and new password are required' })
    }

    try {
      const user = await prisma.user.findFirst({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: { gt: new Date() },
        },
      })

      if (!user) {
        return reply
          .status(400)
          .send({ error: 'Invalid or expired reset token' })
      }

      const passwordHash = await bcrypt.hash(newPassword, 10)

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      })

      return { success: true, message: 'Password has been reset successfully' }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // 9. Resend Verification Email
  fastify.post(
    '/resend-verification',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.userId

      try {
        const user = await prisma.user.findUnique({ where: { id: userId } })

        if (!user) return reply.status(404).send({ error: 'User not found' })
        if (user.emailVerified)
          return reply.status(400).send({ error: 'Email is already verified' })

        const verificationToken = crypto.randomBytes(32).toString('hex')
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

        await prisma.user.update({
          where: { id: userId },
          data: { verificationToken, verificationExpires },
        })

        sendVerificationEmail(
          user.email,
          user.username,
          verificationToken
        ).catch((err) =>
          request.log.error('Failed to resend verification email:', err)
        )

        return {
          success: true,
          message: 'Verification email resent successfully',
        }
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({ error: 'Internal server error' })
      }
    }
  )
}

export default authRoutes
