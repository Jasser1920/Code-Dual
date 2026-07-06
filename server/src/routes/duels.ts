import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../db.js'

const duelsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    try {
      const duel = await prisma.duel.findUnique({
        where: { id },
        include: {
          problem: {
            select: {
              title: true,
              difficulty: true,
            },
          },
          player1: {
            select: { id: true, username: true, elo: true, avatarUrl: true },
          },
          player2: {
            select: { id: true, username: true, elo: true, avatarUrl: true },
          },
          submissions: {
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      if (!duel) {
        return reply.status(404).send({ error: 'Duel not found' })
      }

      // We only want the latest submission for each player
      const p1Submission = duel.submissions.find(
        (s) => s.playerId === duel.player1Id
      )
      const p2Submission = duel.submissions.find(
        (s) => s.playerId === duel.player2Id
      )

      return {
        id: duel.id,
        status: duel.status,
        startedAt: duel.startedAt,
        endedAt: duel.endedAt,
        winnerId: duel.winnerId,
        problem: duel.problem,
        player1: duel.player1,
        player2: duel.player2,
        player1Submission: p1Submission
          ? {
              code: p1Submission.code,
              language: p1Submission.language,
              correctness: p1Submission.correctness,
            }
          : null,
        player2Submission: p2Submission
          ? {
              code: p2Submission.code,
              language: p2Submission.language,
              correctness: p2Submission.correctness,
            }
          : null,
      }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}

export default duelsRoutes
