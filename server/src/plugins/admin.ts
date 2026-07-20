import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../db.js'

export const checkIsAdmin = (email: string) => {
  const adminEmailsStr = process.env.ADMIN_EMAILS || ''
  const adminEmails = adminEmailsStr
    .split(',')
    .map((e) => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

export const isAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = (request.user as any)?.userId
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user || !checkIsAdmin(user.email)) {
    return reply.status(403).send({ error: 'Forbidden: Admin access required' })
  }
}
