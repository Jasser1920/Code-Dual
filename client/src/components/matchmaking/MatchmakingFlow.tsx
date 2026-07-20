import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Check, Clock } from 'lucide-react'
import { useSocketStore } from '../../lib/socket'
import { useAuthStore } from '../../store/useAuthStore'

export type MatchState = 'IDLE' | 'SEARCHING' | 'FOUND' | 'LOBBY' | 'ROULETTE'

interface Problem {
  id: string
  title: string
  difficulty: string
  tags: string[]
}

interface MatchmakingFlowProps {
  matchState: MatchState
  setMatchState: (state: MatchState) => void
}

export default function MatchmakingFlow({
  matchState,
  setMatchState,
}: MatchmakingFlowProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { socket } = useSocketStore()
  const [roomId, setRoomId] = useState<string | null>(null)

  // FOUND state
  const [foundTimer, setFoundTimer] = useState(10)
  const [hasAccepted, setHasAccepted] = useState(false)

  // LOBBY state
  const [lobbyProblems, setLobbyProblems] = useState<Problem[]>([])
  const [lobbyTimer, setLobbyTimer] = useState(30)
  const [selectedProblems, setSelectedProblems] = useState<string[]>([])
  const [opponentSelections, setOpponentSelections] = useState(0)

  // ROULETTE state
  const [rouletteProblem, setRouletteProblem] = useState<string | null>(null)

  useEffect(() => {
    if (!socket) return

    const onMatchFound = (data: { roomId: string }) => {
      setRoomId(data.roomId)
      setMatchState('FOUND')
      setFoundTimer(10)
      setHasAccepted(false)
    }

    const onMatchAborted = () => {
      setRoomId(null)
      if (hasAccepted) {
        setMatchState('SEARCHING')
        setHasAccepted(false)
      } else {
        setMatchState('IDLE')
      }
    }

    const onLobbyStart = (data: { roomId: string; problems: Problem[] }) => {
      setMatchState('LOBBY')
      setLobbyProblems(data.problems)
      setLobbyTimer(30)
      setSelectedProblems([])
      setOpponentSelections(0)
    }

    const onLobbyTimer = (data: { remaining: number }) => {
      setLobbyTimer(data.remaining)
    }

    const onOpponentSelectionUpdate = (data: { count: number }) => {
      setOpponentSelections(data.count)
    }

    const onRouletteStart = (data: { finalProblemId: string }) => {
      setMatchState('ROULETTE')
      setRouletteProblem(data.finalProblemId)
    }

    const onDuelReady = (data: { problemId: string; roomId: string }) => {
      setMatchState('IDLE')
      navigate(`/duel/${data.roomId}`)
    }

    socket.on('match_found', onMatchFound)
    socket.on('match_aborted', onMatchAborted)
    socket.on('lobby_start', onLobbyStart)
    socket.on('lobby_timer', onLobbyTimer)
    socket.on('opponent_selection_update', onOpponentSelectionUpdate)
    socket.on('roulette_start', onRouletteStart)
    socket.on('duel_ready', onDuelReady)

    return () => {
      socket.off('match_found', onMatchFound)
      socket.off('match_aborted', onMatchAborted)
      socket.off('lobby_start', onLobbyStart)
      socket.off('lobby_timer', onLobbyTimer)
      socket.off('opponent_selection_update', onOpponentSelectionUpdate)
      socket.off('roulette_start', onRouletteStart)
      socket.off('duel_ready', onDuelReady)
    }
  }, [socket, matchState, hasAccepted, navigate, setMatchState])

  useEffect(() => {
    let interval: any
    if (matchState === 'FOUND') {
      interval = setInterval(() => {
        setFoundTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [matchState])

  const handleCancelSearch = () => {
    setMatchState('IDLE')
    socket?.emit('leave_queue')
  }

  const handleAccept = () => {
    setHasAccepted(true)
    socket?.emit('accept_match', { roomId, userId: user?.id })
  }

  const handleReject = () => {
    socket?.emit('reject_match', { roomId, userId: user?.id })
    setMatchState('IDLE')
  }

  const handleToggleProblem = (id: string) => {
    setSelectedProblems((prev) => {
      const isSelected = prev.includes(id)
      let next: string[]
      if (isSelected) {
        next = prev.filter((pId) => pId !== id)
      } else {
        if (prev.length >= 3) return prev
        next = [...prev, id]
      }
      socket?.emit('select_problem', {
        roomId,
        userId: user?.id,
        problemIds: next,
      })
      return next
    })
  }

  if (matchState === 'IDLE') return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
      {/* SEARCHING STATE */}
      {matchState === 'SEARCHING' && (
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full w-24 h-24 m-auto animate-pulse" />
            <Search
              size={48}
              className="text-accent relative z-10 m-auto animate-bounce"
            />
          </div>
          <h2 className="font-['Barlow_Condensed'] font-extrabold text-3xl uppercase tracking-widest text-foreground mb-2">
            Searching for Opponent...
          </h2>
          <p className="font-['Barlow'] text-sm text-muted-foreground mb-8">
            Waiting for another player to join the queue
          </p>
          <button
            onClick={handleCancelSearch}
            className="border border-border text-muted-foreground hover:text-foreground font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-sm px-8 py-3 transition-colors hover:border-destructive/50 hover:bg-destructive/10"
          >
            Cancel Search
          </button>
        </div>
      )}

      {/* FOUND STATE */}
      {matchState === 'FOUND' && (
        <div className="w-full max-w-md border border-accent/50 bg-card p-8 shadow-[0_0_50px_rgba(91,79,240,0.2)] rounded-sm text-center">
          <h2 className="font-['Barlow_Condensed'] font-extrabold text-4xl uppercase tracking-widest text-foreground mb-2 animate-pulse">
            Match Found!
          </h2>
          <p className="font-['Barlow'] text-muted-foreground mb-6">
            A worthy opponent has appeared.
          </p>

          <div className="w-16 h-16 rounded-full border-4 border-accent/30 flex items-center justify-center mx-auto mb-8 relative">
            <div
              className="absolute inset-0 border-4 border-accent rounded-full transition-all duration-1000 ease-linear"
              style={{
                clipPath: `polygon(50% 50%, 50% 0, ${100 - (foundTimer / 10) * 100}% 0, ${100 - (foundTimer / 10) * 100}% 100%, 50% 100%)`,
              }}
            />
            <span className="font-['JetBrains_Mono'] font-bold text-xl text-foreground">
              {foundTimer}
            </span>
          </div>

          {!hasAccepted ? (
            <div className="flex gap-4 w-full">
              <button
                onClick={handleReject}
                className="flex-1 border border-destructive/50 text-destructive font-['Barlow_Condensed'] font-bold uppercase tracking-widest py-4 hover:bg-destructive hover:text-destructive-foreground transition-all"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 bg-accent text-accent-foreground font-['Barlow_Condensed'] font-bold uppercase tracking-widest py-4 hover:bg-accent/90 transition-all shadow-[0_0_20px_rgba(91,79,240,0.4)]"
              >
                Accept
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 text-accent py-4 border border-accent/20 bg-accent/5">
              <Check size={20} />
              <span className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest">
                Waiting for opponent...
              </span>
            </div>
          )}
        </div>
      )}

      {/* LOBBY STATE */}
      {matchState === 'LOBBY' && (
        <div className="w-full max-w-4xl border border-border bg-card shadow-2xl flex flex-col h-[80vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
            <div>
              <h2 className="font-['Barlow_Condensed'] font-extrabold text-2xl uppercase tracking-widest text-foreground">
                Problem Selection
              </h2>
              <p className="font-['Barlow'] text-sm text-muted-foreground">
                Select up to 3 problems. The final problem will be drawn from
                your combined choices.
              </p>
            </div>
            <div className="flex items-center gap-3 text-accent font-['JetBrains_Mono'] text-xl">
              <Clock size={20} />
              <span>0:{lobbyTimer.toString().padStart(2, '0')}</span>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lobbyProblems.map((p) => {
                const isSelected = selectedProblems.includes(p.id)
                return (
                  <div
                    key={p.id}
                    onClick={() => handleToggleProblem(p.id)}
                    className={`border ${
                      isSelected
                        ? 'border-accent bg-accent/5'
                        : 'border-border bg-background hover:border-accent/50'
                    } p-4 cursor-pointer transition-all flex flex-col relative`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 text-accent">
                        <Check size={16} />
                      </div>
                    )}
                    <span
                      className={`font-['JetBrains_Mono'] text-xs mb-2 ${
                        p.difficulty === 'Hard'
                          ? 'text-destructive'
                          : p.difficulty === 'Medium'
                            ? 'text-yellow-500'
                            : 'text-green-500'
                      }`}
                    >
                      {p.difficulty}
                    </span>
                    <h3 className="font-['Barlow_Condensed'] font-bold text-lg text-foreground mb-2 line-clamp-1">
                      {p.title}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-auto">
                      {p.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-secondary/50 text-muted-foreground font-['JetBrains_Mono'] text-[10px] uppercase"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-border bg-secondary/30 flex justify-between items-center">
            <div className="flex items-center gap-6 font-['JetBrains_Mono'] text-sm">
              <div>
                <span className="text-muted-foreground mr-2">Your Picks:</span>
                <span
                  className={
                    selectedProblems.length === 3
                      ? 'text-accent font-bold'
                      : 'text-foreground'
                  }
                >
                  {selectedProblems.length}/3
                </span>
              </div>
              <div>
                <span className="text-muted-foreground mr-2">
                  Opponent Picks:
                </span>
                <span
                  className={
                    opponentSelections === 3
                      ? 'text-foreground font-bold'
                      : 'text-muted-foreground'
                  }
                >
                  {opponentSelections}/3
                </span>
              </div>
            </div>
            {selectedProblems.length === 3 && (
              <div className="text-accent font-['Barlow_Condensed'] uppercase tracking-widest text-sm font-bold animate-pulse">
                Ready!
              </div>
            )}
          </div>
        </div>
      )}

      {/* ROULETTE STATE */}
      {matchState === 'ROULETTE' && (
        <div className="w-full max-w-lg border border-accent/50 bg-card p-8 shadow-[0_0_50px_rgba(91,79,240,0.2)] rounded-sm text-center">
          <h2 className="font-['Barlow_Condensed'] font-extrabold text-4xl uppercase tracking-widest text-foreground mb-8">
            Drawing Problem...
          </h2>

          <div className="relative h-24 overflow-hidden border border-border bg-background mb-8 rounded-sm before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-16 before:bg-gradient-to-r before:from-background before:to-transparent before:z-10 after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-16 after:bg-gradient-to-l after:from-background after:to-transparent after:z-10">
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-accent z-20 shadow-[0_0_10px_rgba(91,79,240,1)]" />

            <div className="flex h-full items-center animate-[spinRoulette_4s_ease-out_forwards] w-max px-[50%]">
              {Array.from({ length: 40 }).map((_, i) => {
                const p = lobbyProblems[i % lobbyProblems.length]
                const isWinner = i === 35
                const title = isWinner
                  ? lobbyProblems.find((x) => x.id === rouletteProblem)?.title
                  : p?.title

                return (
                  <div key={i} className="w-48 px-4 flex-shrink-0 text-center">
                    <span
                      className={`font-['Barlow_Condensed'] font-bold text-xl uppercase whitespace-nowrap ${
                        isWinner ? 'text-accent' : 'text-muted-foreground'
                      }`}
                    >
                      {title}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <p className="font-['JetBrains_Mono'] text-accent text-sm animate-pulse">
            Duel starting momentarily...
          </p>

          <style>{`
            @keyframes spinRoulette {
              0% { transform: translateX(0); }
              100% { transform: translateX(calc(-35 * 12rem)); }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
