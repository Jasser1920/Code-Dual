import { useState, useEffect } from 'react'
import { api } from '../../api/axios'
import {
  Plus,
  Trash2,
  Trophy,
  Users,
  CheckCircle,
  XCircle,
  Play,
  Crown,
  Shield,
  Clock,
  X,
  Swords,
  Upload,
} from 'lucide-react'
import { cn } from '../../components/ui/utils'
import { showTerminalToast } from '../../components/ui/terminal-toast'
import { CustomBadgeIcon } from '../../components/ui/CustomBadges'

type Tournament = {
  id: string
  title: string
  description: string
  imageUrl?: string
  minElo: number
  maxPlayers: number
  rewardBadgeCode?: string
  startDate?: string
  status: 'UPCOMING' | 'REGISTRATION_CLOSED' | 'IN_PROGRESS' | 'COMPLETED'
  winner?: {
    id: string
    username: string
    avatarUrl?: string
    elo: number
  }
  acceptedCount: number
  createdAt: string
}

type Participant = {
  id: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  seed?: number
  isEliminated: boolean
  appliedAt: string
  user: {
    id: string
    username: string
    avatarUrl?: string
    elo: number
    rankTier: string
  }
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

export default function TournamentsManager() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedTournamentId, setSelectedTournamentId] = useState<
    string | null
  >(null)
  const [activeTab, setActiveTab] = useState<'participants' | 'brackets'>(
    'participants'
  )
  const [detailLoading, setDetailLoading] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    minElo: 1000,
    maxPlayers: 8,
    rewardBadgeCode: 'TOURNAMENT_CHAMPION',
    startDate: '',
  })

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showTerminalToast(
        'INVALID FILE',
        'Please select an image file (PNG, JPG, WEBP).'
      )
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      showTerminalToast(
        'FILE TOO LARGE',
        'Banner image must be smaller than 5MB.'
      )
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const fetchTournaments = async () => {
    try {
      const res = await api.get('/tournaments')
      setTournaments(res.data.tournaments || [])
    } catch (err) {
      console.error('Failed to fetch tournaments:', err)
      showTerminalToast('ERROR', 'Failed to load tournaments list from server.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTournamentDetails = async (id: string) => {
    setDetailLoading(true)
    try {
      const res = await api.get(`/tournaments/${id}`)
      setSelectedTournament(res.data.tournament)
      setParticipants(res.data.tournament.participants || [])
      setMatches(res.data.tournament.matches || [])
    } catch (err) {
      console.error('Failed to load details:', err)
      showTerminalToast('ERROR', 'Failed to load tournament details.')
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    fetchTournaments()
  }, [])

  useEffect(() => {
    if (selectedTournamentId) {
      fetchTournamentDetails(selectedTournamentId)
    } else {
      setSelectedTournament(null)
      setParticipants([])
      setMatches([])
    }
  }, [selectedTournamentId])

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/tournaments', formData)
      showTerminalToast(
        'TOURNAMENT CREATED',
        `"${formData.title}" is now open for registration!`
      )
      setIsCreateOpen(false)
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        minElo: 1000,
        maxPlayers: 8,
        rewardBadgeCode: 'TOURNAMENT_CHAMPION',
        startDate: '',
      })
      fetchTournaments()
    } catch (err: any) {
      showTerminalToast(
        'CREATE FAILED',
        err.response?.data?.error || 'Failed to create tournament.'
      )
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (
      !window.confirm(`Are you sure you want to delete tournament "${title}"?`)
    )
      return
    try {
      await api.delete(`/tournaments/${id}`)
      showTerminalToast('TOURNAMENT DELETED', `Deleted "${title}".`)
      if (selectedTournamentId === id) setSelectedTournamentId(null)
      fetchTournaments()
    } catch (err: any) {
      showTerminalToast(
        'DELETE FAILED',
        err.response?.data?.error || 'Failed to delete tournament.'
      )
    }
  }

  const handleReviewParticipant = async (
    participantId: string,
    status: 'ACCEPTED' | 'REJECTED'
  ) => {
    if (!selectedTournamentId) return
    try {
      const res = await api.post(
        `/tournaments/${selectedTournamentId}/participants/${participantId}/review`,
        {
          status,
        }
      )
      showTerminalToast(
        status === 'ACCEPTED' ? 'PLAYER APPROVED' : 'PLAYER REJECTED',
        res.data.message
      )
      fetchTournamentDetails(selectedTournamentId)
      fetchTournaments()
    } catch (err: any) {
      showTerminalToast(
        'REVIEW FAILED',
        err.response?.data?.error || 'Failed to review participant.'
      )
    }
  }

  const handleStartTournament = async () => {
    if (!selectedTournamentId) return
    if (
      !window.confirm(
        'Start tournament and generate elimination brackets now? Registration will close.'
      )
    )
      return
    try {
      const res = await api.post(`/tournaments/${selectedTournamentId}/start`)
      showTerminalToast('TOURNAMENT STARTED', res.data.message)
      fetchTournamentDetails(selectedTournamentId)
      fetchTournaments()
      setActiveTab('brackets')
    } catch (err: any) {
      showTerminalToast(
        'START FAILED',
        err.response?.data?.error || 'Failed to start tournament.'
      )
    }
  }

  const handleReportWinner = async (
    matchId: string,
    winnerId: string,
    username: string
  ) => {
    if (!selectedTournamentId) return
    if (!window.confirm(`Declare @${username} as the winner of this match?`))
      return
    try {
      const res = await api.post(
        `/tournaments/${selectedTournamentId}/matches/${matchId}/report`,
        {
          winnerId,
        }
      )
      showTerminalToast('MATCH REPORTED', res.data.message)
      fetchTournamentDetails(selectedTournamentId)
      fetchTournaments()
    } catch (err: any) {
      showTerminalToast(
        'REPORT FAILED',
        err.response?.data?.error || 'Failed to report winner.'
      )
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UPCOMING':
      case 'REGISTRATION_OPEN':
        return (
          <span className="px-2 py-0.5 text-xs font-bold rounded-sm bg-blue-500/10 text-blue-400 border border-blue-500/30">
            UPCOMING
          </span>
        )
      case 'IN_PROGRESS':
        return (
          <span className="px-2 py-0.5 text-xs font-bold rounded-sm bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
            IN PROGRESS
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 text-xs font-bold rounded-sm bg-green-500/10 text-green-400 border border-green-500/30">
            COMPLETED
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-bold rounded-sm bg-secondary text-muted-foreground">
            {status}
          </span>
        )
    }
  }

  // Group matches by round for bracket view
  const matchesByRound: { [round: number]: Match[] } = {}
  matches.forEach((m) => {
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
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-['JetBrains_Mono']">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-['Barlow_Condensed'] uppercase font-extrabold text-3xl tracking-wider flex items-center gap-3 text-foreground">
            <Trophy className="text-accent w-8 h-8" /> Arena Tournaments Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create competitive elimination tournaments, review player
            applications, and manage match brackets.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-accent text-background px-4 py-2.5 rounded-sm font-['Barlow_Condensed'] font-bold text-lg tracking-widest uppercase hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Plus size={20} /> Create Tournament
        </button>
      </div>

      {/* Main Grid: Left = Tournaments List, Right = Selected Tournament Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left List */}
        <div
          className={cn(
            'space-y-4',
            selectedTournamentId ? 'lg:col-span-5' : 'lg:col-span-12'
          )}
        >
          <h2 className="font-['Barlow_Condensed'] text-xl font-bold uppercase tracking-wider text-muted-foreground">
            All Tournaments ({tournaments.length})
          </h2>

          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground border border-border bg-card">
              Loading tournaments...
            </div>
          ) : tournaments.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground border border-border bg-card">
              No tournaments created yet. Click "+ Create Tournament" above.
            </div>
          ) : (
            <div className="space-y-3">
              {tournaments.map((t) => {
                const isSelected = selectedTournamentId === t.id
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTournamentId(t.id)}
                    className={cn(
                      'p-4 border bg-card transition-all cursor-pointer relative overflow-hidden',
                      isSelected
                        ? 'border-accent shadow-[0_0_15px_rgba(0,255,170,0.15)] bg-accent/5'
                        : 'border-border hover:border-muted-foreground/50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(t.status)}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Shield size={12} className="text-accent" />{' '}
                            {t.minElo}+ ELO
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-foreground line-clamp-1">
                          {t.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {t.description}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(t.id, t.title)
                        }}
                        className="text-muted-foreground hover:text-red-400 p-1 transition-colors"
                        title="Delete Tournament"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Users size={14} className="text-accent" />
                        <span>
                          Accepted:{' '}
                          <strong className="text-foreground">
                            {t.acceptedCount}
                          </strong>{' '}
                          / {t.maxPlayers}
                        </span>
                      </div>
                      {t.winner ? (
                        <div className="flex items-center gap-1 text-amber-400 font-bold">
                          <Crown size={14} /> @{t.winner.username}
                        </div>
                      ) : t.startDate ? (
                        <div className="flex items-center gap-1">
                          <Clock size={12} />{' '}
                          {new Date(t.startDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span>TBD Start</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Details Panel */}
        {selectedTournamentId && (
          <div className="lg:col-span-7 border border-border bg-card p-6 flex flex-col h-[750px]">
            {detailLoading || !selectedTournament ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Loading tournament details...
              </div>
            ) : (
              <>
                {/* Panel Header */}
                <div className="flex items-start justify-between border-b border-border pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(selectedTournament.status)}
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded-sm border border-border">
                        Max Capacity: {selectedTournament.maxPlayers}
                      </span>
                    </div>
                    <h2 className="font-['Barlow_Condensed'] uppercase text-2xl font-bold tracking-wider text-foreground">
                      {selectedTournament.title}
                    </h2>
                    {selectedTournament.winner && (
                      <div className="mt-2 inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-sm text-sm font-bold">
                        <Crown size={16} /> CHAMPION: @
                        {selectedTournament.winner.username} (
                        {selectedTournament.winner.elo} ELO)
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedTournamentId(null)}
                    className="text-muted-foreground hover:text-foreground p-1"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-border mb-4">
                  <button
                    onClick={() => setActiveTab('participants')}
                    className={cn(
                      "px-4 py-2 font-['Barlow_Condensed'] uppercase font-bold tracking-widest text-base border-b-2 transition-all flex items-center gap-2",
                      activeTab === 'participants'
                        ? 'border-accent text-accent'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Users size={18} /> Participants ({participants.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('brackets')}
                    className={cn(
                      "px-4 py-2 font-['Barlow_Condensed'] uppercase font-bold tracking-widest text-base border-b-2 transition-all flex items-center gap-2",
                      activeTab === 'brackets'
                        ? 'border-accent text-accent'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Swords size={18} /> Brackets & Matches ({matches.length})
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto pr-2">
                  {activeTab === 'participants' ? (
                    <div className="space-y-4">
                      {/* Capacity bar */}
                      <div className="bg-secondary/40 p-3 rounded-sm border border-border flex items-center justify-between text-sm">
                        <span>
                          Approved Players:{' '}
                          <strong className="text-accent">
                            {
                              participants.filter(
                                (p) => p.status === 'ACCEPTED'
                              ).length
                            }
                          </strong>{' '}
                          / {selectedTournament.maxPlayers}
                        </span>
                        {selectedTournament.status === 'UPCOMING' &&
                          participants.filter((p) => p.status === 'ACCEPTED')
                            .length >= 2 && (
                            <button
                              onClick={handleStartTournament}
                              className="bg-accent text-background px-3 py-1 text-xs font-bold font-['Barlow_Condensed'] tracking-widest uppercase hover:opacity-90 flex items-center gap-1"
                            >
                              <Play size={14} /> Generate Brackets & Start Now
                            </button>
                          )}
                      </div>

                      {participants.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground border border-border bg-secondary/10">
                          No players have applied for this tournament yet.
                        </div>
                      ) : (
                        <div className="divide-y divide-border border border-border bg-background">
                          {participants.map((p) => (
                            <div
                              key={p.id}
                              className="p-3 flex items-center justify-between gap-4 hover:bg-secondary/20"
                            >
                              <div className="flex items-center gap-3">
                                {p.user.avatarUrl ? (
                                  <img
                                    src={p.user.avatarUrl}
                                    alt=""
                                    className="w-9 h-9 rounded-sm object-cover border border-border"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center font-bold text-accent">
                                    {p.user.username.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-sm text-foreground flex items-center gap-2">
                                    @{p.user.username}
                                    <span className="text-xs px-1.5 py-0.2 bg-secondary text-muted-foreground border border-border rounded-sm">
                                      {p.user.elo} ELO ({p.user.rankTier})
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Applied:{' '}
                                    {new Date(p.appliedAt).toLocaleDateString()}
                                    {p.seed && (
                                      <span className="ml-2 text-accent">
                                        Seed #{p.seed}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {p.status === 'PENDING' ? (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleReviewParticipant(
                                          p.id,
                                          'ACCEPTED'
                                        )
                                      }
                                      className="bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 px-2.5 py-1 rounded-sm text-xs font-bold flex items-center gap-1"
                                      title="Approve Player"
                                    >
                                      <CheckCircle size={14} /> Approve
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleReviewParticipant(
                                          p.id,
                                          'REJECTED'
                                        )
                                      }
                                      className="bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 px-2.5 py-1 rounded-sm text-xs font-bold flex items-center gap-1"
                                      title="Reject Player"
                                    >
                                      <XCircle size={14} /> Reject
                                    </button>
                                  </>
                                ) : p.status === 'ACCEPTED' ? (
                                  <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-sm border border-green-500/30 flex items-center gap-1">
                                    <CheckCircle size={14} /> Approved
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-sm border border-red-500/30">
                                      Rejected
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleReviewParticipant(
                                          p.id,
                                          'ACCEPTED'
                                        )
                                      }
                                      className="text-xs text-muted-foreground underline hover:text-green-400"
                                    >
                                      Re-approve
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* BRACKETS & MATCHES TAB */
                    <div className="space-y-6">
                      {selectedTournament.status === 'UPCOMING' ? (
                        <div className="p-8 text-center border border-border bg-secondary/10 space-y-4">
                          <Trophy className="w-12 h-12 text-accent mx-auto" />
                          <h3 className="font-['Barlow_Condensed'] uppercase text-xl font-bold text-foreground">
                            Brackets Not Generated Yet
                          </h3>
                          <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Once you approve at least 2 players, click below to
                            lock registration, seed players by ELO, and generate
                            elimination match brackets.
                          </p>
                          <button
                            onClick={handleStartTournament}
                            disabled={
                              participants.filter(
                                (p) => p.status === 'ACCEPTED'
                              ).length < 2
                            }
                            className="bg-accent text-background px-6 py-2.5 rounded-sm font-['Barlow_Condensed'] font-bold text-lg tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-2"
                          >
                            <Play size={20} /> Generate Brackets & Start
                            Tournament
                          </button>
                        </div>
                      ) : matches.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          No matches found.
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {roundNumbers.map((r) => {
                            const roundMatches = matchesByRound[r]
                            return (
                              <div key={r} className="space-y-3">
                                <h3 className="font-['Barlow_Condensed'] uppercase font-extrabold tracking-widest text-lg text-accent border-b border-border pb-1">
                                  {getRoundName(r, maxRound)}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {roundMatches.map((m) => (
                                    <div
                                      key={m.id}
                                      className={cn(
                                        'p-3 border rounded-sm bg-background flex flex-col justify-between gap-3',
                                        m.status === 'COMPLETED'
                                          ? 'border-green-500/30 bg-green-500/5'
                                          : m.status === 'READY'
                                            ? 'border-accent/40 bg-accent/5'
                                            : 'border-border'
                                      )}
                                    >
                                      <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/50 pb-1.5">
                                        <span>Match #{m.matchNumber}</span>
                                        <span className="font-bold uppercase">
                                          {m.status}
                                        </span>
                                      </div>

                                      {/* Player 1 vs Player 2 */}
                                      <div className="space-y-2">
                                        {/* Player 1 */}
                                        <div
                                          className={cn(
                                            'flex items-center justify-between p-1.5 rounded-sm border',
                                            m.winnerId &&
                                              m.winnerId === m.player1Id
                                              ? 'border-green-500/50 bg-green-500/10 font-bold text-green-400'
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
                                            <span className="truncate text-sm">
                                              {m.player1
                                                ? `@${m.player1.username} (${m.player1.elo})`
                                                : 'TBD (Waiting)'}
                                            </span>
                                          </div>
                                          {m.status !== 'COMPLETED' &&
                                            m.player1Id && (
                                              <button
                                                onClick={() =>
                                                  handleReportWinner(
                                                    m.id,
                                                    m.player1Id!,
                                                    m.player1!.username
                                                  )
                                                }
                                                className="text-xs bg-accent/10 text-accent border border-accent/30 px-2 py-0.5 hover:bg-accent/20 rounded-sm shrink-0 font-bold"
                                              >
                                                Win 👑
                                              </button>
                                            )}
                                        </div>

                                        {/* VS badge */}
                                        <div className="text-center text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                                          VS
                                        </div>

                                        {/* Player 2 */}
                                        <div
                                          className={cn(
                                            'flex items-center justify-between p-1.5 rounded-sm border',
                                            m.winnerId &&
                                              m.winnerId === m.player2Id
                                              ? 'border-green-500/50 bg-green-500/10 font-bold text-green-400'
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
                                            <span className="truncate text-sm">
                                              {m.player2
                                                ? `@${m.player2.username} (${m.player2.elo})`
                                                : m.player1 &&
                                                    !m.player2 &&
                                                    m.status === 'COMPLETED'
                                                  ? 'BYE (Auto Advance)'
                                                  : 'TBD (Waiting)'}
                                            </span>
                                          </div>
                                          {m.status !== 'COMPLETED' &&
                                            m.player2Id && (
                                              <button
                                                onClick={() =>
                                                  handleReportWinner(
                                                    m.id,
                                                    m.player2Id!,
                                                    m.player2!.username
                                                  )
                                                }
                                                className="text-xs bg-accent/10 text-accent border border-accent/30 px-2 py-0.5 hover:bg-accent/20 rounded-sm shrink-0 font-bold"
                                              >
                                                Win 👑
                                              </button>
                                            )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Tournament Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>
            <h2 className="font-['Barlow_Condensed'] uppercase text-2xl font-bold tracking-wider mb-4 text-foreground flex items-center gap-2">
              <Trophy className="text-accent" /> Create Arena Tournament
            </h2>
            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">
                  Tournament Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Algorithm Championship"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full bg-background border border-border p-2 text-sm text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Rules, schedule, and format details..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-background border border-border p-2 text-sm text-foreground focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">
                    Min ELO Requirement
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formData.minElo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minElo: Number(e.target.value),
                      })
                    }
                    className="w-full bg-background border border-border p-2 text-sm text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">
                    Max Player Capacity
                  </label>
                  <select
                    value={formData.maxPlayers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxPlayers: Number(e.target.value),
                      })
                    }
                    className="w-full bg-background border border-border p-2 text-sm text-foreground focus:outline-none focus:border-accent"
                  >
                    <option value={4}>4 Players</option>
                    <option value={8}>8 Players</option>
                    <option value={16}>16 Players</option>
                    <option value={32}>32 Players</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1 flex items-center justify-between">
                    <span>Winner Reward Badge</span>
                    <CustomBadgeIcon
                      code={formData.rewardBadgeCode}
                      size={18}
                    />
                  </label>
                  <select
                    value={formData.rewardBadgeCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rewardBadgeCode: e.target.value,
                      })
                    }
                    className="w-full bg-background border border-border p-2 text-sm text-foreground focus:outline-none focus:border-accent"
                  >
                    <option value="TOURNAMENT_CHAMPION">
                      🏆 Tournament Champion
                    </option>
                    <option value="SPEED_DEMON">🚀 Speed Demon</option>
                    <option value="WIN_STREAK_5">
                      ⚡ Unstoppable 5 Streak
                    </option>
                    <option value="ELO_1500">🥇 Gold Gladiator</option>
                    <option value="DUEL_VETERAN">🛡️ Arena Veteran</option>
                    <option value="FIRST_WIN">⭐ First Victory</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full bg-background border border-border p-2 text-sm text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">
                  Upload Banner Image from Device
                </label>
                {formData.imageUrl ? (
                  <div className="relative border border-border bg-background p-2 rounded-sm flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 truncate">
                      <img
                        src={formData.imageUrl}
                        alt="Banner Preview"
                        className="w-16 h-10 object-cover rounded-sm border border-border"
                      />
                      <span className="text-xs text-accent font-bold truncate">
                        Banner Image Loaded ✅
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, imageUrl: '' }))
                      }
                      className="text-xs text-red-400 hover:text-red-300 font-bold underline px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-border hover:border-accent/60 bg-background p-4 rounded-sm flex flex-col items-center justify-center cursor-pointer transition-colors text-center group">
                    <Upload className="w-6 h-6 text-muted-foreground group-hover:text-accent mb-1 transition-colors" />
                    <span className="text-xs text-foreground font-bold">
                      Click to choose image file from device
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      PNG, JPG, WEBP (Max 5MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-border text-muted-foreground hover:text-foreground text-sm uppercase font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-accent text-background text-sm font-['Barlow_Condensed'] uppercase font-bold tracking-widest hover:opacity-90"
                >
                  Create Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
