// Shared Types and Utilities
export interface UserProfile {
  id: string
  username: string
  elo: number
  rankTier: string
  avatarUrl?: string
  location?: string
  mobileNumber?: string
  preferredLang?: string
  xp?: number
  level?: number
}

export interface AuthUser extends UserProfile {
  email: string
  githubId?: string
  emailVerified: boolean
  isAdmin?: boolean
}

export interface UpdateProfilePayload {
  location?: string
  mobileNumber?: string | null
  avatarUrl?: string | null
  preferredLang?: string
}

export interface JwtPayload {
  userId: string
  username: string
}

export interface AuthResponse {
  accessToken: string
  user: AuthUser
}

export interface DuelStatus {
  duelId: string
  status: 'pending' | 'active' | 'completed'
}
