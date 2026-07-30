import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { api } from '../api/axios'
import {
  Trophy,
  Crown,
  Users,
  Shield,
  Calendar,
  Swords,
  CheckCircle,
  Clock3,
  XCircle,
  AlertCircle,
  X,
  Lock,
} from 'lucide-react'
import { cn } from '../components/ui/utils'
import { showTerminalToast } from '../components/ui/terminal-toast'
import { CustomBadgeIcon } from '../components/ui/CustomBadges'
import { TournamentCountdownOverlay } from '../components/ui/TournamentCountdownOverlay'

type Tournament = {
  id: string
  title: string
  description: string
  imageUrl?: string
  minElo: number
  maxPlayers: number
  rewardBadgeCode?: string
  startDate?: string
  bracketGeneratedAt?: string
  status: 'UPCOMING' | 'REGISTRATION_CLOSED' | 'IN_PROGRESS' | 'COMPLETED'
  winner?: {
    id: string
    username: string
    avatarUrl?: string
    elo: number
  }
  acceptedCount: number
  userStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null
  createdAt: string
}

type Match = {
  id: string
  round: number
  matchNumber: number
  status: 'PENDING' | 'READY' | 'IN_PROGRESS' | 'COMPLETED'
  player1Id?: string
  player2Id?: string
  winnerId?: string
  player1?: {
    id: string
    username: string
    avatarUrl?: string
    elo: number
  }
  player2?: {
    id: string
    username: string
    avatarUrl?: string
    elo: number
  }
  winner?: {
    id: string
    username: string
  }
}

export default function Tournaments() {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<
    'ALL' | 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED'
  >('ALL')

  // Bracket modal state
  // Overlay state
  const [activeOverlayTournament, setActiveOverlayTournament] =
    useState<Tournament | null>(null)
  const [selectedForBrackets, setSelectedForBrackets] = useState<string | null>(
    null
  )
  const [bracketMatches, setBracketMatches] = useState<Match[]>([])
  const [bracketLoading, setBracketLoading] = useState(false)
  const [bracketTitle, setBracketTitle] = useState('')

  const fetchTournaments = async () => {
    try {
      const res = await api.get('/tournaments')
      const fetchedList: Tournament[] = res.data.tournaments || []
      setTournaments(fetchedList)

      // Auto-trigger overlay for any live tournament user is accepted into
      const live = fetchedList.find(
        (t) => t.status === 'IN_PROGRESS' && t.userStatus === 'ACCEPTED'
      )
      if (live) {
        setActiveOverlayTournament(live)
      }
    } catch (err) {
      console.error('Failed to load tournaments:', err)
      showTerminalToast('ERROR', 'Could not fetch tournament arena data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTournaments()
  }, [isAuthenticated])

  const handleApplyToJoin = async (id: string) => {
    if (!isAuthenticated) {
      showTerminalToast(
        'AUTH REQUIRED',
        'Please login to apply for tournaments.'
      )
      navigate('/login')
      return
    }
    try {
      const res = await api.post(`/tournaments/${id}/join`)
      showTerminalToast('APPLICATION SUBMITTED', res.data.message)
      fetchTournaments()
    } catch (err: any) {
      showTerminalToast(
        'APPLICATION FAILED',
        err.response?.data?.error || 'Failed to submit application.'
      )
    }
  }

  const handleViewBrackets = async (t: Tournament) => {
    setSelectedForBrackets(t.id)
    setBracketTitle(t.title)
    setBracketLoading(true)
    try {
      const res = await api.get(`/tournaments/${t.id}`)
      setBracketMatches(res.data.tournament.matches || [])
    } catch (err) {
      console.error('Failed to fetch brackets:', err)
      showTerminalToast('ERROR', 'Failed to load match brackets.')
    } finally {
      setBracketLoading(false)
    }
  }

  const filteredTournaments = tournaments.filter((t) => {
    if (filter === 'ALL') return true
    if (filter === 'UPCOMING')
      return t.status === 'UPCOMING' || t.status === 'REGISTRATION_CLOSED'
    return t.status === filter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UPCOMING':
      case 'REGISTRATION_CLOSED':
        return (
          <span className="px-2.5 py-0.5 text-xs font-bold rounded-sm bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1">
            <Clock3 size={12} /> REGISTRATION OPEN
          </span>
        )
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-0.5 text-xs font-bold rounded-sm bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse flex items-center gap-1">
            <Swords size={12} /> LIVE TOURNAMENT
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 text-xs font-bold rounded-sm bg-green-500/10 text-green-400 border border-green-500/30 flex items-center gap-1">
            <Trophy size={12} /> COMPLETED
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-0.5 text-xs font-bold rounded-sm bg-secondary text-muted-foreground">
            {status}
          </span>
        )
    }
  }

  // Group matches by round for modal
  const matchesByRound: { [round: number]: Match[] } = {}
  bracketMatches.forEach((m) => {
    if (!matchesByRound[m.round]) matchesByRound[m.round] = []
    matchesByRound[m.round].push(m)
  })
  const roundNumbers = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b)
  const maxRound = roundNumbers.length > 0 ? Math.max(...roundNumbers) : 1

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds && totalRounds >= 1)
      return '🏆 CHAMPIONSHIP FINALS'
    if (round === totalRounds - 1 && totalRounds >= 2) return '⚔️ SEMIFINALS'
    if (round === totalRounds - 2 && totalRounds >= 3) return '🛡️ QUARTERFINALS'
    return `ROUND ${round}`
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-['JetBrains_Mono'] p-6 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Hero Header */}
        <div className="border-b border-border pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-widest rounded-sm mb-3">
              <Crown size={14} /> Competitive Arena Tournaments
            </div>
            <h1 className="font-['Barlow_Condensed'] uppercase font-extrabold text-4xl lg:text-5xl tracking-tight text-foreground">
              Elimination <span className="text-accent">Championships</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-2xl mt-2">
              Apply to join elite bracket tournaments curated by arena admins.
              Complete algorithmic puzzles under high pressure to claim ELO
              rewards and unlock rare achievement badges!
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'UPCOMING', 'IN_PROGRESS', 'COMPLETED'] as const).map(
              (f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-4 py-2 font-['Barlow_Condensed'] uppercase font-bold text-sm tracking-widest transition-all rounded-sm border",
                    filter === f
                      ? 'bg-accent text-background border-accent shadow-[0_0_15px_rgba(0,255,170,0.2)]'
                      : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground'
                  )}
                >
                  {f.replace('_', ' ')}
                </button>
              )
            )}
          </div>
        </div>

        {/* Tournaments Grid */}
        {isLoading ? (
          <div className="p-20 text-center text-muted-foreground border border-border bg-card">
            Loading arena tournaments...
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="p-20 text-center border border-border bg-card space-y-3">
            <Trophy className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <h3 className="font-['Barlow_Condensed'] uppercase font-bold text-xl text-foreground">
              No Tournaments Found
            </h3>
            <p className="text-sm text-muted-foreground">
              There are no {filter !== 'ALL' ? filter.toLowerCase() : ''}{' '}
              tournaments right now. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((t) => {
              const eloOk = !user || user.elo >= t.minElo
              const isFull = t.acceptedCount >= t.maxPlayers

              return (
                <div
                  key={t.id}
                  className="border border-border bg-card flex flex-col justify-between overflow-hidden hover:border-muted-foreground/60 transition-all group relative"
                >
                  {/* Card Header / Banner Image */}
                  <div className="h-44 bg-secondary/40 relative overflow-hidden border-b border-border">
                    {t.imageUrl ? (
                      <img
                        src={t.imageUrl}
                        alt={t.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-card via-secondary/60 to-accent/10">
                        <Trophy className="w-16 h-16 text-accent/30 group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      {getStatusBadge(t.status)}
                    </div>
                    {t.winner && (
                      <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-md border border-amber-500/40 text-amber-400 px-2.5 py-1 rounded-sm text-xs font-bold flex items-center gap-1 shadow-lg">
                        <Crown size={14} /> @{t.winner.username}
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-['Barlow_Condensed'] uppercase font-extrabold text-2xl tracking-wider text-foreground group-hover:text-accent transition-colors">
                        {t.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-3 mt-2 leading-relaxed">
                        {t.description}
                      </p>
                    </div>

                    {/* Stats & Requirements */}
                    <div className="space-y-3 pt-4 border-t border-border/60 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Shield
                            size={14}
                            className={cn(
                              eloOk ? 'text-accent' : 'text-red-400'
                            )}
                          />{' '}
                          Min ELO Req:
                        </span>
                        <span
                          className={cn('font-bold', !eloOk && 'text-red-400')}
                        >
                          {t.minElo} {user && !eloOk && `(You: ${user.elo})`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Users size={14} className="text-accent" /> Capacity:
                        </span>
                        <span className="font-bold">
                          <strong className="text-foreground">
                            {t.acceptedCount}
                          </strong>{' '}
                          / {t.maxPlayers} Approved
                        </span>
                      </div>

                      {t.rewardBadgeCode && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Trophy size={14} className="text-amber-400" />{' '}
                            Winner Reward:
                          </span>
                          <div className="flex items-center gap-1.5 font-bold text-amber-400 truncate max-w-[170px]">
                            <CustomBadgeIcon
                              code={t.rewardBadgeCode}
                              size={18}
                            />
                            <span className="truncate">
                              {t.rewardBadgeCode.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      )}

                      {t.startDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Calendar size={14} className="text-accent" /> Start
                            Time:
                          </span>
                          <span className="text-foreground font-semibold">
                            {new Date(t.startDate).toLocaleDateString()}{' '}
                            {new Date(t.startDate).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action Bar */}
                  <div className="p-4 bg-secondary/30 border-t border-border flex items-center justify-between gap-3">
                    {t.status === 'UPCOMING' ? (
                      t.userStatus === 'PENDING' ? (
                        <div className="w-full py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-center text-xs font-bold tracking-wider uppercase rounded-sm flex items-center justify-center gap-1.5">
                          <Clock3 size={14} /> WAITING FOR APPROVAL ⏳
                        </div>
                      ) : t.userStatus === 'ACCEPTED' ? (
                        <div className="w-full py-2 bg-green-500/10 border border-green-500/30 text-green-400 text-center text-xs font-bold tracking-wider uppercase rounded-sm flex items-center justify-center gap-1.5">
                          <CheckCircle size={14} /> Approved & Registered
                        </div>
                      ) : t.userStatus === 'REJECTED' ? (
                        <div className="w-full py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-center text-xs font-bold tracking-wider uppercase rounded-sm flex items-center justify-center gap-1.5">
                          <XCircle size={14} /> Application Rejected
                        </div>
                      ) : !eloOk ? (
                        <button
                          disabled
                          className="w-full py-2.5 bg-secondary text-muted-foreground border border-border text-center text-xs font-bold uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-1.5"
                        >
                          <Lock size={14} /> Requires {t.minElo} ELO
                        </button>
                      ) : isFull ? (
                        <button
                          disabled
                          className="w-full py-2.5 bg-secondary text-muted-foreground border border-border text-center text-xs font-bold uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-1.5"
                        >
                          <AlertCircle size={14} /> Tournament Full
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApplyToJoin(t.id)}
                          className="w-full py-2.5 bg-accent text-background font-['Barlow_Condensed'] font-bold text-base tracking-widest uppercase hover:opacity-90 transition-opacity rounded-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,255,170,0.15)]"
                        >
                          <Swords size={18} /> Apply To Join
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handleViewBrackets(t)}
                        className="w-full py-2.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border font-['Barlow_Condensed'] font-bold text-base tracking-widest uppercase transition-colors rounded-sm flex items-center justify-center gap-2"
                      >
                        <Swords size={18} className="text-accent" /> View
                        Brackets
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bracket View Modal */}
      {selectedForBrackets && (
        <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center p-4 lg:p-8">
          <div className="bg-card border border-border max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl relative">
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <span className="text-xs text-accent uppercase font-bold tracking-widest flex items-center gap-1">
                  <Swords size={14} /> Live Elimination Brackets
                </span>
                <h2 className="font-['Barlow_Condensed'] uppercase text-2xl lg:text-3xl font-extrabold tracking-wider text-foreground mt-1">
                  {bracketTitle}
                </h2>
              </div>
              <button
                onClick={() => setSelectedForBrackets(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {bracketLoading ? (
                <div className="p-16 text-center text-muted-foreground">
                  Loading match brackets...
                </div>
              ) : bracketMatches.length === 0 ? (
                <div className="p-16 text-center text-muted-foreground">
                  Brackets have not been generated for this tournament yet.
                </div>
              ) : (
                <div className="space-y-10">
                  {roundNumbers.map((r) => {
                    const roundMatches = matchesByRound[r]
                    return (
                      <div key={r} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <h3 className="font-['Barlow_Condensed'] uppercase font-extrabold tracking-widest text-xl text-accent">
                            {getRoundName(r, maxRound)}
                          </h3>
                          <div className="h-[1px] flex-1 bg-border" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {roundMatches.map((m) => {
                            const isUserMatch =
                              user &&
                              (m.player1Id === user.id ||
                                m.player2Id === user.id)
                            const isUserP1 = user && m.player1Id === user.id
                            const isUserP2 = user && m.player2Id === user.id

                            return (
                              <div
                                key={m.id}
                                className={cn(
                                  'p-3.5 border rounded-sm bg-background flex flex-col justify-between gap-3 relative transition-all',
                                  isUserMatch
                                    ? 'border-accent shadow-[0_0_20px_rgba(0,255,204,0.3)] bg-accent/5'
                                    : m.status === 'COMPLETED'
                                      ? 'border-green-500/30 bg-green-500/5'
                                      : m.status === 'READY'
                                        ? 'border-accent/50 shadow-[0_0_10px_rgba(0,255,170,0.1)]'
                                        : 'border-border'
                                )}
                              >
                                {isUserMatch && (
                                  <div className="absolute -top-2.5 right-3 bg-accent text-background text-[10px] font-extrabold px-2 py-0.5 rounded-sm uppercase tracking-widest shadow-md flex items-center gap-1">
                                    <Swords size={10} /> YOUR MATCH
                                  </div>
                                )}

                                <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/50 pb-1.5">
                                  <span
                                    className={cn(
                                      isUserMatch && 'text-accent font-bold'
                                    )}
                                  >
                                    Match #{m.matchNumber}
                                  </span>
                                  <span
                                    className={cn(
                                      'font-bold uppercase text-[10px] px-1.5 py-0.2 rounded-sm',
                                      m.status === 'COMPLETED'
                                        ? 'bg-green-500/10 text-green-400'
                                        : m.status === 'READY'
                                          ? 'bg-accent/10 text-accent'
                                          : 'bg-secondary text-muted-foreground'
                                    )}
                                  >
                                    {m.status}
                                  </span>
                                </div>

                                {/* Players */}
                                <div className="space-y-2">
                                  {/* Player 1 */}
                                  <div
                                    className={cn(
                                      'flex items-center justify-between p-2 rounded-sm border text-sm',
                                      m.winnerId && m.winnerId === m.player1Id
                                        ? 'border-green-500/50 bg-green-500/10 font-bold text-green-400'
                                        : isUserP1
                                          ? 'border-accent/60 bg-accent/10 font-bold text-accent'
                                          : 'border-border/60 bg-secondary/30 text-foreground'
                                    )}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      {m.winnerId &&
                                        m.winnerId === m.player1Id && (
                                          <Crown
                                            size={14}
                                            className="text-amber-400 shrink-0"
                                          />
                                        )}
                                      {isUserP1 && (
                                        <span className="text-[10px] bg-accent text-background font-extrabold px-1 rounded-sm">
                                          YOU
                                        </span>
                                      )}
                                      <span className="truncate">
                                        {m.player1
                                          ? `@${m.player1.username}`
                                          : 'TBD (Waiting)'}
                                      </span>
                                    </div>
                                    {m.player1 && (
                                      <span className="text-xs text-muted-foreground">
                                        {m.player1.elo}
                                      </span>
                                    )}
                                  </div>

                                  {/* VS */}
                                  <div className="text-center text-[10px] font-bold text-muted-foreground tracking-widest">
                                    VS
                                  </div>

                                  {/* Player 2 */}
                                  <div
                                    className={cn(
                                      'flex items-center justify-between p-2 rounded-sm border text-sm',
                                      m.winnerId && m.winnerId === m.player2Id
                                        ? 'border-green-500/50 bg-green-500/10 font-bold text-green-400'
                                        : isUserP2
                                          ? 'border-accent/60 bg-accent/10 font-bold text-accent'
                                          : 'border-border/60 bg-secondary/30 text-foreground'
                                    )}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      {m.winnerId &&
                                        m.winnerId === m.player2Id && (
                                          <Crown
                                            size={14}
                                            className="text-amber-400 shrink-0"
                                          />
                                        )}
                                      {isUserP2 && (
                                        <span className="text-[10px] bg-accent text-background font-extrabold px-1 rounded-sm">
                                          YOU
                                        </span>
                                      )}
                                      <span className="truncate">
                                        {m.player2
                                          ? `@${m.player2.username}`
                                          : m.player1 &&
                                              !m.player2 &&
                                              m.status === 'COMPLETED'
                                            ? 'BYE (Auto Advance)'
                                            : 'TBD (Waiting)'}
                                      </span>
                                    </div>
                                    {m.player2 && (
                                      <span className="text-xs text-muted-foreground">
                                        {m.player2.elo}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 15-Minute Countdown Modal Overlay */}
      {activeOverlayTournament && (
        <TournamentCountdownOverlay
          tournament={activeOverlayTournament}
          onClose={() => setActiveOverlayTournament(null)}
          onEnterBrackets={() => {
            const target = activeOverlayTournament
            setActiveOverlayTournament(null)
            handleViewBrackets(target)
          }}
        />
      )}
    </div>
  )
}
