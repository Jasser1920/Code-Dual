import type { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcryptjs'
import { prisma } from '../db.js'
import { getXpToNextLevel, getXpForCurrentLevel } from '../utils/xp.js'
import type { UpdateProfilePayload } from '@code-dual/shared'

const profileRoutes: FastifyPluginAsync = async (fastify) => {
  // Add authentication hook to all routes in this plugin
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' })
    }
  })

  // GET /profile/me
  // Fetches the current user's profile
  fastify.get('/me', async (request, reply) => {
    const userId = request.user.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        elo: true,
        rankTier: true,
        avatarUrl: true,
        location: true,
        mobileNumber: true,
        preferredLang: true,
        emailVerified: true,
        xp: true,
        level: true,
      },
    })

    if (!user) {
      return reply.status(404).send({ error: 'User not found' })
    }

    const nextLevelXp = getXpToNextLevel(user.level)
    const currentLevelBaseXp = getXpForCurrentLevel(user.level)

    return { user: { ...user, nextLevelXp, currentLevelBaseXp } }
  })

  // PUT /profile
  // Updates the user's profile
  fastify.put('/', async (request, reply) => {
    const userId = request.user.userId
    const data = request.body as UpdateProfilePayload

    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          location: data.location,
          mobileNumber: data.mobileNumber,
          avatarUrl: data.avatarUrl,
          preferredLang: data.preferredLang,
        },
        select: {
          id: true,
          username: true,
          elo: true,
          rankTier: true,
          avatarUrl: true,
          location: true,
          mobileNumber: true,
          preferredLang: true,
          emailVerified: true,
          xp: true,
          level: true,
        },
      })

      const nextLevelXp = getXpToNextLevel(user.level)
      const currentLevelBaseXp = getXpForCurrentLevel(user.level)

      return { user: { ...user, nextLevelXp, currentLevelBaseXp } }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Failed to update profile' })
    }
  })

  // PUT /profile/password
  fastify.put('/password', async (request, reply) => {
    const userId = request.user.userId
    const { oldPassword, newPassword } = request.body as any

    if (!oldPassword || !newPassword) {
      return reply.status(400).send({ error: 'Missing required fields' })
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } })

      if (!user || !user.passwordHash) {
        return reply
          .status(400)
          .send({ error: 'User does not have a password set' })
      }

      const isValid = await bcrypt.compare(oldPassword, user.passwordHash)
      if (!isValid) {
        return reply.status(401).send({ error: 'Incorrect old password' })
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10)

      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      })

      return { success: true }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Failed to change password' })
    }
  })
}

export default profileRoutes
