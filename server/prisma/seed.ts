import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data (optional, but good for a fresh seed)
  await prisma.submission.deleteMany()
  await prisma.eloHistory.deleteMany()
  await prisma.duel.deleteMany()
  await prisma.problem.deleteMany()
  // We keep existing users to not break the user's current session if they are testing,
  // or we can just upsert the supervisor and test accounts.

  const passwordHash = await bcrypt.hash('test1234', 10)

  // 1. Create Supervisor and Test Users
  const usersToCreate = [
    {
      username: 'supervisor',
      email: 'supervisor@code-dual.com',
      elo: 1500,
      location: 'France',
      emailVerified: true,
    },
    {
      username: 'AliceTheDev',
      email: 'alice@test.com',
      elo: 1650,
      location: 'Canada',
      emailVerified: true,
    },
    {
      username: 'BobBuilder',
      email: 'bob@test.com',
      elo: 1400,
      location: 'USA',
      emailVerified: true,
    },
    {
      username: 'CharlieCode',
      email: 'charlie@test.com',
      elo: 1700,
      location: 'UK',
      emailVerified: true,
    },
  ]

  const createdUsers = []
  for (const u of usersToCreate) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        username: u.username,
        email: u.email,
        passwordHash,
        elo: u.elo,
        location: u.location,
        emailVerified: u.emailVerified,
      },
    })
    createdUsers.push(user)
    console.log(`✅ Created user: ${user.username}`)
  }

  // 2. Create Problems
  const problem1 = await prisma.problem.create({
    data: {
      title: 'Two Sum',
      difficulty: 'Easy',
      tags: ['Array', 'Hash Table'],
      visibleTests: [
        { input: '([2, 7, 11, 15], 9)', expected: '[0, 1]' },
        { input: '([3, 2, 4], 6)', expected: '[1, 2]' },
      ],
      hiddenTests: [
        { input: '([3, 3], 6)', expected: '[0, 1]' },
        { input: '([2, 7, 11, 15], 26)', expected: '[2, 3]' },
      ],
    },
  })

  const problem2 = await prisma.problem.create({
    data: {
      title: 'Valid Anagram',
      difficulty: 'Easy',
      tags: ['String', 'Sorting'],
      visibleTests: [
        { input: "('anagram', 'nagaram')", expected: 'true' },
        { input: "('rat', 'car')", expected: 'false' },
      ],
      hiddenTests: [{ input: "('a', 'ab')", expected: 'false' }],
    },
  })
  console.log(`✅ Created problems`)

  // 3. Create mock duels and ELO history to populate leaderboard
  const supervisor = createdUsers[0]
  const alice = createdUsers[1]
  const bob = createdUsers[2]
  const charlie = createdUsers[3]

  // Match 1: Supervisor vs Alice (Supervisor wins)
  const duel1 = await prisma.duel.create({
    data: {
      player1Id: supervisor.id,
      player2Id: alice.id,
      problemId: problem1.id,
      status: 'completed',
      winnerId: supervisor.id,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      endedAt: new Date(Date.now() - 1000 * 60 * 60 * 23.9),
    },
  })

  await prisma.eloHistory.create({
    data: {
      userId: supervisor.id,
      duelId: duel1.id,
      eloBefore: 1484,
      eloAfter: 1500,
      delta: 16,
    },
  })
  await prisma.eloHistory.create({
    data: {
      userId: alice.id,
      duelId: duel1.id,
      eloBefore: 1666,
      eloAfter: 1650,
      delta: -16,
    },
  })

  // Match 2: Bob vs Charlie (Charlie wins)
  const duel2 = await prisma.duel.create({
    data: {
      player1Id: bob.id,
      player2Id: charlie.id,
      problemId: problem2.id,
      status: 'completed',
      winnerId: charlie.id,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
      endedAt: new Date(Date.now() - 1000 * 60 * 60 * 4.8),
    },
  })

  await prisma.eloHistory.create({
    data: {
      userId: bob.id,
      duelId: duel2.id,
      eloBefore: 1410,
      eloAfter: 1400,
      delta: -10,
    },
  })
  await prisma.eloHistory.create({
    data: {
      userId: charlie.id,
      duelId: duel2.id,
      eloBefore: 1690,
      eloAfter: 1700,
      delta: 10,
    },
  })

  // Create some submissions
  await prisma.submission.create({
    data: {
      duelId: duel1.id,
      playerId: supervisor.id,
      code: 'function twoSum(nums, target) { return [0, 1]; }',
      language: 'javascript',
      correctness: 100,
    },
  })

  console.log(`✅ Seeded duels and history`)
  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
