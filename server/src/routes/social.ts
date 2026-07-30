import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../db.js'
import { isUserOnline, emitToUser } from '../socket.js'

const socialRoutes: FastifyPluginAsync = async (fastify) => {
  // Apply authentication to all social routes
  fastify.addHook('preHandler', fastify.authenticate)

  // Get social summary: friends list (with online status), pending requests, and blocked users
  fastify.get('/list', async (request, reply) => {
    const userId = (request.user as any).userId

    // 1. Fetch friendships
    const friendships = await prisma.friendship.findMany({
      where: { userId },
      include: {
        friend: {
          select: {
            id: true,
            username: true,
            elo: true,
            rankTier: true,
            avatarUrl: true,
            preferredLang: true,
          },
        },
      },
    })

    const friends = friendships.map((f) => ({
      id: f.friend.id,
      username: f.friend.username,
      elo: f.friend.elo,
      rankTier: f.friend.rankTier,
      avatarUrl: f.friend.avatarUrl,
      preferredLang: f.friend.preferredLang,
      isOnline: isUserOnline(f.friend.id),
    }))

    // 2. Fetch pending incoming friend requests
    const incomingRequests = await prisma.friendRequest.findMany({
      where: { receiverId: userId, status: 'PENDING' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            elo: true,
            rankTier: true,
            avatarUrl: true,
          },
        },
      },
    })

    // 3. Fetch pending outgoing friend requests
    const outgoingRequests = await prisma.friendRequest.findMany({
      where: { senderId: userId, status: 'PENDING' },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            elo: true,
            rankTier: true,
            avatarUrl: true,
          },
        },
      },
    })

    // 4. Fetch blocked users
    const blocked = await prisma.blockedUser.findMany({
      where: { userId },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    })

    return {
      success: true,
      friends,
      incomingRequests: incomingRequests.map((r) => ({
        id: r.id,
        sender: r.sender,
        createdAt: r.createdAt,
      })),
      outgoingRequests: outgoingRequests.map((r) => ({
        id: r.id,
        receiver: r.receiver,
        createdAt: r.createdAt,
      })),
      blocked: blocked.map((b) => ({
        id: b.blocked.id,
        username: b.blocked.username,
        avatarUrl: b.blocked.avatarUrl,
      })),
    }
  })

  // Search users for adding friends
  fastify.get('/search', async (request, reply) => {
    const userId = (request.user as any).userId
    const { q } = request.query as { q?: string }

    if (!q || q.trim().length < 1) {
      return { success: true, users: [] }
    }

    const queryStr = q.trim()
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: queryStr,
          mode: 'insensitive',
        },
        NOT: {
          id: userId,
        },
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        rankTier: true,
        elo: true,
      },
      take: 10,
    })

    const [friendships, outgoing, incoming, blocked] = await Promise.all([
      prisma.friendship.findMany({
        where: { userId, friendId: { in: users.map((u) => u.id) } },
      }),
      prisma.friendRequest.findMany({
        where: {
          senderId: userId,
          receiverId: { in: users.map((u) => u.id) },
          status: 'PENDING',
        },
      }),
      prisma.friendRequest.findMany({
        where: {
          receiverId: userId,
          senderId: { in: users.map((u) => u.id) },
          status: 'PENDING',
        },
      }),
      prisma.blockedUser.findMany({
        where: {
          OR: [
            { userId, blockedId: { in: users.map((u) => u.id) } },
            { blockedId: userId, userId: { in: users.map((u) => u.id) } },
          ],
        },
      }),
    ])

    const friendIds = new Set(friendships.map((f) => f.friendId))
    const outgoingIds = new Set(outgoing.map((o) => o.receiverId))
    const incomingIds = new Set(incoming.map((i) => i.senderId))
    const blockedIds = new Set(
      blocked.map((b) => (b.userId === userId ? b.blockedId : b.userId))
    )

    const enrichedUsers = users.map((u) => ({
      ...u,
      isFriend: friendIds.has(u.id),
      isRequestSent: outgoingIds.has(u.id),
      isRequestReceived: incomingIds.has(u.id),
      isBlocked: blockedIds.has(u.id),
    }))

    return { success: true, users: enrichedUsers }
  })

  // Send a friend request by username
  fastify.post('/request', async (request, reply) => {
    const senderId = (request.user as any).userId
    const { username } = request.body as { username?: string }

    if (!username) {
      return reply.status(400).send({ error: 'Username is required' })
    }

    const targetUser = await prisma.user.findUnique({
      where: { username },
    })

    if (!targetUser) {
      return reply.status(404).send({ error: 'User not found' })
    }

    if (targetUser.id === senderId) {
      return reply
        .status(400)
        .send({ error: 'Cannot send friend request to yourself' })
    }

    // Check if blocked
    const isBlocked = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { userId: senderId, blockedId: targetUser.id },
          { userId: targetUser.id, blockedId: senderId },
        ],
      },
    })

    if (isBlocked) {
      const errMsg =
        isBlocked.userId === senderId
          ? 'You have blocked this user. Please unblock them in the Blocked tab first.'
          : 'This user is not accepting friend requests at this time.'
      return reply.status(403).send({ error: errMsg })
    }

    // Check if already friends
    const existingFriendship = await prisma.friendship.findUnique({
      where: {
        userId_friendId: {
          userId: senderId,
          friendId: targetUser.id,
        },
      },
    })

    if (existingFriendship) {
      return reply.status(400).send({ error: 'Already friends with this user' })
    }

    // Check if request already exists
    const existingReq = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId: targetUser.id, status: 'PENDING' },
          { senderId: targetUser.id, receiverId: senderId, status: 'PENDING' },
        ],
      },
    })

    if (existingReq) {
      if (existingReq.senderId === targetUser.id) {
        // Auto-accept if they already sent us a request!
        await prisma.$transaction([
          prisma.friendRequest.update({
            where: { id: existingReq.id },
            data: { status: 'ACCEPTED' },
          }),
          prisma.friendship.createMany({
            data: [
              { userId: senderId, friendId: targetUser.id },
              { userId: targetUser.id, friendId: senderId },
            ],
            skipDuplicates: true,
          }),
        ])
        return {
          success: true,
          message: 'Friend request accepted automatically!',
        }
      }
      return reply.status(400).send({ error: 'Friend request already pending' })
    }

    const newRequest = await prisma.friendRequest.create({
      data: {
        senderId,
        receiverId: targetUser.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            elo: true,
            rankTier: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Notify receiver in real-time if online
    emitToUser(targetUser.id, 'friend:request_receive', {
      id: newRequest.id,
      sender: newRequest.sender,
      createdAt: newRequest.createdAt,
    })

    return { success: true, request: newRequest }
  })

  // Accept a friend request
  fastify.post('/accept/:requestId', async (request, reply) => {
    const userId = (request.user as any).userId
    const { requestId } = request.params as { requestId: string }

    const freq = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    })

    if (!freq || freq.receiverId !== userId || freq.status !== 'PENDING') {
      return reply
        .status(404)
        .send({ error: 'Pending friend request not found' })
    }

    await prisma.$transaction([
      prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      }),
      prisma.friendship.createMany({
        data: [
          { userId: freq.senderId, friendId: freq.receiverId },
          { userId: freq.receiverId, friendId: freq.senderId },
        ],
        skipDuplicates: true,
      }),
    ])

    // Notify sender that request was accepted
    emitToUser(freq.senderId, 'friend:request_accepted', { userId })

    return { success: true, message: 'Friend request accepted' }
  })

  // Reject a friend request
  fastify.post('/reject/:requestId', async (request, reply) => {
    const userId = (request.user as any).userId
    const { requestId } = request.params as { requestId: string }

    const freq = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    })

    if (!freq || freq.receiverId !== userId || freq.status !== 'PENDING') {
      return reply
        .status(404)
        .send({ error: 'Pending friend request not found' })
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    })

    return { success: true, message: 'Friend request rejected' }
  })

  // Remove a friend
  fastify.delete('/friend/:friendId', async (request, reply) => {
    const userId = (request.user as any).userId
    const { friendId } = request.params as { friendId: string }

    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    })

    return { success: true, message: 'Friend removed' }
  })

  // Block a user
  fastify.post('/block/:targetId', async (request, reply) => {
    const userId = (request.user as any).userId
    const { targetId } = request.params as { targetId: string }

    if (userId === targetId) {
      return reply.status(400).send({ error: 'Cannot block yourself' })
    }

    // Remove any friendships or pending requests
    await prisma.$transaction([
      prisma.friendship.deleteMany({
        where: {
          OR: [
            { userId, friendId: targetId },
            { userId: targetId, friendId: userId },
          ],
        },
      }),
      prisma.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: userId, receiverId: targetId },
            { senderId: targetId, receiverId: userId },
          ],
        },
      }),
      prisma.blockedUser.upsert({
        where: {
          userId_blockedId: { userId, blockedId: targetId },
        },
        update: {},
        create: { userId, blockedId: targetId },
      }),
    ])

    return { success: true, message: 'User blocked' }
  })

  // Unblock a user
  fastify.delete('/block/:targetId', async (request, reply) => {
    const userId = (request.user as any).userId
    const { targetId } = request.params as { targetId: string }

    await prisma.blockedUser.deleteMany({
      where: { userId, blockedId: targetId },
    })

    return { success: true, message: 'User unblocked' }
  })

  // Fetch chat message history with a friend
  fastify.get('/messages/:friendId', async (request, reply) => {
    const userId = (request.user as any).userId
    const { friendId } = request.params as { friendId: string }

    // Verify friendship
    const isFriend = await prisma.friendship.findUnique({
      where: { userId_friendId: { userId, friendId } },
    })

    if (!isFriend) {
      return reply.status(403).send({ error: 'Can only message friends' })
    }

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 100, // Last 100 messages
    })

    // Mark received messages as read
    await prisma.directMessage.updateMany({
      where: { senderId: friendId, receiverId: userId, read: false },
      data: { read: true },
    })

    return { success: true, messages }
  })

  // Send a direct message to a friend
  fastify.post('/messages/:friendId', async (request, reply) => {
    const senderId = (request.user as any).userId
    const { friendId } = request.params as { friendId: string }
    const { content } = request.body as { content?: string }

    if (!content || !content.trim()) {
      return reply
        .status(400)
        .send({ error: 'Message content cannot be empty' })
    }

    // Verify friendship
    const isFriend = await prisma.friendship.findUnique({
      where: { userId_friendId: { userId: senderId, friendId } },
    })

    if (!isFriend) {
      return reply.status(403).send({ error: 'Can only message friends' })
    }

    const message = await prisma.directMessage.create({
      data: {
        senderId,
        receiverId: friendId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: { username: true, avatarUrl: true },
        },
      },
    })

    // Emit real-time message event to receiver
    emitToUser(friendId, 'message:receive', message)

    return { success: true, message }
  })
}

export default socialRoutes
