import { useNavigate } from 'react-router-dom'
import { Edit3 } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import Avatar from '../components/Avatar'
import { Button } from '../components/ui/button'

export default function Settings() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 flex justify-center">
        <p className="text-muted-foreground font-['JetBrains_Mono']">
          Please log in to view your settings.
        </p>
      </div>
    )
  }

  const globalRank = 1337 // Placeholder until backend rank is available

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="grid lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 flex items-start gap-6">
          <Avatar user={user} size="lg" className="shrink-0" />
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-['JetBrains_Mono'] font-bold text-2xl text-foreground">
                {user.username}
              </h1>
              <span className="font-['JetBrains_Mono'] text-xs text-accent border border-accent/30 bg-accent/10 px-2 py-0.5">
                {user.rankTier}
              </span>
              {user.location && (
                <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground border border-border px-2 py-0.5">
                  {user.location}
                </span>
              )}
            </div>
            <div className="flex items-center gap-6 mt-3">
              <div>
                <div className="font-['Barlow_Condensed'] font-extrabold text-3xl text-foreground">
                  {user.elo}
                </div>
                <div className="font-['Barlow'] text-xs text-muted-foreground">
                  ELO Rating
                </div>
              </div>
              <div>
                <div className="font-['Barlow_Condensed'] font-extrabold text-3xl text-foreground">
                  #{globalRank}
                </div>
                <div className="font-['Barlow'] text-xs text-muted-foreground">
                  Global Rank
                </div>
              </div>
              <div>
                <div className="font-['Barlow_Condensed'] font-extrabold text-3xl text-foreground">
                  TBD
                </div>
                <div className="font-['Barlow'] text-xs text-muted-foreground">
                  Win Rate
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-start justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/profile/edit')}
            className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-xs h-10 px-5"
          >
            <Edit3 size={13} className="mr-1.5" /> Edit Profile
          </Button>
        </div>
      </div>

      <div className="border border-border bg-card p-16 text-center mt-8">
        <span className="font-['Barlow_Condensed'] font-bold text-2xl uppercase tracking-widest text-muted-foreground animate-pulse">
          Coming Soon...
        </span>
        <p className="font-['JetBrains_Mono'] text-sm text-muted-foreground mt-2">
          Detailed statistics, match history, and problem tracking will be
          available soon.
        </p>
      </div>
    </div>
  )
}
