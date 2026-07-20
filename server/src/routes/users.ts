import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../db.js'
import { getXpToNextLevel, getXpForCurrentLevel } from '../utils/xp.js'

const usersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/leaderboard', async (request, reply) => {
    // Get top 100 users ordered by elo
    const users = await prisma.user.findMany({
      orderBy: { elo: 'desc' },
      take: 100,
      select: {
        id: true,
        username: true,
        elo: true,
        location: true,
        avatarUrl: true,
        preferredLang: true,
        _count: {
          select: {
            wonDuels: true,
            player1Duels: true,
            player2Duels: true,
          },
        },
      },
    })

    // Map into a simpler format for frontend
    const leaderboard = users.map((u, index) => {
      const wins = u._count.wonDuels
      const totalMatches = u._count.player1Duels + u._count.player2Duels
      const losses = totalMatches - wins

      return {
        rank: index + 1,
        id: u.id,
        name: u.username,
        country: u.location || 'Unknown',
        rating: u.elo,
        wins: wins,
        losses: losses,
        streak: 0, // Not tracked yet
        lang: u.preferredLang || 'javascript',
      }
    })

    return leaderboard
  })

  fastify.get('/profile/:username', async (request, reply) => {
    const { username } = request.params as { username: string }

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        elo: true,
        location: true,
        avatarUrl: true,
        preferredLang: true,
        xp: true,
        level: true,
        _count: {
          select: {
            wonDuels: true,
            player1Duels: true,
            player2Duels: true,
          },
        },
      },
    })

    if (!user) {
      return reply.status(404).send({ error: 'User not found' })
    }

    // Find rank by counting how many users have higher elo
    const higherCount = await prisma.user.count({
      where: { elo: { gt: user.elo } },
    })
    const rank = higherCount + 1

    // Fetch Rating History (EloHistory)
    const eloHistories = await prisma.eloHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      take: 50, // last 50 matches
    })

    // Format for Recharts
    const ratingHistory = eloHistories.map((eh) => ({
      date: eh.createdAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      rating: eh.eloAfter,
    }))

    // Add default if no history
    if (ratingHistory.length === 0) {
      ratingHistory.push({ date: 'Start', rating: user.elo })
    }

    // Fetch Match History (Duels)
    const duels = await prisma.duel.findMany({
      where: {
        status: 'completed',
        OR: [{ player1Id: user.id }, { player2Id: user.id }],
      },
      orderBy: { endedAt: 'desc' },
      take: 10,
      include: {
        player1: { select: { id: true, username: true } },
        player2: { select: { id: true, username: true } },
        problem: { select: { title: true } },
        eloHistory: { where: { userId: user.id } }, // To get the delta
      },
    })

    const matchHistory = duels.map((d) => {
      const isPlayer1 = d.player1Id === user.id
      const opponent = isPlayer1 ? d.player2 : d.player1
      const result =
        d.winnerId === user.id ? 'win' : d.winnerId === null ? 'draw' : 'loss'

      const eloRecord = d.eloHistory[0]
      let ratingDelta = '+0'
      if (eloRecord) {
        ratingDelta =
          eloRecord.delta > 0 ? `+${eloRecord.delta}` : `${eloRecord.delta}`
      }

      let timeStr = '00:00'
      if (d.startedAt && d.endedAt) {
        const diffMs = d.endedAt.getTime() - d.startedAt.getTime()
        const mins = Math.floor(diffMs / 60000)
        const secs = Math.floor((diffMs % 60000) / 1000)
        timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      }

      return {
        id: d.id,
        opp: opponent?.username || 'Unknown',
        result,
        rating: ratingDelta,
        prob: d.problem.title,
        time: timeStr,
        date: d.endedAt
          ? d.endedAt.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          : '',
      }
    })

    const wins = user._count.wonDuels
    const totalMatches = user._count.player1Duels + user._count.player2Duels
    const losses = totalMatches - wins

    return {
      profile: {
        id: user.id,
        name: user.username,
        country: user.location || 'Unknown',
        rating: user.elo,
        rank,
        wins,
        losses,
        streak: 0,
        lang: user.preferredLang || 'javascript',
        xp: user.xp,
        level: user.level,
        nextLevelXp: getXpToNextLevel(user.level),
        currentLevelBaseXp: getXpForCurrentLevel(user.level),
      },
      ratingHistory,
      matchHistory,
    }
  })
  fastify.post(
    '/reports',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { reportedId, type, description } = request.body as {
        reportedId?: string
        type: string
        description: string
      }
      const reporterId = (request.user as any).userId

      if (!type || !description) {
        return reply
          .status(400)
          .send({ error: 'Type and description are required' })
      }

      try {
        const report = await prisma.report.create({
          data: {
            reporterId,
            reportedId,
            type,
            description,
          },
        })
        return { success: true, report }
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({ error: 'Internal server error' })
      }
    }
  )
}

export default usersRoutes
