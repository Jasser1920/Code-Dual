interface BadgeProps {
  size?: number
  className?: string
}

export function TournamentChampionBadge({
  size = 32,
  className = '',
}: BadgeProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F7D070" />
          <stop offset="50%" stopColor="#C59A27" />
          <stop offset="100%" stopColor="#E0B644" />
        </linearGradient>
        <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="3"
            floodColor="#F7D070"
            floodOpacity="0.6"
          />
        </filter>
      </defs>

      {/* Outer Hexagonal Shield */}
      <polygon
        points="32,4 58,16 58,48 32,60 6,48 6,16"
        fill="#0E0E14"
        stroke="url(#goldGrad)"
        strokeWidth="2.5"
        filter="url(#goldGlow)"
      />
      {/* Inner Accent Lines */}
      <polygon
        points="32,8 54,18 54,46 32,56 10,46 10,18"
        fill="none"
        stroke="#2A2210"
        strokeWidth="1"
      />

      {/* Crown */}
      <path
        d="M18 42L16 24L26 32L32 20L38 32L48 24L46 42H18Z"
        fill="url(#goldGrad)"
        stroke="#4A3B0F"
        strokeWidth="1"
      />

      {/* Gems */}
      <circle cx="32" cy="20" r="2" fill="#00FFCC" />
      <circle cx="16" cy="24" r="1.5" fill="#00FFCC" />
      <circle cx="48" cy="24" r="1.5" fill="#00FFCC" />
      <circle cx="32" cy="38" r="2.5" fill="#FF4444" />
    </svg>
  )
}

export function SpeedDemonBadge({ size = 32, className = '' }: BadgeProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FFFF" />
          <stop offset="100%" stopColor="#0088FF" />
        </linearGradient>
        <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="3"
            floodColor="#00FFFF"
            floodOpacity="0.7"
          />
        </filter>
      </defs>

      {/* Octagon Plate */}
      <polygon
        points="20,4 44,4 60,20 60,44 44,60 20,60 4,44 4,20"
        fill="#080F18"
        stroke="url(#cyanGrad)"
        strokeWidth="2.5"
        filter="url(#cyanGlow)"
      />

      {/* Cyber Circuit Lines */}
      <line x1="20" y1="12" x2="44" y2="12" stroke="#003366" strokeWidth="1" />
      <line x1="20" y1="52" x2="44" y2="52" stroke="#003366" strokeWidth="1" />

      {/* Sharp Lightning Bolt */}
      <path
        d="M36 8L18 34H32L26 56L48 28H34L36 8Z"
        fill="url(#cyanGrad)"
        stroke="#002244"
        strokeWidth="1"
      />
    </svg>
  )
}

export function WinStreak5Badge({ size = 32, className = '' }: BadgeProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="fireGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#FF2200" />
          <stop offset="60%" stopColor="#FF9900" />
          <stop offset="100%" stopColor="#FFEA00" />
        </linearGradient>
        <filter id="fireGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="3"
            floodColor="#FF6600"
            floodOpacity="0.8"
          />
        </filter>
      </defs>

      {/* Diamond Base */}
      <polygon
        points="32,4 58,32 32,60 6,32"
        fill="#120805"
        stroke="url(#fireGrad)"
        strokeWidth="2.5"
        filter="url(#fireGlow)"
      />

      {/* Flame Crest */}
      <path
        d="M32 14C32 14 38 24 38 30C38 34 35 36 32 36C29 36 26 34 26 30C26 24 32 14 32 14Z"
        fill="url(#fireGrad)"
      />
      <path
        d="M32 20C32 20 44 28 44 40C44 48 38 52 32 52C26 52 20 48 20 40C20 28 32 20 32 20Z"
        fill="url(#fireGrad)"
        opacity="0.85"
      />
      {/* Inner Core Flame */}
      <path
        d="M32 32C32 32 36 38 36 43C36 46 34 48 32 48C30 48 28 46 28 43C28 38 32 32 32 32Z"
        fill="#FFFFFF"
      />
    </svg>
  )
}

export function Elo1500Badge({ size = 32, className = '' }: BadgeProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <filter id="purpleGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="3"
            floodColor="#A855F7"
            floodOpacity="0.7"
          />
        </filter>
      </defs>

      {/* Hexagon Frame */}
      <polygon
        points="32,4 56,18 56,46 32,60 8,46 8,18"
        fill="#100818"
        stroke="url(#purpleGrad)"
        strokeWidth="2.5"
        filter="url(#purpleGlow)"
      />

      {/* Gladiator Helmet visor */}
      <path
        d="M20 24H44V34C44 41 38 46 32 48C26 46 20 41 20 34V24Z"
        fill="url(#purpleGrad)"
        stroke="#2E1065"
        strokeWidth="1.5"
      />
      <line x1="32" y1="24" x2="32" y2="48" stroke="#100818" strokeWidth="2" />
      <line x1="24" y1="32" x2="40" y2="32" stroke="#100818" strokeWidth="2" />
    </svg>
  )
}

export function DuelVeteranBadge({ size = 32, className = '' }: BadgeProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <filter id="silverGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="2.5"
            floodColor="#CBD5E1"
            floodOpacity="0.5"
          />
        </filter>
      </defs>

      {/* Round Shield */}
      <circle
        cx="32"
        cy="32"
        r="26"
        fill="#0F172A"
        stroke="url(#silverGrad)"
        strokeWidth="2.5"
        filter="url(#silverGlow)"
      />

      {/* Crossed Swords */}
      <path
        d="M18 18L46 46M46 18L18 46"
        stroke="url(#silverGrad)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="32" cy="32" r="4" fill="#00FFCC" />
    </svg>
  )
}

export function FirstWinBadge({ size = 32, className = '' }: BadgeProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="3"
            floodColor="#10B981"
            floodOpacity="0.6"
          />
        </filter>
      </defs>

      {/* Shield */}
      <path
        d="M32 6L54 16V36C54 48 44 56 32 60C20 56 10 48 10 36V16L32 6Z"
        fill="#042F2E"
        stroke="url(#emeraldGrad)"
        strokeWidth="2.5"
        filter="url(#emeraldGlow)"
      />

      {/* Starburst */}
      <path
        d="M32 18L35.5 27.5L45 28.5L37.5 35L40 44.5L32 39.5L24 44.5L26.5 35L19 28.5L28.5 27.5L32 18Z"
        fill="url(#emeraldGrad)"
        stroke="#022C22"
        strokeWidth="1"
      />
    </svg>
  )
}

/**
 * Returns the matching custom SVG badge component for a given badge code.
 */
export function CustomBadgeIcon({
  code,
  size = 32,
  className = '',
}: {
  code?: string
  size?: number
  className?: string
}) {
  switch (code) {
    case 'TOURNAMENT_CHAMPION':
      return <TournamentChampionBadge size={size} className={className} />
    case 'SPEED_DEMON':
      return <SpeedDemonBadge size={size} className={className} />
    case 'WIN_STREAK_5':
      return <WinStreak5Badge size={size} className={className} />
    case 'ELO_1500':
      return <Elo1500Badge size={size} className={className} />
    case 'DUEL_VETERAN':
      return <DuelVeteranBadge size={size} className={className} />
    case 'FIRST_WIN':
      return <FirstWinBadge size={size} className={className} />
    default:
      return <TournamentChampionBadge size={size} className={className} />
  }
}
