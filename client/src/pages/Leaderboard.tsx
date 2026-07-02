import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Code2 } from 'lucide-react'
import axios from 'axios'

interface LeaderboardUser {
  rank: number
  id: string
  name: string
  country: string
  rating: number
  wins: number
  losses: number
  streak: number
  lang: string
}

export default function Leaderboard() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(
          'http://localhost:4000/users/leaderboard'
        )
        setUsers(response.data)
      } catch (err) {
        console.error('Failed to fetch leaderboard', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="font-['Barlow_Condensed'] font-black text-6xl uppercase tracking-widest text-foreground flex items-center justify-center gap-4">
          <Trophy className="text-accent" size={48} />
          Global Leaderboard
        </h1>
        <p className="font-['JetBrains_Mono'] text-muted-foreground mt-4">
          Top 100 players worldwide
        </p>
      </div>

      <div className="border border-border bg-card">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border bg-secondary/30">
          <div className="col-span-1 font-['Barlow_Condensed'] font-bold text-muted-foreground tracking-widest uppercase">
            Rank
          </div>
          <div className="col-span-4 font-['Barlow_Condensed'] font-bold text-muted-foreground tracking-widest uppercase">
            Player
          </div>
          <div className="col-span-2 font-['Barlow_Condensed'] font-bold text-muted-foreground tracking-widest uppercase text-center">
            Rating
          </div>
          <div className="col-span-2 font-['Barlow_Condensed'] font-bold text-muted-foreground tracking-widest uppercase text-center">
            Win Rate
          </div>
          <div className="col-span-3 font-['Barlow_Condensed'] font-bold text-muted-foreground tracking-widest uppercase text-right">
            Main Lang
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground font-['JetBrains_Mono'] animate-pulse">
            Loading top players...
          </div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((user) => {
              const totalMatches = user.wins + user.losses
              const winRate =
                totalMatches === 0
                  ? 0
                  : Math.round((user.wins / totalMatches) * 100)

              return (
                <div
                  key={user.id}
                  onClick={() => navigate(`/profile/${user.name}`)}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-secondary/40 transition-colors cursor-pointer group"
                >
                  <div className="col-span-1 font-['Barlow_Condensed'] font-extrabold text-2xl text-muted-foreground group-hover:text-foreground transition-colors">
                    #{user.rank}
                  </div>
                  <div className="col-span-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-secondary border border-border flex items-center justify-center shrink-0">
                      <span className="font-['Barlow_Condensed'] font-extrabold text-lg text-foreground">
                        {user.name[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-['JetBrains_Mono'] font-bold text-foreground text-sm flex items-center gap-2">
                        {user.name}
                        {user.rank <= 3 && (
                          <Trophy size={14} className="text-yellow-500" />
                        )}
                      </div>
                      <div className="font-['Barlow'] text-xs text-muted-foreground">
                        {user.country}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 font-['JetBrains_Mono'] font-bold text-accent text-center text-lg">
                    {user.rating}
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="font-['JetBrains_Mono'] text-foreground">
                      {winRate}%
                    </div>
                    <div className="font-['Barlow'] text-xs text-muted-foreground">
                      {user.wins}W / {user.losses}L
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    <Code2 size={14} className="text-muted-foreground" />
                    <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase">
                      {user.lang}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
