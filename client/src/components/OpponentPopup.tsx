import { useState, useEffect } from 'react'
import { X, Trophy, Swords, Zap, Activity } from 'lucide-react'
import axios from 'axios'
import { Button } from './ui/button'

interface OpponentPopupProps {
  username: string
  onClose: () => void
  onChallenge: () => void
}

export default function OpponentPopup({
  username,
  onClose,
  onChallenge,
}: OpponentPopupProps) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
        const res = await axios.get(`${apiUrl}/users/profile/${username}`)
        setProfile(res.data)
      } catch (err) {
        console.error('Failed to fetch profile', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [username])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-card border-2 border-border shadow-[8px_8px_0px_0px_hsl(var(--accent))] animate-in fade-in zoom-in-95 duration-200">
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase tracking-widest">
              Loading intel on {username}...
            </p>
          </div>
        ) : profile ? (
          <>
            {/* Header */}
            <div className="relative p-6 border-b border-border bg-secondary/20 flex flex-col items-center">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>

              <div className="w-16 h-16 bg-background border-2 border-accent flex items-center justify-center text-2xl font-['Barlow_Condensed'] font-bold uppercase mb-3">
                {profile.profile.name[0]}
              </div>
              <h3 className="font-['Barlow_Condensed'] font-extrabold text-2xl text-foreground uppercase tracking-widest">
                {profile.profile.name}
              </h3>
              <div className="font-['JetBrains_Mono'] text-xs text-accent mt-1">
                RANK #{profile.profile.rank}
              </div>
            </div>

            {/* Stats */}
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="bg-secondary/30 p-3 border border-border">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Trophy size={14} className="text-yellow-500" />
                  <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest">
                    ELO Rating
                  </span>
                </div>
                <div className="font-['JetBrains_Mono'] text-lg font-bold text-foreground">
                  {profile.profile.rating}
                </div>
              </div>

              <div className="bg-secondary/30 p-3 border border-border">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Activity size={14} className="text-emerald-500" />
                  <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest">
                    Win Rate
                  </span>
                </div>
                <div className="font-['JetBrains_Mono'] text-lg font-bold text-foreground">
                  {profile.profile.wins + profile.profile.losses > 0
                    ? Math.round(
                        (profile.profile.wins /
                          (profile.profile.wins + profile.profile.losses)) *
                          100
                      )
                    : 0}
                  %
                </div>
              </div>

              <div className="bg-secondary/30 p-3 border border-border">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Zap size={14} className="text-orange-500" />
                  <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest">
                    Win Streak
                  </span>
                </div>
                <div className="font-['JetBrains_Mono'] text-lg font-bold text-foreground">
                  {profile.profile.streak}
                </div>
              </div>

              <div className="bg-secondary/30 p-3 border border-border">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Swords size={14} className="text-accent" />
                  <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest">
                    Matches
                  </span>
                </div>
                <div className="font-['JetBrains_Mono'] text-lg font-bold text-foreground">
                  {profile.profile.wins + profile.profile.losses}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 pt-0 flex flex-col gap-3">
              <Button
                onClick={onChallenge}
                className="w-full font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-lg bg-accent text-accent-foreground hover:bg-accent/90 h-12"
              >
                Challenge to Duel <Swords size={18} className="ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-muted-foreground h-10"
              >
                Close
              </Button>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-muted-foreground font-['JetBrains_Mono'] text-sm">
            Failed to load profile.
            <Button variant="outline" className="mt-4" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
