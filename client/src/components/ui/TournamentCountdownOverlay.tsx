import { useState, useEffect } from 'react'
import { Swords, Zap, X, Trophy } from 'lucide-react'
import { CustomBadgeIcon } from './CustomBadges'

type TournamentProps = {
  id: string
  title: string
  rewardBadgeCode?: string
  bracketGeneratedAt?: string
  startDate?: string
}

export function TournamentCountdownOverlay({
  tournament,
  onClose,
  onEnterBrackets,
}: {
  tournament: TournamentProps
  onClose: () => void
  onEnterBrackets?: () => void
}) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900) // Default 15 mins (900s)

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!tournament.bracketGeneratedAt) {
        return 900
      }
      const startTime = new Date(tournament.bracketGeneratedAt).getTime()
      const now = new Date().getTime()
      const elapsedSeconds = Math.floor((now - startTime) / 1000)
      const remaining = Math.max(0, 900 - elapsedSeconds)
      return remaining
    }

    setSecondsRemaining(calculateTimeLeft())

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft()
      setSecondsRemaining(remaining)
    }, 1000)

    return () => clearInterval(interval)
  }, [tournament.bracketGeneratedAt])

  const minutes = Math.floor(secondsRemaining / 60)
  const secs = secondsRemaining % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300 font-['JetBrains_Mono']">
      <div className="bg-card border-2 border-accent max-w-xl w-full p-8 shadow-[0_0_50px_rgba(0,255,204,0.25)] relative text-center overflow-hidden">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-amber-400 to-accent" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1"
          title="Minimize Overlay"
        >
          <X size={20} />
        </button>

        {/* Badge / Trophy Icon */}
        <div className="mx-auto w-16 h-16 bg-accent/10 border border-accent/30 rounded-sm flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,255,204,0.3)]">
          {tournament.rewardBadgeCode ? (
            <CustomBadgeIcon code={tournament.rewardBadgeCode} size={40} />
          ) : (
            <Trophy className="w-10 h-10 text-accent" />
          )}
        </div>

        {/* Alert Header */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest rounded-sm mb-3">
          <Zap size={14} className="animate-pulse" /> TOURNAMENT MATCH LAUNCH
          WARNING
        </div>

        <h2 className="font-['Barlow_Condensed'] uppercase text-3xl font-extrabold tracking-wider text-foreground mb-2">
          {tournament.title}
        </h2>

        <p className="text-xs text-muted-foreground max-w-md mx-auto mb-6">
          The admin has generated elimination brackets! Matches are scheduled to
          begin automatically when the timer reaches 00:00.
        </p>

        {/* 15-Minute Countdown Display */}
        <div className="bg-background/80 border border-border p-6 rounded-sm mb-6 inline-block w-full max-w-sm border-accent/40 shadow-inner">
          <div className="text-xs text-accent font-bold uppercase tracking-widest mb-1">
            MATCH START COUNTDOWN
          </div>
          <div className="font-['Barlow_Condensed'] text-6xl font-black tracking-widest text-foreground font-mono text-accent drop-shadow-[0_0_15px_rgba(0,255,204,0.5)]">
            {formattedTime}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-2">
            Status:{' '}
            {secondsRemaining > 0
              ? 'Brackets Locked • Warming Up'
              : 'Matches Live!'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {onEnterBrackets && (
            <button
              onClick={onEnterBrackets}
              className="w-full sm:w-auto px-6 py-3 bg-accent text-background font-['Barlow_Condensed'] font-bold text-lg tracking-widest uppercase hover:opacity-90 transition-all rounded-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,204,0.3)]"
            >
              <Swords size={20} /> View Live Brackets
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 border border-border text-muted-foreground hover:text-foreground font-['Barlow_Condensed'] font-bold text-base tracking-widest uppercase transition-colors rounded-sm"
          >
            Minimize Overlay
          </button>
        </div>
      </div>
    </div>
  )
}
