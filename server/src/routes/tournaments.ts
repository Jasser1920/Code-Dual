import { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'
import { isAdmin } from '../plugins/admin.js'
import { evaluateUserAchievements } from '../services/achievements.js'
import { emitToUser } from '../socket.js'
import { sendTournamentStartEmail } from '../utils/mailer.js'

export async function processTournamentMatchVictory(
  matchId: string,
  winnerId: string
) {
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
  })

  if (!match || match.status === 'COMPLETED') return

  const id = match.tournamentId

  // Set match winner and status COMPLETED
  await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: { winnerId, status: 'COMPLETED' },
  })

  // Eliminate the losing player
  const loserId =
    match.player1Id === winnerId ? match.player2Id : match.player1Id
  if (loserId) {
    await prisma.tournamentParticipant.updateMany({
      where: { tournamentId: id, userId: loserId },
      data: { isEliminated: true },
    })
  }

  // Check if there is a next round match to advance the winner into
  const nextRound = match.round + 1
  const nextMatchNumber = Math.ceil(match.matchNumber / 2)
  const isOddMatch = match.matchNumber % 2 !== 0

  const nextMatch = await prisma.tournamentMatch.findFirst({
    where: { tournamentId: id, round: nextRound, matchNumber: nextMatchNumber },
  })

  if (nextMatch) {
    // Advance winner to next match
    const updateData: any = isOddMatch
      ? { player1Id: winnerId }
      : { player2Id: winnerId }

    const updatedNext = await prisma.tournamentMatch.update({
      where: { id: nextMatch.id },
      data: updateData,
    })

    if (updatedNext.player1Id && updatedNext.player2Id) {
      // Create automatic duel for next round if problem exists
      const problem = await prisma.problem.findFirst()
      let duelId: string | null = null
      if (problem) {
        const duel = await prisma.duel.create({
          data: {
            problemId: problem.id,
            type: '1v1',
            status: 'WAITING',
            player1Id: updatedNext.player1Id,
            player2Id: updatedNext.player2Id,
          },
        })
        duelId = duel.id
      }

      await prisma.tournamentMatch.update({
        where: { id: nextMatch.id },
        data: { status: 'READY', ...(duelId && { duelId }) },
      })
    }
  } else {
    // No next match means THIS WAS THE FINAL! Tournament is over!
    const tournament = await prisma.tournament.update({
      where: { id },
      data: { winnerId, status: 'COMPLETED' },
    })

    // Evaluate achievements for the champion!
    await evaluateUserAchievements(winnerId, {
      wonTournament: true,
      rewardBadgeCode: tournament.rewardBadgeCode,
    })

    // Notify winner via socket if online
    emitToUser(winnerId, 'tournament:champion', {
      tournamentId: id,
      title: tournament.title,
    })
  }
}

export default async function tournamentRoutes(fastify: FastifyInstance) {
  // ==========================================
  // PUBLIC / PLAYER TOURNAMENT ENDPOINTS
  // ==========================================

  // 1. Get all tournaments
  fastify.get('/', async (request, reply) => {
    try {
      const userId = (request.user as any)?.userId

      const tournaments = await prisma.tournament.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              participants: {
                where: { status: 'ACCEPTED' },
              },
            },
          },
          winner: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              elo: true,
              rankTier: true,
            },
          },
          participants: userId
            ? {
                where: { userId },
                select: {
                  id: true,
                  status: true,
                  isEliminated: true,
                  seed: true,
                },
              }
            : false,
        },
      })

      const formatted = tournaments.map((t) => {
        const userParticipant =
          userId && Array.isArray(t.participants) && t.participants.length > 0
            ? t.participants[0]
            : null

        return {
          id: t.id,
          title: t.title,
          description: t.description,
          imageUrl: t.imageUrl,
          minElo: t.minElo,
          maxPlayers: t.maxPlayers,
          rewardBadgeCode: t.rewardBadgeCode,
          startDate: t.startDate,
          status: t.status,
          winner: t.winner,
          acceptedCount: t._count.participants,
          userStatus: userParticipant ? userParticipant.status : null,
          userParticipant,
          createdAt: t.createdAt,
        }
      })

      return reply.send({ success: true, tournaments: formatted })
    } catch (err) {
      request.log.error(err)
      return reply.status(500).send({ error: 'Failed to fetch tournaments' })
    }
  })

  // 2. Get single tournament details
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const userId = (request.user as any)?.userId

      const tournament = await prisma.tournament.findUnique({
        where: { id },
        include: {
          winner: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              elo: true,
              rankTier: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                  elo: true,
                  rankTier: true,
                  preferredLang: true,
                },
              },
            },
            orderBy: [{ status: 'asc' }, { appliedAt: 'asc' }],
          },
          matches: {
            include: {
              player1: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                  elo: true,
                  rankTier: true,
                },
              },
              player2: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                  elo: true,
                  rankTier: true,
                },
              },
              winner: {
                select: { id: true, username: true },
              },
            },
            orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }],
          },
        },
      })

      if (!tournament) {
        return reply.status(404).send({ error: 'Tournament not found' })
      }

      const userParticipant = userId
        ? tournament.participants.find((p) => p.userId === userId) || null
        : null

      return reply.send({
        success: true,
        tournament,
        userStatus: userParticipant ? userParticipant.status : null,
        userParticipant,
      })
    } catch (err) {
      request.log.error(err)
      return reply
        .status(500)
        .send({ error: 'Failed to fetch tournament details' })
    }
  })

  // 3. Player requests to join tournament
  fastify.post(
    '/:id/join',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const userId = (request.user as any).userId

        const tournament = await prisma.tournament.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                participants: {
                  where: { status: 'ACCEPTED' },
                },
              },
            },
          },
        })

        if (!tournament) {
          return reply.status(404).send({ error: 'Tournament not found' })
        }

        if (
          tournament.status !== 'UPCOMING' &&
          tournament.status !== 'REGISTRATION_OPEN'
        ) {
          return reply
            .status(400)
            .send({ error: 'Registration is closed for this tournament.' })
        }

        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) {
          return reply.status(404).send({ error: 'User not found' })
        }

        if (user.elo < tournament.minElo) {
          return reply.status(400).send({
            error: `Your ELO rating (${user.elo}) is below the required minimum (${tournament.minElo} ELO) for this tournament.`,
          })
        }

        if (tournament._count.participants >= tournament.maxPlayers) {
          return reply
            .status(400)
            .send({
              error: 'This tournament has already reached full capacity.',
            })
        }

        const existing = await prisma.tournamentParticipant.findUnique({
          where: {
            tournamentId_userId: {
              tournamentId: id,
              userId,
            },
          },
        })

        if (existing) {
          if (existing.status === 'PENDING') {
            return reply
              .status(400)
              .send({
                error:
                  'You have already applied to join this tournament. Please wait for admin review.',
              })
          }
          if (existing.status === 'ACCEPTED') {
            return reply
              .status(400)
              .send({
                error:
                  'You are already registered and approved for this tournament.',
              })
          }
          // If rejected, let them re-apply by resetting status to PENDING
          const updated = await prisma.tournamentParticipant.update({
            where: { id: existing.id },
            data: { status: 'PENDING', appliedAt: new Date() },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                  elo: true,
                  rankTier: true,
                },
              },
            },
          })
          return reply.send({
            success: true,
            message: 'Application re-submitted successfully!',
            participant: updated,
          })
        }

        const participant = await prisma.tournamentParticipant.create({
          data: {
            tournamentId: id,
            userId,
            status: 'PENDING',
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                elo: true,
                rankTier: true,
              },
            },
          },
        })

        return reply.send({
          success: true,
          message:
            'Application submitted successfully! An admin will review your request.',
          participant,
        })
      } catch (err) {
        request.log.error(err)
        return reply
          .status(500)
          .send({ error: 'Failed to apply for tournament' })
      }
    }
  )

  // ==========================================
  // ADMIN-ONLY TOURNAMENT ENDPOINTS
  // ==========================================

  // 4. Create new tournament (Admin)
  fastify.post(
    '/',
    { preHandler: [fastify.authenticate, isAdmin] },
    async (request, reply) => {
      try {
        const {
          title,
          description,
          imageUrl,
          minElo = 0,
          maxPlayers = 8,
          rewardBadgeCode = 'TOURNAMENT_CHAMPION',
          startDate,
        } = request.body as any

        if (!title || !description) {
          return reply
            .status(400)
            .send({ error: 'Title and description are required.' })
        }

        const tournament = await prisma.tournament.create({
          data: {
            title,
            description,
            imageUrl: imageUrl || null,
            minElo: Number(minElo),
            maxPlayers: Number(maxPlayers),
            rewardBadgeCode: rewardBadgeCode || 'TOURNAMENT_CHAMPION',
            startDate: startDate ? new Date(startDate) : null,
            status: 'UPCOMING',
          },
        })

        return reply.send({
          success: true,
          message: 'Tournament created successfully!',
          tournament,
        })
      } catch (err) {
        request.log.error(err)
        return reply.status(500).send({ error: 'Failed to create tournament' })
      }
    }
  )

  // 5. Update tournament (Admin)
  fastify.put(
    '/:id',
    { preHandler: [fastify.authenticate, isAdmin] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const {
          title,
          description,
          imageUrl,
          minElo,
          maxPlayers,
          rewardBadgeCode,
          startDate,
          status,
        } = request.body as any

        const updated = await prisma.tournament.update({
          where: { id },
          data: {
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description }),
            ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
            ...(minElo !== undefined && { minElo: Number(minElo) }),
            ...(maxPlayers !== undefined && { maxPlayers: Number(maxPlayers) }),
            ...(rewardBadgeCode !== undefined && { rewardBadgeCode }),
            ...(startDate !== undefined && {
              startDate: startDate ? new Date(startDate) : null,
            }),
            ...(status !== undefined && { status }),
          },
        })

        return reply.send({
          success: true,
          message: 'Tournament updated successfully!',
          tournament: updated,
        })
      } catch (err) {
        request.log.error(err)
        return reply.status(500).send({ error: 'Failed to update tournament' })
      }
    }
  )

  // 6. Delete tournament (Admin)
  fastify.delete(
    '/:id',
    { preHandler: [fastify.authenticate, isAdmin] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        await prisma.tournament.delete({ where: { id } })
        return reply.send({
          success: true,
          message: 'Tournament deleted successfully!',
        })
      } catch (err) {
        request.log.error(err)
        return reply.status(500).send({ error: 'Failed to delete tournament' })
      }
    }
  )

  // 7. Review participant application (Admin approve/reject)
  fastify.post(
    '/:id/participants/:participantId/review',
    { preHandler: [fastify.authenticate, isAdmin] },
    async (request, reply) => {
      try {
        const { id, participantId } = request.params as {
          id: string
          participantId: string
        }
        const { status } = request.body as { status: string } // 'ACCEPTED' or 'REJECTED'

        if (status !== 'ACCEPTED' && status !== 'REJECTED') {
          return reply
            .status(400)
            .send({ error: "Status must be either 'ACCEPTED' or 'REJECTED'." })
        }

        const tournament = await prisma.tournament.findUnique({
          where: { id },
          include: {
            _count: {
              select: { participants: { where: { status: 'ACCEPTED' } } },
            },
          },
        })

        if (!tournament) {
          return reply.status(404).send({ error: 'Tournament not found' })
        }

        if (
          status === 'ACCEPTED' &&
          tournament._count.participants >= tournament.maxPlayers
        ) {
          return reply
            .status(400)
            .send({
              error: 'Cannot approve: Tournament is already at full capacity.',
            })
        }

        const updated = await prisma.tournamentParticipant.update({
          where: { id: participantId },
          data: { status },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                elo: true,
                rankTier: true,
              },
            },
          },
        })

        // Notify participant in real-time
        emitToUser(updated.userId, 'tournament:application_reviewed', {
          tournamentTitle: tournament.title,
          status,
        })

        return reply.send({
          success: true,
          message:
            status === 'ACCEPTED'
              ? `Approved @${updated.user.username}!`
              : `Rejected @${updated.user.username}.`,
          participant: updated,
        })
      } catch (err) {
        request.log.error(err)
        return reply.status(500).send({ error: 'Failed to review participant' })
      }
    }
  )

  // 8. Start tournament & generate brackets (Admin)
  fastify.post(
    '/:id/start',
    { preHandler: [fastify.authenticate, isAdmin] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }

        const tournament = await prisma.tournament.findUnique({
          where: { id },
          include: {
            participants: {
              where: { status: 'ACCEPTED' },
              include: { user: true },
            },
          },
        })

        if (!tournament) {
          return reply.status(404).send({ error: 'Tournament not found' })
        }

        if (
          tournament.status === 'IN_PROGRESS' ||
          tournament.status === 'COMPLETED'
        ) {
          return reply
            .status(400)
            .send({ error: 'Tournament has already started or completed.' })
        }

        const participants = tournament.participants
        if (participants.length < 2) {
          return reply
            .status(400)
            .send({
              error:
                'Cannot start tournament with fewer than 2 approved participants.',
            })
        }

        // Sort participants by ELO descending to seed them
        participants.sort((a, b) => b.user.elo - a.user.elo)

        // Assign seed numbers in DB
        for (let i = 0; i < participants.length; i++) {
          await prisma.tournamentParticipant.update({
            where: { id: participants[i].id },
            data: { seed: i + 1 },
          })
        }

        // Calculate number of rounds required
        const N = participants.length
        const rounds = Math.ceil(Math.log2(N)) || 1

        // Clean out any old matches if re-starting
        await prisma.tournamentMatch.deleteMany({ where: { tournamentId: id } })

        // Generate Round 1 matches
        const round1MatchesCount = Math.ceil(N / 2)
        const createdRound1Matches: any[] = []

        for (let i = 0; i < round1MatchesCount; i++) {
          const p1 = participants[i * 2] || null
          const p2 = participants[i * 2 + 1] || null

          // If p2 is missing, p1 gets a bye (automatic win in Round 1)
          const isBye = p1 && !p2
          const matchStatus = isBye ? 'COMPLETED' : 'READY'
          const winnerId = isBye ? p1.userId : null

          const match = await prisma.tournamentMatch.create({
            data: {
              tournamentId: id,
              round: 1,
              matchNumber: i + 1,
              player1Id: p1 ? p1.userId : null,
              player2Id: p2 ? p2.userId : null,
              winnerId,
              status: matchStatus,
            },
          })
          createdRound1Matches.push(match)
        }

        // Generate placeholder matches for subsequent rounds (Rounds 2 through `rounds`)
        let prevRoundMatchesCount = round1MatchesCount
        const allRoundsMatches: { [round: number]: any[] } = {
          1: createdRound1Matches,
        }

        for (let r = 2; r <= rounds; r++) {
          const currentRoundMatchesCount = Math.ceil(prevRoundMatchesCount / 2)
          allRoundsMatches[r] = []

          for (let m = 0; m < currentRoundMatchesCount; m++) {
            const match = await prisma.tournamentMatch.create({
              data: {
                tournamentId: id,
                round: r,
                matchNumber: m + 1,
                player1Id: null,
                player2Id: null,
                winnerId: null,
                status: 'PENDING',
              },
            })
            allRoundsMatches[r].push(match)
          }
          prevRoundMatchesCount = currentRoundMatchesCount
        }

        // Advance any Round 1 Bye winners into Round 2 immediately
        for (const m1 of createdRound1Matches) {
          if (m1.status === 'COMPLETED' && m1.winnerId && rounds >= 2) {
            const nextRound = 2
            const nextMatchNumber = Math.ceil(m1.matchNumber / 2)
            const isOddMatch = m1.matchNumber % 2 !== 0

            const nextMatch = await prisma.tournamentMatch.findFirst({
              where: {
                tournamentId: id,
                round: nextRound,
                matchNumber: nextMatchNumber,
              },
            })

            if (nextMatch) {
              const updateData: any = isOddMatch
                ? { player1Id: m1.winnerId }
                : { player2Id: m1.winnerId }

              const updatedNext = await prisma.tournamentMatch.update({
                where: { id: nextMatch.id },
                data: updateData,
              })

              // If both players are now present in the next match, set status to READY
              if (updatedNext.player1Id && updatedNext.player2Id) {
                await prisma.tournamentMatch.update({
                  where: { id: nextMatch.id },
                  data: { status: 'READY' },
                })
              }
            }
          }
        }

        const now = new Date()
        // Update tournament status to IN_PROGRESS and set bracketGeneratedAt
        const updatedTournament = await prisma.tournament.update({
          where: { id },
          data: { status: 'IN_PROGRESS', bracketGeneratedAt: now },
          include: {
            participants: { include: { user: true } },
            matches: {
              include: { player1: true, player2: true, winner: true },
              orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }],
            },
          },
        })

        // Asynchronously email and socket notify all accepted participants about the 15-minute countdown
        for (const p of updatedTournament.participants) {
          if (p.user) {
            emitToUser(p.user.id, 'tournament:brackets_generated', {
              tournamentId: id,
              tournamentTitle: updatedTournament.title,
              minutesRemaining: 15,
            })
            if (p.user.email) {
              sendTournamentStartEmail(
                p.user.email,
                p.user.username,
                updatedTournament.title,
                15
              ).catch((err) =>
                console.error(
                  `Failed sending tournament alert to ${p.user.email}:`,
                  err
                )
              )
            }
          }
        }

        return reply.send({
          success: true,
          message:
            'Tournament started! Brackets have been generated, and notifications dispatched.',
          tournament: updatedTournament,
        })
      } catch (err) {
        request.log.error(err)
        return reply.status(500).send({ error: 'Failed to start tournament' })
      }
    }
  )

  // 9. Report match winner (Admin)
  fastify.post(
    '/:id/matches/:matchId/report',
    { preHandler: [fastify.authenticate, isAdmin] },
    async (request, reply) => {
      try {
        const { id, matchId } = request.params as {
          id: string
          matchId: string
        }
        const { winnerId } = request.body as { winnerId: string }

        if (!winnerId) {
          return reply.status(400).send({ error: 'Winner ID is required.' })
        }

        const match = await prisma.tournamentMatch.findUnique({
          where: { id: matchId },
        })

        if (!match || match.tournamentId !== id) {
          return reply
            .status(404)
            .send({ error: 'Match not found in this tournament.' })
        }

        if (match.player1Id !== winnerId && match.player2Id !== winnerId) {
          return reply
            .status(400)
            .send({ error: 'Winner must be one of the players in this match.' })
        }

        await processTournamentMatchVictory(matchId, winnerId)

        const refreshedTournament = await prisma.tournament.findUnique({
          where: { id },
          include: {
            winner: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                elo: true,
                rankTier: true,
              },
            },
            participants: {
              include: { user: true },
              orderBy: [{ status: 'asc' }, { appliedAt: 'asc' }],
            },
            matches: {
              include: { player1: true, player2: true, winner: true },
              orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }],
            },
          },
        })

        return reply.send({
          success: true,
          message: 'Match score reported successfully!',
          tournament: refreshedTournament,
        })
      } catch (err) {
        request.log.error(err)
        return reply.status(500).send({ error: 'Failed to report match score' })
      }
    }
  )
}
