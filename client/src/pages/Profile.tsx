import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  Zap,
  Trophy,
  Code2,
  TrendingUp,
  Calendar,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Button } from '../components/ui/button'
import axios from 'axios'

export default function Profile() {
  const { username } = useParams()
  const navigate = useNavigate()

  const [player, setPlayer] = useState<any>(null)
  const [ratingHistory, setRatingHistory] = useState<any[]>([])
  const [matchHistory, setMatchHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `http://localhost:4000/users/profile/${username}`
        )
        setPlayer(response.data.profile)
        setRatingHistory(response.data.ratingHistory)
        setMatchHistory(response.data.matchHistory)
      } catch (err) {
        console.error('Failed to fetch profile', err)
      } finally {
        setLoading(false)
      }
    }
    if (username) {
      fetchProfile()
    }
  }, [username])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={48} />
      </div>
    )
  }

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <h1 className="text-4xl font-['Barlow_Condensed'] font-bold">
          User Not Found
        </h1>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    )
  }

  const totalMatches = player.wins + player.losses
  const winRate =
    totalMatches === 0 ? 0 : Math.round((player.wins / totalMatches) * 100)

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="grid lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 flex items-start gap-6">
          <div className="w-16 h-16 bg-secondary border border-border flex items-center justify-center shrink-0">
            <span className="font-['Barlow_Condensed'] font-extrabold text-2xl text-muted-foreground">
              {player.name[0].toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-['JetBrains_Mono'] font-bold text-2xl text-foreground">
                {player.name}
              </h1>
              <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground border border-border px-2 py-0.5">
                {player.country}
              </span>
              {player.streak > 5 && (
                <div className="flex items-center gap-1 bg-accent/10 border border-accent/30 px-2 py-0.5">
                  <Zap size={11} className="text-accent" />
                  <span className="font-['JetBrains_Mono'] text-xs text-accent">
                    {player.streak} streak
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-6 mt-3">
              <div>
                <div className="font-['Barlow_Condensed'] font-extrabold text-3xl text-foreground">
                  {player.rating}
                </div>
                <div className="font-['Barlow'] text-xs text-muted-foreground">
                  ELO Rating
                </div>
              </div>
              <div>
                <div className="font-['Barlow_Condensed'] font-extrabold text-3xl text-foreground">
                  #{player.rank}
                </div>
                <div className="font-['Barlow'] text-xs text-muted-foreground">
                  Global Rank
                </div>
              </div>
              <div>
                <div className="font-['Barlow_Condensed'] font-extrabold text-3xl text-foreground">
                  {winRate}%
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
            onClick={() => navigate('/duels')}
            className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-xs h-10 px-5"
          >
            <Zap size={13} className="mr-1.5" /> Challenge
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="border border-border bg-card p-5">
            <h2 className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-foreground text-sm mb-4">
              Stats
            </h2>
            <div className="space-y-3">
              {[
                {
                  label: 'Wins',
                  value: player.wins,
                  icon: <Trophy size={13} />,
                },
                {
                  label: 'Losses',
                  value: player.losses,
                  icon: <Zap size={13} />,
                },
                {
                  label: 'Language',
                  value: player.lang,
                  icon: <Code2 size={13} />,
                },
                {
                  label: 'Win Streak',
                  value: player.streak,
                  icon: <TrendingUp size={13} />,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {s.icon}
                    <span className="font-['Barlow'] text-xs">{s.label}</span>
                  </div>
                  <span className="font-['JetBrains_Mono'] text-sm text-foreground">
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Solved problems (Hidden for now until Problem feature is complete) */}
          {/* 
          <div className="border border-border bg-card p-5">
            <h2 className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-foreground text-sm mb-4">Solved</h2>
            <div className="space-y-2">
            </div>
          </div>
          */}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rating chart */}
          <div className="border border-border bg-card p-5">
            <h2 className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-foreground text-sm mb-5">
              Rating History
            </h2>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingHistory}>
                  <XAxis
                    dataKey="date"
                    tick={{
                      fill: '#6b6b7e',
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono',
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fill: '#6b6b7e',
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono',
                    }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#131318',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 0,
                      fontFamily: 'JetBrains Mono',
                      fontSize: 11,
                    }}
                    itemStyle={{ color: '#5b4ff0' }}
                    labelStyle={{ color: '#6b6b7e' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke="#5b4ff0"
                    strokeWidth={2}
                    dot={{ fill: '#5b4ff0', r: 3 }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Match history */}
          <div className="border border-border bg-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-foreground text-sm">
                Match History
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="font-['Barlow'] text-xs h-8 text-muted-foreground"
              >
                All <ArrowRight size={13} className="ml-1" />
              </Button>
            </div>
            {matchHistory.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground font-['JetBrains_Mono'] text-sm">
                No matches played yet.
              </div>
            ) : (
              matchHistory.map((m: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-5 py-3 border-b border-border last:border-b-0 hover:bg-secondary/20 transition-colors"
                >
                  <div
                    className={`w-12 text-center font-['Barlow_Condensed'] font-bold text-sm uppercase ${m.result === 'win' ? 'text-emerald-400' : m.result === 'loss' ? 'text-red-400' : 'text-yellow-400'}`}
                  >
                    {m.result}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-['JetBrains_Mono'] text-sm text-foreground">
                        vs {m.opp}
                      </span>
                      <span
                        className={`font-['JetBrains_Mono'] text-xs ${m.result === 'win' ? 'text-emerald-400' : m.result === 'loss' ? 'text-red-400' : 'text-yellow-400'}`}
                      >
                        {m.rating}
                      </span>
                    </div>
                    <span className="font-['Barlow'] text-xs text-muted-foreground">
                      {m.prob}
                    </span>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="font-['JetBrains_Mono'] text-xs text-muted-foreground">
                      {m.time}
                    </div>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <Calendar
                        size={10}
                        className="text-muted-foreground/50"
                      />
                      <span className="font-['Barlow'] text-xs text-muted-foreground/50">
                        {m.date}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
