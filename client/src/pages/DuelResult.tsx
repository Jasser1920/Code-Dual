import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useSocketStore } from '../lib/socket'
import { Trophy, Swords, Home, RotateCcw } from 'lucide-react'
import Editor from '@monaco-editor/react'
import { useState, useEffect } from 'react'

export default function DuelResult() {
  const location = useLocation()
  const navigate = useNavigate()
  const { roomId } = useParams()
  const { user } = useAuthStore()
  const { socket } = useSocketStore()

  const [rematchSent, setRematchSent] = useState(false)
  const [opponentWantsRematch, setOpponentWantsRematch] = useState(false)

  // Extract data passed from DuelArena (or fallback to empty strings)
  const myCode = location.state?.myCode || '// You did not write any code'
  const opponentCode =
    location.state?.opponentCode || '// Opponent did not write any code'
  const status = location.state?.result || 'DRAW' // "VICTORY", "DEFEAT", "DRAW"
  const language = location.state?.language || 'javascript'
  const eloUpdates = location.state?.eloUpdates || {}

  const myEloUpdate = user?.id ? eloUpdates[user.id] : null
  const eloDeltaNum = myEloUpdate
    ? myEloUpdate.delta
    : status === 'VICTORY'
      ? 15
      : status === 'DEFEAT'
        ? -12
        : 0
  const eloDelta = eloDeltaNum > 0 ? `+${eloDeltaNum}` : `${eloDeltaNum}`
  const deltaColor =
    status === 'VICTORY'
      ? 'text-green-500'
      : status === 'DEFEAT'
        ? 'text-red-500'
        : 'text-yellow-500'
  // Fullscreen Splash Animation
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 3500) // Hide after 3.5 seconds
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!socket) return

    socket.on('rematch_requested', () => {
      setOpponentWantsRematch(true)
    })

    socket.on('rematch_accepted', ({ newRoomId }) => {
      navigate(`/duel/${newRoomId}`)
    })

    return () => {
      socket.off('rematch_requested')
      socket.off('rematch_accepted')
    }
  }, [socket, navigate])

  const handleRematch = () => {
    if (!rematchSent) {
      socket?.emit('request_rematch', { oldRoomId: roomId, userId: user?.id })
      setRematchSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* FULLSCREEN SPLASH ANIMATION */}
      <div
        className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-1000 ${
          showSplash
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="animate-bounce">
          {status === 'VICTORY' && (
            <Trophy
              size={100}
              className="text-green-500 mb-6 drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]"
            />
          )}
          {status === 'DEFEAT' && (
            <Swords
              size={100}
              className="text-red-500 mb-6 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]"
            />
          )}
          {status === 'DRAW' && (
            <Swords
              size={100}
              className="text-yellow-500 mb-6 drop-shadow-[0_0_20px_rgba(234,179,8,0.8)]"
            />
          )}
        </div>

        <h1
          className={`font-['Barlow_Condensed'] text-9xl font-black uppercase tracking-widest animate-pulse ${deltaColor} drop-shadow-[0_0_30px_currentColor]`}
        >
          {status}
        </h1>

        <div className="mt-8 flex items-center gap-4 animate-fade-in-up">
          <span className="font-['JetBrains_Mono'] text-2xl text-muted-foreground">
            ELO UPDATE
          </span>
          <span
            className={`font-['JetBrains_Mono'] text-4xl font-bold ${deltaColor}`}
          >
            {eloDelta}
          </span>
        </div>
      </div>
      {/* Top Navbar */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase tracking-widest">
              Match Result
            </span>
            <span className="font-['JetBrains_Mono'] text-sm text-foreground">
              {roomId}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 border border-border px-4 py-1.5 hover:bg-secondary/50 text-foreground font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-sm transition-colors"
          >
            <Home size={16} />
            Lobby
          </button>
          <button
            onClick={handleRematch}
            disabled={rematchSent && !opponentWantsRematch}
            className={`flex items-center gap-2 px-4 py-1.5 font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-sm transition-colors ${
              opponentWantsRematch
                ? 'bg-green-600 hover:bg-green-700 text-white animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]'
                : rematchSent
                  ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                  : 'bg-accent hover:bg-accent/90 text-accent-foreground'
            }`}
          >
            <RotateCcw
              size={16}
              className={
                rematchSent && !opponentWantsRematch ? 'animate-spin-slow' : ''
              }
            />
            {opponentWantsRematch
              ? 'ACCEPT REMATCH!'
              : rematchSent
                ? 'WAITING...'
                : 'REMATCH'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-8 overflow-hidden">
        {/* Side-by-Side Code Comparison */}
        <div
          className={`flex-1 flex gap-4 min-h-0 transition-opacity duration-1000 delay-500 ${showSplash ? 'opacity-0' : 'opacity-100'}`}
        >
          {/* My Code */}
          <div className="flex-1 flex flex-col border border-border bg-card">
            <div className="h-10 border-b border-border bg-secondary/30 flex items-center justify-between px-4">
              <span className="font-['JetBrains_Mono'] text-sm font-bold text-foreground">
                Your Solution
              </span>
              <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground">
                {language}
              </span>
            </div>
            <div className="flex-1 relative">
              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={myCode}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                }}
              />
            </div>
          </div>

          {/* Opponent Code */}
          <div className="flex-1 flex flex-col border border-border bg-card">
            <div className="h-10 border-b border-border bg-secondary/30 flex items-center justify-between px-4">
              <span className="font-['JetBrains_Mono'] text-sm font-bold text-foreground">
                Opponent's Solution
              </span>
              <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground">
                {language}
              </span>
            </div>
            <div className="flex-1 relative">
              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={opponentCode}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
