/**
 * Utility for calculating XP and Level based on Match Results.
 */

export const LEVEL_BASE_XP = 100

// Calculates level using a simple progressive formula
// Formula: Level = Math.floor(Math.sqrt(XP / 100)) + 1
// XP required for Level L = 100 * (L - 1)^2
export const calculateLevelFromXp = (xp: number): number => {
  if (xp < 0) return 1
  return Math.floor(Math.sqrt(xp / LEVEL_BASE_XP)) + 1
}

export const getXpToNextLevel = (level: number): number => {
  return LEVEL_BASE_XP * Math.pow(level, 2)
}

export const getXpForCurrentLevel = (level: number): number => {
  return LEVEL_BASE_XP * Math.pow(level - 1, 2)
}

export const calculateMatchXp = (
  result: 'win' | 'loss' | 'draw',
  difficulty: string
): number => {
  let base = 0
  if (result === 'win') {
    base = 50
  } else if (result === 'draw') {
    base = 25
  } else {
    base = 10 // Participation XP
  }

  // Difficulty multiplier
  let multiplier = 1.0
  const diff = difficulty.toLowerCase()
  if (diff === 'medium') multiplier = 1.5
  if (diff === 'hard') multiplier = 2.0

  return Math.floor(base * multiplier)
}
