import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import axios from 'axios'
import { CodeEditor } from './editor/CodeEditor'

interface MatchDetailsModalProps {
  duelId: string
  currentUserId: string
  onClose: () => void
  onOpponentClick: (username: string) => void
}

export default function MatchDetailsModal({
  duelId,
  currentUserId,
  onClose,
  onOpponentClick,
}: MatchDetailsModalProps) {
  const [duelData, setDuelData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'me' | 'opponent'>('me') // For mobile view

  useEffect(() => {
    const fetchDuel = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
        const res = await axios.get(`${apiUrl}/duels/${duelId}`)
        setDuelData(res.data)
      } catch (err) {
        console.error('Failed to fetch duel details', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDuel()
  }, [duelId])

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="font-['JetBrains_Mono'] animate-pulse text-accent">
          Loading Match Data...
        </div>
      </div>
    )
  }

  if (!duelData) {
    return null
  }

  const isPlayer1 = duelData.player1.id === currentUserId
  const me = isPlayer1 ? duelData.player1 : duelData.player2
  const opp = isPlayer1 ? duelData.player2 : duelData.player1

  const mySub = isPlayer1
    ? duelData.player1Submission
    : duelData.player2Submission
  const oppSub = isPlayer1
    ? duelData.player2Submission
    : duelData.player1Submission

  const myCode = mySub ? mySub.code : '// No submission recorded'
  const myLang = mySub ? mySub.language.toLowerCase() : 'javascript'
  const oppCode = oppSub ? oppSub.code : '// No submission recorded'
  const oppLang = oppSub ? oppSub.language.toLowerCase() : 'javascript'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 md:p-8">
      <div className="w-full max-w-6xl h-full max-h-[90vh] bg-card border-2 border-border shadow-[12px_12px_0px_0px_hsl(var(--accent))] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30 shrink-0">
          <div>
            <div className="font-['JetBrains_Mono'] text-xs text-accent uppercase tracking-widest mb-1">
              Match Details
            </div>
            <h2 className="font-['Barlow_Condensed'] font-extrabold text-2xl text-foreground uppercase tracking-widest">
              {duelData.problem.title}{' '}
              <span className="text-muted-foreground/50 text-lg ml-2">
                ({duelData.problem.difficulty})
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Players Info Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-secondary border border-border flex items-center justify-center text-xs font-['Barlow_Condensed'] font-bold uppercase">
              {me.username[0]}
            </div>
            <div>
              <div className="font-['JetBrains_Mono'] text-sm font-bold text-foreground">
                You ({me.username})
              </div>
              <div className="font-['JetBrains_Mono'] text-xs text-muted-foreground">
                {me.elo} ELO{' '}
                {duelData.winnerId === me.id && (
                  <span className="text-emerald-400 ml-1">WINNER</span>
                )}
              </div>
            </div>
          </div>

          <div className="font-['Barlow_Condensed'] font-bold text-xl text-muted-foreground/30 italic">
            VS
          </div>

          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-secondary/50 p-2 -mr-2 transition-colors rounded border border-transparent hover:border-border"
            onClick={() => onOpponentClick(opp.username)}
            title="Click to view opponent stats"
          >
            <div className="text-right">
              <div className="font-['JetBrains_Mono'] text-sm font-bold text-foreground">
                {opp.username}
              </div>
              <div className="font-['JetBrains_Mono'] text-xs text-muted-foreground">
                {duelData.winnerId === opp.id && (
                  <span className="text-emerald-400 mr-1">WINNER</span>
                )}{' '}
                {opp.elo} ELO
              </div>
            </div>
            <div className="w-8 h-8 bg-secondary border border-border flex items-center justify-center text-xs font-['Barlow_Condensed'] font-bold uppercase">
              {opp.username[0]}
            </div>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="flex md:hidden border-b border-border shrink-0">
          <button
            onClick={() => setActiveTab('me')}
            className={`flex-1 py-3 font-['JetBrains_Mono'] text-xs uppercase tracking-widest ${activeTab === 'me' ? 'border-b-2 border-accent text-accent' : 'text-muted-foreground'}`}
          >
            Your Code
          </button>
          <button
            onClick={() => setActiveTab('opponent')}
            className={`flex-1 py-3 font-['JetBrains_Mono'] text-xs uppercase tracking-widest ${activeTab === 'opponent' ? 'border-b-2 border-accent text-accent' : 'text-muted-foreground'}`}
          >
            Opponent's Code
          </button>
        </div>

        {/* Code View */}
        <div className="flex-1 flex overflow-hidden">
          {/* My Code (Left / Mobile Tab) */}
          <div
            className={`flex-1 flex-col border-r border-border ${activeTab === 'me' ? 'flex' : 'hidden md:flex'}`}
          >
            <div className="p-2 border-b border-border bg-secondary/20 flex justify-between items-center shrink-0">
              <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase tracking-widest pl-2">
                Your Submission
              </span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-accent px-2 py-0.5 border border-accent/20 bg-accent/10">
                {myLang}
              </span>
            </div>
            <div className="flex-1 min-h-0">
              <CodeEditor
                language={myLang}
                code={myCode}
                onChange={() => {}}
                readOnly={true}
              />
            </div>
          </div>

          {/* Opponent Code (Right / Mobile Tab) */}
          <div
            className={`flex-1 flex-col ${activeTab === 'opponent' ? 'flex' : 'hidden md:flex'}`}
          >
            <div className="p-2 border-b border-border bg-secondary/20 flex justify-between items-center shrink-0">
              <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase tracking-widest pl-2">
                {opp.username}'s Submission
              </span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-accent px-2 py-0.5 border border-accent/20 bg-accent/10">
                {oppLang}
              </span>
            </div>
            <div className="flex-1 min-h-0">
              <CodeEditor
                language={oppLang}
                code={oppCode}
                onChange={() => {}}
                readOnly={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
