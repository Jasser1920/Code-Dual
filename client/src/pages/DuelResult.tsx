import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useSocketStore } from '../lib/socket'
import { Trophy, Swords, Home, RotateCcw, Zap } from 'lucide-react'
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
  const myId = user?.id || location.state?.myId || ''
  const myCode = location.state?.myCode || '// You did not write any code'
  const opponentCode =
    location.state?.opponentCode || '// Opponent did not write any code'
  const status = location.state?.result || 'DRAW' // "VICTORY", "DEFEAT", "DRAW"
  const language = location.state?.language || 'javascript'
  const eloUpdates = location.state?.eloUpdates || {}
  const rawAnalysis = location.state?.analysis || null

  let analysis = ''
  if (rawAnalysis && typeof rawAnalysis === 'object') {
    const myStats = rawAnalysis.p1.id === myId ? rawAnalysis.p1 : rawAnalysis.p2
    const oppStats =
      rawAnalysis.p1.id === myId ? rawAnalysis.p2 : rawAnalysis.p1

    if (status === 'VICTORY') {
      analysis += `You are the WINNER because `
      if (rawAnalysis.reason === 'score') {
        analysis += `your code correctness (${myStats.score}/100) was higher than your opponent's (${oppStats.score}/100)!\n`
      } else if (rawAnalysis.reason === 'time') {
        analysis += `both of you achieved a perfect score, but your execution time (${myStats.time}ms) was faster than your opponent's (${oppStats.time}ms)!\n`
      } else if (rawAnalysis.reason === 'forfeit') {
        analysis += `your opponent abandoned the match.\n`
      }
    } else if (status === 'DEFEAT') {
      analysis += `You are the LOSER because `
      if (rawAnalysis.reason === 'score') {
        analysis += `your opponent's code correctness (${oppStats.score}/100) was higher than yours (${myStats.score}/100)!\n`
      } else if (rawAnalysis.reason === 'time') {
        analysis += `both of you achieved a perfect score, but your opponent's execution time (${oppStats.time}ms) was faster than yours (${myStats.time}ms)!\n`
      } else if (rawAnalysis.reason === 'forfeit') {
        analysis += `you abandoned the match.\n`
      }
    } else {
      analysis += `The match ended in a DRAW because `
      if (rawAnalysis.reason === 'draw_time') {
        analysis += `both of you achieved a perfect score and had the EXACT same execution time (${myStats.time}ms)!\n`
      } else {
        analysis += `both of you failed to achieve a perfect score (Your score: ${myStats.score}/100).\n`
      }
    }

    analysis += `\nAnd here is why:\n`

    // Your code details
    if (myStats.error) {
      analysis += `- You had an error in your code:\n  ${myStats.error.split('\n').join('\n  ')}\n`
    } else if (myStats.score === 100) {
      analysis += `- Your code passed all tests perfectly!\n`
    } else {
      analysis += `- Your code did not pass all the tests.\n`
    }

    // Opponent details
    if (oppStats.error) {
      analysis += `- Your opponent had an error in their code:\n  ${oppStats.error.split('\n').join('\n  ')}\n`
    } else if (
      oppStats.score === 100 &&
      status === 'DEFEAT' &&
      rawAnalysis.reason === 'time'
    ) {
      analysis += `- Your opponent wrote a highly optimized solution that ran faster than yours.\n`
    } else if (oppStats.score === 100) {
      analysis += `- Your opponent's code passed all tests perfectly!\n`
    }
  } else if (typeof rawAnalysis === 'string') {
    analysis = rawAnalysis
  }

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

        {/* Center Status Badge */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-1 rounded-sm border border-border bg-card transition-opacity duration-1000 delay-500 ${showSplash ? 'opacity-0' : 'opacity-100'}`}
        >
          {status === 'VICTORY' && (
            <Trophy size={16} className="text-green-500" />
          )}
          {status === 'DEFEAT' && <Swords size={16} className="text-red-500" />}
          {status === 'DRAW' && (
            <Swords size={16} className="text-yellow-500" />
          )}
          <span
            className={`font-['Barlow_Condensed'] font-bold text-lg uppercase tracking-widest ${status === 'VICTORY' ? 'text-green-500' : status === 'DEFEAT' ? 'text-red-500' : 'text-yellow-500'}`}
          >
            {status === 'VICTORY'
              ? 'Winner'
              : status === 'DEFEAT'
                ? 'Loser'
                : 'Draw'}
          </span>
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
        {/* Neon AI Analysis Section */}
        {analysis && (
          <div
            className={`mb-6 transition-opacity duration-1000 delay-[800ms] ${showSplash ? 'opacity-0' : 'opacity-100'}`}
          >
            <div className="relative overflow-hidden rounded-sm border border-border bg-card p-6">
              <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
              <div className="flex items-start gap-5">
                <div className="p-4 rounded-sm shrink-0 flex items-center justify-center bg-secondary/50 border border-border">
                  <Zap className="text-accent" size={28} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-['Barlow_Condensed'] text-2xl font-bold uppercase tracking-widest text-foreground">
                      AI System Analysis
                    </h3>
                    <div className="px-3 py-1 rounded-sm border border-border bg-secondary font-['JetBrains_Mono'] text-xs font-bold text-muted-foreground">
                      JUDGE EVALUATION
                    </div>
                  </div>
                  <p className="font-['JetBrains_Mono'] text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {analysis}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
