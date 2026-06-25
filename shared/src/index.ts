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
}

export interface AuthUser extends UserProfile {
  email: string
  githubId?: string
}

export interface UpdateProfilePayload {
  location?: string
  mobileNumber?: string
  avatarUrl?: string
  preferredLang?: string
}

export interface JwtPayload {
  userId: string
  username: string
}

export interface AuthResponse {
  accessToken: string
  user: UserProfile
}

export interface DuelStatus {
  duelId: string
  status: 'pending' | 'active' | 'completed'
}
