import { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'
import { isAdmin } from '../plugins/admin.js'
import { globalSocketStats, activeRooms } from '../socket.js'
import os from 'os'

export default async function adminRoutes(fastify: FastifyInstance) {
  // All routes inside here require the user to be authenticated AND be an admin
  fastify.addHook('preHandler', fastify.authenticate)
  fastify.addHook('preHandler', isAdmin)

  fastify.get('/health-stats', async (request, reply) => {
    try {
      // 1. Database Latency
      const dbStart = Date.now()
      await prisma.$queryRaw`SELECT 1`
      const dbLatency = Date.now() - dbStart

      // 2. Database Counts
      const totalUsers = await prisma.user.count()
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const duelsToday = await prisma.duel.count({
        where: { createdAt: { gte: startOfDay } },
      })

      // 3. Judge0 Check
      let judge0Status = 'offline'
      let judge0Latency = 0
      try {
        const judgeStart = Date.now()
        const res = await fetch(`${process.env.JUDGE0_URL}/about`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000),
        })
        if (res.ok) {
          judge0Status = 'online'
          judge0Latency = Date.now() - judgeStart
        }
      } catch (err) {
        // Leave offline
      }

      // 4. Server Resources
      const memoryUsage = process.memoryUsage()
      const serverMemoryMb = Math.round(memoryUsage.rss / 1024 / 1024)
      const serverUptimeSecs = Math.round(process.uptime())

      return {
        success: true,
        data: {
          sockets: globalSocketStats,
          database: {
            status: dbLatency < 1000 ? 'online' : 'degraded',
            latency: dbLatency,
            totalUsers,
            duelsToday,
          },
          judge0: {
            status: judge0Status,
            latency: judge0Latency,
          },
          server: {
            uptime: serverUptimeSecs,
            memoryMb: serverMemoryMb,
            cpuLoad: os.loadavg()[0], // 1 minute load average
          },
        },
      }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // Chart Data
  fastify.get('/duels-chart', async (request, reply) => {
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
      sevenDaysAgo.setHours(0, 0, 0, 0)

      const duels = await prisma.duel.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      })

      const countsByDate: Record<string, number> = {}
      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo)
        d.setDate(d.getDate() + i)
        countsByDate[d.toISOString().split('T')[0]] = 0
      }

      duels.forEach((d) => {
        const dateStr = d.createdAt.toISOString().split('T')[0]
        if (countsByDate[dateStr] !== undefined) {
          countsByDate[dateStr]++
        }
      })

      const chartData = Object.keys(countsByDate)
        .sort()
        .map((date) => ({
          date,
          duels: countsByDate[date],
        }))

      return { success: true, data: chartData }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // Active Duels (Spectator)
  fastify.get('/active-duels', async (request, reply) => {
    try {
      const activeList = Array.from(activeRooms.values())

      const enhancedList = await Promise.all(
        activeList.map(async (room) => {
          const playerIds = Array.from(room.players.values()).map(
            (p) => p.userId
          )

          // Fetch usernames
          const users = await prisma.user.findMany({
            where: { id: { in: playerIds } },
            select: { id: true, username: true },
          })

          // Fetch problem title if selected
          let problemTitle = 'Randomizing...'
          if (room.finalProblemId) {
            const prob = await prisma.problem.findUnique({
              where: { id: room.finalProblemId },
              select: { title: true },
            })
            if (prob) problemTitle = prob.title
          }

          return {
            id: room.id,
            status: room.status,
            remainingTime: room.remainingTime,
            players: users,
            problemTitle,
          }
        })
      )

      return { success: true, data: enhancedList }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // 1. Get all users
  fastify.get('/users', async (request, reply) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          elo: true,
          rankTier: true,
          emailVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      return { success: true, users }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // 2. Delete/Ban user
  fastify.delete('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await prisma.user.delete({ where: { id } })
      return { success: true, message: 'User deleted successfully' }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // 3. Get all reports
  fastify.get('/reports', async (request, reply) => {
    try {
      const reports = await prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
      })
      return { success: true, reports }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // 4. Resolve a report
  fastify.put('/reports/:id/resolve', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const report = await prisma.report.update({
        where: { id },
        data: { status: 'RESOLVED' },
      })
      return { success: true, report }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // 5. Get all problems
  fastify.get('/problems', async (request, reply) => {
    try {
      const problems = await prisma.problem.findMany({
        orderBy: { createdAt: 'desc' },
      })
      return { success: true, problems }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // 6. Create problem
  fastify.post('/problems', async (request, reply) => {
    const {
      title,
      description,
      difficulty,
      tags,
      examples,
      constraints,
      visibleTests,
      hiddenTests,
    } = request.body as any

    if (!title || !description || !difficulty) {
      return reply.status(400).send({ error: 'Missing required fields' })
    }

    try {
      const problem = await prisma.problem.create({
        data: {
          title,
          description,
          difficulty,
          tags: tags || [],
          examples: examples || [],
          constraints: constraints || [],
          visibleTests: visibleTests || [],
          hiddenTests: hiddenTests || [],
        },
      })
      return { success: true, problem }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // 7. Update problem
  fastify.put('/problems/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const {
      title,
      description,
      difficulty,
      tags,
      examples,
      constraints,
      visibleTests,
      hiddenTests,
    } = request.body as any

    try {
      const problem = await prisma.problem.update({
        where: { id },
        data: {
          title,
          description,
          difficulty,
          tags,
          examples,
          constraints,
          visibleTests,
          hiddenTests,
        },
      })
      return { success: true, problem }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // 8. Delete problem
  fastify.delete('/problems/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await prisma.problem.delete({ where: { id } })
      return { success: true, message: 'Problem deleted' }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}
