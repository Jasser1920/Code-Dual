import { prisma } from '../db.js'
import { emitToUser } from '../socket.js'
import { calculateLevelFromXp } from '../utils/xp.js'

export const DEFAULT_ACHIEVEMENTS = [
  {
    code: 'FIRST_WIN',
    title: 'First Blood',
    description: 'Win your first competitive duel in Code-Dual.',
    iconUrl: '🗡️',
    xpReward: 50,
    eloReward: 10,
    isSecret: false,
  },
  {
    code: 'WIN_STREAK_3',
    title: 'On Fire',
    description: 'Achieve a 3-game win streak in competitive duels.',
    iconUrl: '🔥',
    xpReward: 100,
    eloReward: 25,
    isSecret: false,
  },
  {
    code: 'WIN_STREAK_5',
    title: 'Unstoppable',
    description: 'Achieve a legendary 5-game win streak.',
    iconUrl: '⚡',
    xpReward: 250,
    eloReward: 50,
    isSecret: false,
  },
  {
    code: 'ELO_1200',
    title: 'Silver Competitor',
    description: 'Reach a competitive ELO rating of 1200.',
    iconUrl: '🥈',
    xpReward: 150,
    eloReward: 0,
    isSecret: false,
  },
  {
    code: 'ELO_1500',
    title: 'Gold Gladiator',
    description: 'Reach an elite ELO rating of 1500.',
    iconUrl: '🥇',
    xpReward: 300,
    eloReward: 0,
    isSecret: false,
  },
  {
    code: 'ELO_1800',
    title: 'Diamond Grandmaster',
    description: 'Ascend to the prestigious 1800 ELO rating.',
    iconUrl: '💎',
    xpReward: 500,
    eloReward: 0,
    isSecret: false,
  },
  {
    code: 'DUEL_VETERAN',
    title: 'Arena Veteran',
    description: 'Complete 10 competitive duels.',
    iconUrl: '🛡️',
    xpReward: 200,
    eloReward: 15,
    isSecret: false,
  },
  {
    code: 'SPEED_DEMON',
    title: 'Speed Demon',
    description: 'Submit a winning solution in under 2 minutes.',
    iconUrl: '🚀',
    xpReward: 250,
    eloReward: 30,
    isSecret: false,
  },
  {
    code: 'TOURNAMENT_CHAMPION',
    title: 'Tournament Champion',
    description: 'Win a competitive arena tournament.',
    iconUrl: '🏆',
    xpReward: 1000,
    eloReward: 100,
    isSecret: true,
  },
]

export async function seedDefaultAchievements() {
  try {
    for (const ach of DEFAULT_ACHIEVEMENTS) {
      await prisma.achievement.upsert({
        where: { code: ach.code },
        update: {
          title: ach.title,
          description: ach.description,
          iconUrl: ach.iconUrl,
          xpReward: ach.xpReward,
          eloReward: ach.eloReward,
          isSecret: ach.isSecret,
        },
        create: ach,
      })
    }
    console.log('✅ Seeded default achievements into database.')
  } catch (err) {
    console.error('Failed to seed achievements:', err)
  }
}

export async function evaluateUserAchievements(
  userId: string,
  options: {
    solveTimeSec?: number
    wonTournament?: boolean
    rewardBadgeCode?: string | null
  } = {}
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })
    if (!user) return []

    // Fetch all available achievements and user's already unlocked ones
    const [allAchievements, userAchievements] = await Promise.all([
      prisma.achievement.findMany(),
      prisma.userAchievement.findMany({ where: { userId } }),
    ])

    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId))
    const toUnlockCodes: string[] = []

    // 1. Check ELO milestones
    if (user.elo >= 1200) toUnlockCodes.push('ELO_1200')
    if (user.elo >= 1500) toUnlockCodes.push('ELO_1500')
    if (user.elo >= 1800) toUnlockCodes.push('ELO_1800')

    // 2. Fetch duels history to check wins, streak, and total completed duels
    const completedDuels = await prisma.duel.findMany({
      where: {
        status: 'completed',
        OR: [{ player1Id: userId }, { player2Id: userId }],
      },
      orderBy: { endedAt: 'desc' },
    })

    if (completedDuels.length >= 10) {
      toUnlockCodes.push('DUEL_VETERAN')
    }

    const winsCount = completedDuels.filter((d) => d.winnerId === userId).length
    if (winsCount >= 1) {
      toUnlockCodes.push('FIRST_WIN')
    }

    // Calculate win streak from most recent duels
    let currentStreak = 0
    for (const d of completedDuels) {
      if (d.winnerId === userId) {
        currentStreak++
      } else if (d.winnerId !== null) {
        // Lost to an opponent breaks the streak
        break
      }
    }

    if (currentStreak >= 3) toUnlockCodes.push('WIN_STREAK_3')
    if (currentStreak >= 5) toUnlockCodes.push('WIN_STREAK_5')

    // 3. Check Speed Demon
    if (options.solveTimeSec !== undefined && options.solveTimeSec <= 120) {
      toUnlockCodes.push('SPEED_DEMON')
    }

    // 4. Check Tournament Champion or custom reward badge
    if (options.wonTournament) {
      if (options.rewardBadgeCode) {
        toUnlockCodes.push(options.rewardBadgeCode)
      } else {
        toUnlockCodes.push('TOURNAMENT_CHAMPION')
      }
    }

    // Process unlocks
    const newlyUnlocked: any[] = []
    let totalXpGain = 0
    let totalEloGain = 0

    for (const code of toUnlockCodes) {
      const ach = allAchievements.find((a) => a.code === code)
      if (ach && !unlockedIds.has(ach.id)) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: ach.id,
          },
        })
        newlyUnlocked.push(ach)
        totalXpGain += ach.xpReward
        totalEloGain += ach.eloReward
        unlockedIds.add(ach.id)

        // Emit live real-time unlock event!
        emitToUser(userId, 'achievement:unlocked', { achievement: ach })
      }
    }

    // Award XP and ELO rewards if any new achievements were unlocked
    if (newlyUnlocked.length > 0) {
      const updatedXp = user.xp + totalXpGain
      const updatedElo = user.elo + totalEloGain
      const updatedLevel = calculateLevelFromXp(updatedXp)

      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: updatedXp,
          elo: updatedElo,
          level: updatedLevel,
        },
      })
      console.log(
        `🏆 User @${user.username} unlocked ${newlyUnlocked.length} achievement(s)! (+${totalXpGain} XP, +${totalEloGain} ELO)`
      )
    }

    return newlyUnlocked
  } catch (err) {
    console.error('Error evaluating achievements:', err)
    return []
  }
}
