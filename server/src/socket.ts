import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import Redis from 'ioredis'
import crypto from 'crypto'
import type { FastifyInstance } from 'fastify'
import { judgeCode } from './services/judging.js'
import { PrismaClient } from '@prisma/client'
import { calculateMatchXp, calculateLevelFromXp } from './utils/xp.js'

const prisma = new PrismaClient()

const DUEL_DURATION_SEC = 900 // 15 minutes
const RECONNECT_TIMEOUT_SEC = 60 // 60 seconds

// We need a mock problem ID for duels
let mockProblemId: string | null = null

async function ensureMockProblem() {
  try {
    const problem = await prisma.problem.findFirst()
    if (problem) {
      mockProblemId = problem.id
    } else {
      const newProblem = await prisma.problem.create({
        data: {
          title: 'Two Sum',
          difficulty: 'Easy',
          visibleTests: [],
          hiddenTests: [],
          tags: ['Array', 'Hash Table'],
        },
      })
      mockProblemId = newProblem.id
    }
  } catch (err) {
    console.error('Failed to seed mock problem', err)
  }
}

// Call it on startup
ensureMockProblem()

interface PlayerState {
  socketId: string
  userId: string
  code: string
  language: string
  hasSubmitted: boolean
  disconnectedAt: number | null
}

interface RoomState {
  id: string
  dbDuelId: string | null
  remainingTime: number
  players: Map<string, PlayerState>
  isProcessing: boolean
  hasStarted: boolean
  status: 'WAITING_ACCEPT' | 'PROBLEM_SELECTION' | 'ROULETTE' | 'IN_GAME'
  lobbyProblems: any[]
  playerAccepted: Set<string>
  playerSelections: Map<string, string[]>
  finalProblemId: string | null
}

export let globalSocketStats = {
  activePlayers: 0,
  waitingPlayers: 0,
  activeDuels: 0,
}
export const activeRooms = new Map<string, RoomState>()

export function setupSocket(app: FastifyInstance) {
  const io = new Server(app.server, {
    cors: {
      origin: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
    },
  })

  // Setup Redis Adapter for horizontal scaling
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

  try {
    const pubClient = new Redis(redisUrl, { lazyConnect: true })
    const subClient = pubClient.duplicate()
    pubClient
      .connect()
      .then(() => {
        io.adapter(createAdapter(pubClient, subClient))
        app.log.info('Connected to Redis Adapter for Socket.io')
      })
      .catch((err) => {
        app.log.warn(
          'Redis is not running. Falling back to in-memory Socket.io adapter.'
        )
      })
  } catch (err) {
    app.log.warn('Redis adapter setup failed, using in-memory adapter.')
  }

  // Simple in-memory state
  let waitingPlayer: any = null // store object { socket, userId }
  const rematchRequests = new Map<string, Set<string>>() // stores userIds

  // Helper to get room by socket.id
  const getRoomBySocketId = (socketId: string) => {
    for (const room of activeRooms.values()) {
      for (const player of room.players.values()) {
        if (player.socketId === socketId) return room
      }
    }
    return null
  }

  // Helper to evaluate and end duel
  const endDuelAndEvaluate = async (
    roomId: string,
    room: RoomState,
    forfeitUserId: string | null = null
  ) => {
    if (room.isProcessing) return
    room.isProcessing = true

    app.log.info(`Evaluating duel ${roomId}...`)

    // Artificial delay to let the beautiful "Evaluating Results" neon animation play on the client
    await new Promise((resolve) => setTimeout(resolve, 2500))

    const playersArray = Array.from(room.players.values())
    if (playersArray.length !== 2) {
      io.to(roomId).emit('duel_end', {
        isDraw: true,
        winnerId: null,
        playerCodes: {},
        playerLanguages: {},
      })
      activeRooms.delete(roomId)
      return
    }

    const p1 = playersArray[0]
    const p2 = playersArray[1]

    let winnerId = null
    let isDraw = false
    let res1: any = { score: 0, time: 0 }
    let res2: any = { score: 0, time: 0 }
    let reason = ''

    if (forfeitUserId) {
      isDraw = false
      winnerId = forfeitUserId === p1.userId ? p2.userId : p1.userId
      reason = 'forfeit'
    } else {
      // Evaluate both codes
      res1 = await judgeCode(p1.code, p1.language)
      res2 = await judgeCode(p2.code, p2.language)

      if (res1.score > res2.score) {
        winnerId = p1.userId
        reason = 'score'
      } else if (res2.score > res1.score) {
        winnerId = p2.userId
        reason = 'score'
      } else {
        // Tie on score. Tiebreaker: execution time (if both success)
        if (res1.score === 100) {
          if (res1.time < res2.time) {
            winnerId = p1.userId
            reason = 'time'
          } else if (res2.time < res1.time) {
            winnerId = p2.userId
            reason = 'time'
          } else {
            isDraw = true
            reason = 'draw_time'
          }
        } else {
          isDraw = true // Both failed
          reason = 'draw_score'
        }
      }
    }

    const analysisData = {
      reason,
      p1: {
        id: p1.userId,
        score: res1.score,
        time: res1.time,
        error: res1.error,
      },
      p2: {
        id: p2.userId,
        score: res2.score,
        time: res2.time,
        error: res2.error,
      },
    }

    const playerCodes: Record<string, string> = {
      [p1.userId]: p1.code,
      [p2.userId]: p2.code,
    }
    const playerLanguages: Record<string, string> = {
      [p1.userId]: p1.language,
      [p2.userId]: p2.language,
    }

    // ELO Calculation & DB Update
    let newEloP1 = 1000
    let newEloP2 = 1000
    let deltaP1 = 0
    let deltaP2 = 0

    try {
      const user1 = await prisma.user.findUnique({ where: { id: p1.userId } })
      const user2 = await prisma.user.findUnique({ where: { id: p2.userId } })

      if (user1 && user2) {
        const R1 = user1.elo
        const R2 = user2.elo
        const E1 = 1 / (1 + Math.pow(10, (R2 - R1) / 400))
        const E2 = 1 / (1 + Math.pow(10, (R1 - R2) / 400))

        let S1 = isDraw ? 0.5 : winnerId === p1.userId ? 1 : 0
        let S2 = isDraw ? 0.5 : winnerId === p2.userId ? 1 : 0

        const K = 32
        deltaP1 = Math.round(K * (S1 - E1))
        deltaP2 = Math.round(K * (S2 - E2))

        newEloP1 = R1 + deltaP1
        newEloP2 = R2 + deltaP2

        let difficulty = 'easy'
        if (room.dbDuelId) {
          const duel = await prisma.duel.findUnique({
            where: { id: room.dbDuelId },
            include: { problem: true },
          })
          if (duel) difficulty = duel.problem.difficulty
        }

        const xp1 = calculateMatchXp(
          winnerId === p1.userId ? 'win' : isDraw ? 'draw' : 'loss',
          difficulty
        )
        const xp2 = calculateMatchXp(
          winnerId === p2.userId ? 'win' : isDraw ? 'draw' : 'loss',
          difficulty
        )

        const newXpP1 = user1.xp + xp1
        const newXpP2 = user2.xp + xp2

        const newLevelP1 = calculateLevelFromXp(newXpP1)
        const newLevelP2 = calculateLevelFromXp(newXpP2)

        // Update Users
        await prisma.user.update({
          where: { id: p1.userId },
          data: { elo: newEloP1, xp: newXpP1, level: newLevelP1 },
        })
        await prisma.user.update({
          where: { id: p2.userId },
          data: { elo: newEloP2, xp: newXpP2, level: newLevelP2 },
        })

        // Update Duel
        if (room.dbDuelId) {
          await prisma.duel.update({
            where: { id: room.dbDuelId },
            data: {
              status: 'completed',
              endedAt: new Date(),
              winnerId: isDraw ? null : winnerId,
            },
          })

          // Create Submissions
          await prisma.submission.createMany({
            data: [
              {
                duelId: room.dbDuelId,
                playerId: p1.userId,
                code: p1.code,
                language: p1.language,
                correctness: res1.score,
                totalScore: res1.score,
              },
              {
                duelId: room.dbDuelId,
                playerId: p2.userId,
                code: p2.code,
                language: p2.language,
                correctness: res2.score,
                totalScore: res2.score,
              },
            ],
          })

          // Create Elo History
          await prisma.eloHistory.createMany({
            data: [
              {
                userId: p1.userId,
                duelId: room.dbDuelId,
                eloBefore: R1,
                eloAfter: newEloP1,
                delta: deltaP1,
              },
              {
                userId: p2.userId,
                duelId: room.dbDuelId,
                eloBefore: R2,
                eloAfter: newEloP2,
                delta: deltaP2,
              },
            ],
          })
        }
      }
    } catch (e) {
      console.error('DB Update failed on duel end', e)
    }

    io.to(roomId).emit('duel_end', {
      winnerId,
      isDraw,
      playerCodes,
      playerLanguages,
      analysis: analysisData,
      eloUpdates: {
        [p1.userId]: { delta: deltaP1, newElo: newEloP1 },
        [p2.userId]: { delta: deltaP2, newElo: newEloP2 },
      },
    })

    activeRooms.delete(roomId)
  }

  // Global Timer Loop
  setInterval(() => {
    const now = Date.now()
    for (const [roomId, room] of activeRooms.entries()) {
      if (room.isProcessing) continue

      // Check disconnected timeouts
      let forfeitUserId = null
      for (const player of room.players.values()) {
        if (
          player.disconnectedAt &&
          (now - player.disconnectedAt) / 1000 > RECONNECT_TIMEOUT_SEC
        ) {
          forfeitUserId = player.userId
          break
        }
      }

      if (forfeitUserId) {
        endDuelAndEvaluate(roomId, room, forfeitUserId)
        continue
      }

      if (!room.hasStarted) continue

      room.remainingTime -= 1

      if (room.remainingTime <= 0) {
        endDuelAndEvaluate(roomId, room)
      } else {
        io.to(roomId).emit('timer_tick', { remaining: room.remainingTime })
      }
    }

    globalSocketStats.activePlayers = io.engine.clientsCount
    globalSocketStats.waitingPlayers = waitingPlayer ? 1 : 0
    globalSocketStats.activeDuels = activeRooms.size
  }, 1000)

  io.on('connection', (socket) => {
    socket.on('join_queue', ({ userId }) => {
      if (!userId) return

      if (waitingPlayer && waitingPlayer.userId !== userId) {
        const roomId = crypto.randomUUID()
        const p1 = waitingPlayer
        const p2 = { socket, userId }
        waitingPlayer = null

        activeRooms.set(roomId, {
          id: roomId,
          dbDuelId: null, // Will be set on start
          status: 'WAITING_ACCEPT',
          remainingTime: DUEL_DURATION_SEC,
          players: new Map([
            [
              p1.userId,
              {
                socketId: p1.socket.id,
                userId: p1.userId,
                code: '',
                language: 'javascript',
                hasSubmitted: false,
                disconnectedAt: null,
              },
            ],
            [
              p2.userId,
              {
                socketId: p2.socket.id,
                userId: p2.userId,
                code: '',
                language: 'javascript',
                hasSubmitted: false,
                disconnectedAt: null,
              },
            ],
          ]),
          isProcessing: false,
          hasStarted: false,
          lobbyProblems: [],
          playerAccepted: new Set(),
          playerSelections: new Map(),
          finalProblemId: null,
        })

        socket.emit('match_found', { roomId })
        p1.socket.emit('match_found', { roomId })

        // 10s wait for accept
        setTimeout(() => {
          const room = activeRooms.get(roomId)
          if (room && room.status === 'WAITING_ACCEPT') {
            io.to(room.players.get(p1.userId)?.socketId || '').emit(
              'match_aborted'
            )
            io.to(room.players.get(p2.userId)?.socketId || '').emit(
              'match_aborted'
            )

            // Requeue players who DID accept
            for (const p of room.players.values()) {
              if (room.playerAccepted.has(p.userId)) {
                const s = io.sockets.sockets.get(p.socketId)
                if (s && !waitingPlayer)
                  waitingPlayer = { socket: s, userId: p.userId }
              }
            }
            activeRooms.delete(roomId)
          }
        }, 10000)
      } else {
        waitingPlayer = { socket, userId }
      }
    })

    socket.on('leave_queue', () => {
      if (waitingPlayer && waitingPlayer.socket.id === socket.id) {
        waitingPlayer = null
      }
    })

    socket.on('accept_match', async ({ roomId, userId }) => {
      const room = activeRooms.get(roomId)
      if (room && room.status === 'WAITING_ACCEPT') {
        room.playerAccepted.add(userId)

        if (room.playerAccepted.size === 2) {
          room.status = 'PROBLEM_SELECTION'

          try {
            const problems = await prisma.problem.findMany()
            const shuffled = problems
              .sort(() => 0.5 - Math.random())
              .slice(0, 5)
            room.lobbyProblems = shuffled

            for (const p of room.players.values()) {
              io.to(p.socketId).emit('lobby_start', {
                roomId,
                problems: shuffled,
              })
            }

            let timeLeft = 30
            const lobbyInterval = setInterval(() => {
              timeLeft--
              for (const p of room.players.values()) {
                io.to(p.socketId).emit('lobby_timer', { remaining: timeLeft })
              }

              let bothLocked = true
              for (const pid of room.players.keys()) {
                const selections = room.playerSelections.get(pid) || []
                if (selections.length < 3) bothLocked = false
              }

              if (timeLeft <= 0 || bothLocked) {
                clearInterval(lobbyInterval)
                if (room.status !== 'PROBLEM_SELECTION') return
                room.status = 'ROULETTE'

                const allSelections = []
                for (const sels of room.playerSelections.values()) {
                  allSelections.push(...sels)
                }

                let finalId = null
                if (allSelections.length === 0) {
                  const randProblem =
                    room.lobbyProblems[
                      Math.floor(Math.random() * room.lobbyProblems.length)
                    ]
                  finalId = randProblem.id
                } else {
                  finalId =
                    allSelections[
                      Math.floor(Math.random() * allSelections.length)
                    ]
                }
                room.finalProblemId = finalId

                for (const p of room.players.values()) {
                  io.to(p.socketId).emit('roulette_start', {
                    finalProblemId: finalId,
                  })
                }

                setTimeout(() => {
                  room.status = 'IN_GAME'
                  for (const p of room.players.values()) {
                    io.to(p.socketId).emit('duel_ready', {
                      problemId: finalId,
                      roomId,
                    })
                  }
                }, 5000)
              }
            }, 1000)
          } catch (e) {
            console.error('Failed to start lobby', e)
          }
        }
      }
    })

    socket.on('reject_match', ({ roomId, userId }) => {
      const room = activeRooms.get(roomId)
      if (room && room.status === 'WAITING_ACCEPT') {
        for (const p of room.players.values()) {
          io.to(p.socketId).emit('match_aborted')
          if (p.userId !== userId) {
            const s = io.sockets.sockets.get(p.socketId)
            if (s && !waitingPlayer)
              waitingPlayer = { socket: s, userId: p.userId }
          }
        }
        activeRooms.delete(roomId)
      }
    })

    socket.on('select_problem', ({ roomId, userId, problemIds }) => {
      const room = activeRooms.get(roomId)
      if (room && room.status === 'PROBLEM_SELECTION') {
        const limited = problemIds.slice(0, 3)
        room.playerSelections.set(userId, limited)
        for (const p of room.players.values()) {
          if (p.userId !== userId) {
            io.to(p.socketId).emit('opponent_selection_update', {
              count: limited.length,
            })
          }
        }
      }
    })

    socket.on('join_room', async ({ roomId, userId }) => {
      if (!userId) return
      socket.join(roomId)

      const room = activeRooms.get(roomId)
      if (room) {
        // Check for reconnection
        let isReconnect = false
        let existingPlayer = null
        for (const p of room.players.values()) {
          if (p.userId === userId) {
            existingPlayer = p
            break
          }
        }

        if (existingPlayer) {
          existingPlayer.socketId = socket.id
          existingPlayer.disconnectedAt = null // Reconnected!
          isReconnect = true
          // Send them their old code so their client can restore it
          socket.emit('restore_state', {
            code: existingPlayer.code,
            language: existingPlayer.language,
            remainingTime: room.remainingTime,
          })
        } else {
          room.players.set(userId, {
            socketId: socket.id,
            userId: userId,
            code: '',
            language: 'javascript',
            hasSubmitted: false,
            disconnectedAt: null,
          })
        }

        // If 2 players are in the room and it hasn't started, start it
        if (room.players.size === 2 && !room.hasStarted) {
          room.hasStarted = true

          // Create Duel in DB
          if (room.finalProblemId || mockProblemId) {
            try {
              const pArray = Array.from(room.players.values())
              const dbDuel = await prisma.duel.create({
                data: {
                  player1Id: pArray[0].userId,
                  player2Id: pArray[1].userId,
                  problemId: room.finalProblemId || mockProblemId || '',
                  status: 'ongoing',
                  startedAt: new Date(),
                },
              })
              room.dbDuelId = dbDuel.id
            } catch (err) {
              console.error('Failed to create duel in DB', err)
            }
          }

          io.to(roomId).emit('duel_start')
        }

        if (room.players.size === 2) {
          try {
            const pArray = Array.from(room.players.values())
            const users = await prisma.user.findMany({
              where: { id: { in: [pArray[0].userId, pArray[1].userId] } },
              select: { id: true, username: true, elo: true, avatarUrl: true },
            })
            const u1 = users.find((u) => u.id === pArray[0].userId)
            const u2 = users.find((u) => u.id === pArray[1].userId)

            if (u1 && u2) {
              io.to(pArray[0].socketId).emit('opponent_info', u2)
              io.to(pArray[1].socketId).emit('opponent_info', u1)
            }
          } catch (e) {
            console.error('Failed to fetch opponent info', e)
          }
        }
      }
      socket.to(roomId).emit('opponent_joined')
    })

    socket.on('code_update', ({ roomId, userId, code, language }) => {
      const room = activeRooms.get(roomId)
      if (room && userId) {
        const player = room.players.get(userId)
        if (player) {
          player.code = code
          if (language) player.language = language
        }
      }
      socket.to(roomId).emit('code_update', code)
    })

    socket.on('opponent_activity', ({ roomId, activity }) => {
      socket.to(roomId).emit('opponent_activity', activity)
    })

    socket.on('submit_code', async ({ roomId, userId }) => {
      const room = activeRooms.get(roomId)
      if (!room || !userId) return

      const player = room.players.get(userId)
      if (player) player.hasSubmitted = true

      // Check if both players submitted
      let allSubmitted = true
      for (const p of room.players.values()) {
        if (!p.hasSubmitted) allSubmitted = false
      }

      if (allSubmitted && room.players.size === 2) {
        io.to(roomId).emit('evaluating_results')
        endDuelAndEvaluate(roomId, room)
      } else {
        socket
          .to(roomId)
          .emit('opponent_activity', 'Submitted Code! Waiting for you...')
      }
    })

    socket.on('forfeit', ({ roomId, userId }) => {
      const room = activeRooms.get(roomId)
      if (!room || !userId) return

      // The user who emitted forfeit is the one forfeiting
      endDuelAndEvaluate(roomId, room, userId)
    })

    socket.on('request_rematch', ({ oldRoomId, userId }) => {
      if (!userId) return
      let requests = rematchRequests.get(oldRoomId)
      if (!requests) {
        requests = new Set()
        rematchRequests.set(oldRoomId, requests)
      }

      requests.add(userId)
      socket.to(oldRoomId).emit('rematch_requested')

      if (requests.size === 2) {
        const newRoomId = crypto.randomUUID()
        activeRooms.set(newRoomId, {
          id: newRoomId,
          dbDuelId: null,
          status: 'IN_GAME',
          remainingTime: DUEL_DURATION_SEC,
          players: new Map(),
          isProcessing: false,
          hasStarted: false,
          lobbyProblems: [],
          playerAccepted: new Set(),
          playerSelections: new Map(),
          finalProblemId: null,
        })

        io.to(oldRoomId).emit('rematch_accepted', { newRoomId })
        rematchRequests.delete(oldRoomId)
      }
    })

    socket.on('create_private_room', ({ userId }) => {
      const roomId = crypto.randomUUID()
      activeRooms.set(roomId, {
        id: roomId,
        dbDuelId: null,
        status: 'IN_GAME',
        remainingTime: DUEL_DURATION_SEC,
        players: new Map(),
        isProcessing: false,
        hasStarted: false,
        lobbyProblems: [],
        playerAccepted: new Set(),
        playerSelections: new Map(),
        finalProblemId: null,
      })
      socket.emit('private_room_created', { roomId })
    })

    socket.on('check_active_duel', ({ userId }) => {
      if (!userId) return
      for (const room of activeRooms.values()) {
        for (const player of room.players.values()) {
          if (player.userId === userId && !room.isProcessing) {
            socket.emit('active_duel_found', { roomId: room.id })
            return
          }
        }
      }
    })

    socket.on('disconnect', () => {
      if (waitingPlayer && waitingPlayer.socket.id === socket.id) {
        waitingPlayer = null
      }

      // Mark player as disconnected in their room
      const room = getRoomBySocketId(socket.id)
      if (room) {
        for (const player of room.players.values()) {
          if (player.socketId === socket.id) {
            player.disconnectedAt = Date.now()
            socket
              .to(room.id)
              .emit(
                'opponent_activity',
                'Opponent disconnected. Reconnecting...'
              )
            break
          }
        }
      }
    })
  })

  return io
}
