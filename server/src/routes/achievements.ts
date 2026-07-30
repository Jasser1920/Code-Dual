import { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'
import {
  evaluateUserAchievements,
  seedDefaultAchievements,
} from '../services/achievements.js'

export async function achievementRoutes(fastify: FastifyInstance) {
  // Ensure default achievements are seeded
  await seedDefaultAchievements()

  // Get all achievements and current user's progress
  fastify.get(
    '/',
    { onRequest: [fastify.authenticate] },
    async (req, reply) => {
      try {
        const userId = (req.user as any).userId

        const [allAchievements, userAchievements] = await Promise.all([
          prisma.achievement.findMany({ orderBy: { xpReward: 'asc' } }),
          prisma.userAchievement.findMany({
            where: { userId },
            include: { achievement: true },
          }),
        ])

        const unlockedMap = new Map()
        userAchievements.forEach((ua) => {
          unlockedMap.set(ua.achievementId, ua.unlockedAt)
        })

        const formatted = allAchievements.map((ach) => ({
          ...ach,
          isUnlocked: unlockedMap.has(ach.id),
          unlockedAt: unlockedMap.get(ach.id) || null,
        }))

        return reply.send({
          success: true,
          achievements: formatted,
          unlockedCount: userAchievements.length,
          totalCount: allAchievements.length,
        })
      } catch (err) {
        req.log.error(err)
        return reply.status(500).send({ error: 'Failed to fetch achievements' })
      }
    }
  )

  // Get achievements for any user by username
  fastify.get('/user/:username', async (req, reply) => {
    try {
      const { username } = req.params as { username: string }
      const user = await prisma.user.findUnique({ where: { username } })
      if (!user) return reply.status(404).send({ error: 'User not found' })

      const [allAchievements, userAchievements] = await Promise.all([
        prisma.achievement.findMany({ orderBy: { xpReward: 'asc' } }),
        prisma.userAchievement.findMany({
          where: { userId: user.id },
          include: { achievement: true },
        }),
      ])

      const unlockedMap = new Map()
      userAchievements.forEach((ua) => {
        unlockedMap.set(ua.achievementId, ua.unlockedAt)
      })

      const formatted = allAchievements.map((ach) => ({
        ...ach,
        isUnlocked: unlockedMap.has(ach.id),
        unlockedAt: unlockedMap.get(ach.id) || null,
      }))

      return reply.send({
        success: true,
        achievements: formatted,
        unlockedCount: userAchievements.length,
        totalCount: allAchievements.length,
      })
    } catch (err) {
      req.log.error(err)
      return reply
        .status(500)
        .send({ error: 'Failed to fetch user achievements' })
    }
  })

  // Evaluate achievements manually for the authenticated user
  fastify.post(
    '/evaluate',
    { onRequest: [fastify.authenticate] },
    async (req, reply) => {
      try {
        const userId = (req.user as any).userId
        const newlyUnlocked = await evaluateUserAchievements(userId)

        return reply.send({
          success: true,
          newlyUnlocked,
          count: newlyUnlocked.length,
        })
      } catch (err) {
        req.log.error(err)
        return reply
          .status(500)
          .send({ error: 'Failed to evaluate achievements' })
      }
    }
  )
}
