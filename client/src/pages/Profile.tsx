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
  Edit3,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts'
import { Button } from '../components/ui/button'
import axios from 'axios'
import { useAuthStore } from '../store/useAuthStore'
import MatchDetailsModal from '../components/MatchDetailsModal'
import OpponentPopup from '../components/OpponentPopup'

// Mock Data for Radar Chart
const languageData = [
  { subject: 'Python', A: 120, fullMark: 150 },
  { subject: 'JS/TS', A: 98, fullMark: 150 },
  { subject: 'C++', A: 86, fullMark: 150 },
  { subject: 'Java', A: 99, fullMark: 150 },
  { subject: 'Go', A: 85, fullMark: 150 },
  { subject: 'Rust', A: 65, fullMark: 150 },
]

// Removed Mock Trophies - fetching real data from API now

export default function Profile() {
  const { username } = useParams()
  const navigate = useNavigate()

  const [player, setPlayer] = useState<any>(null)
  const [ratingHistory, setRatingHistory] = useState<any[]>([])
  const [matchHistory, setMatchHistory] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [unlockedCount, setUnlockedCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const { user } = useAuthStore()
  const [selectedDuelId, setSelectedDuelId] = useState<string | null>(null)
  const [selectedOpponent, setSelectedOpponent] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
        const response = await axios.get(`${apiUrl}/users/profile/${username}`)
        setPlayer(response.data.profile)
        setRatingHistory(response.data.ratingHistory)
        setMatchHistory(response.data.matchHistory)

        try {
          const achRes = await axios.get(
            `${apiUrl}/achievements/user/${username}`
          )
          if (achRes.data.success) {
            setAchievements(achRes.data.achievements)
            setUnlockedCount(achRes.data.unlockedCount)
          }
        } catch (e) {
          console.error('Failed to load user achievements', e)
        }
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

  const currentXp = player.xp || 0
  const currentBase = player.currentLevelBaseXp || 0
  const nextXp = player.nextLevelXp || 100
  const xpProgress = Math.max(
    0,
    Math.min(100, ((currentXp - currentBase) / (nextXp - currentBase)) * 100)
  )

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="grid lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 flex items-start gap-6">
          <div className="relative">
            <div className="w-20 h-20 bg-secondary border-2 border-accent flex items-center justify-center shrink-0">
              <span className="font-['Barlow_Condensed'] font-extrabold text-3xl text-foreground">
                {player.name[0].toUpperCase()}
              </span>
            </div>
            {/* Level Badge Overlay */}
            <div className="absolute -bottom-2 -right-2 bg-accent text-background w-8 h-8 flex items-center justify-center font-['JetBrains_Mono'] font-bold text-xs shadow-lg transform rotate-12 border-2 border-background">
              L{player.level || 1}
            </div>
          </div>
          <div className="flex-1">
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

            {/* XP Progress Bar */}
            <div className="mt-4 max-w-md">
              <div className="flex justify-between text-[10px] font-['JetBrains_Mono'] text-muted-foreground mb-1 uppercase tracking-widest">
                <span>XP Progress</span>
                <span>
                  {currentXp} / {nextXp} XP
                </span>
              </div>
              <div className="h-1.5 w-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-1000 ease-out"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-6 mt-6">
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
          {user?.username === player.name ? (
            <Button
              variant="outline"
              onClick={() => navigate('/profile/edit')}
              className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-xs h-10 px-5"
            >
              <Edit3 size={13} className="mr-1.5" /> Edit Profile
            </Button>
          ) : (
            <Button
              onClick={() => alert('Challenge feature coming soon!')}
              className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-xs h-10 px-5"
            >
              <Zap size={13} className="mr-1.5" /> Challenge
            </Button>
          )}
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

          {/* Language Radar */}
          <div className="border border-border bg-card p-5">
            <h2 className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-foreground text-sm mb-4">
              Language Radar
            </h2>
            <div className="h-48 -ml-6">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  data={languageData}
                >
                  <PolarGrid stroke="#2e2e38" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{
                      fill: '#6b6b7e',
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono',
                    }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 150]}
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="Language Mastery"
                    dataKey="A"
                    stroke="#5b4ff0"
                    fill="#5b4ff0"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trophies & Badges */}
          <div className="border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-foreground text-sm">
                Trophies & Badges
              </h2>
              <span className="font-['JetBrains_Mono'] text-xs font-bold text-accent">
                {unlockedCount} / {achievements.length} Unlocked
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {achievements.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-start gap-3 p-3 border rounded-sm transition-all ${
                    t.isUnlocked
                      ? 'bg-accent/10 border-accent text-foreground shadow-sm'
                      : 'bg-secondary/20 border-border text-muted-foreground opacity-50'
                  }`}
                >
                  <div className="text-2xl shrink-0 p-1.5 bg-background border border-border rounded-sm flex items-center justify-center w-10 h-10">
                    {t.iconUrl || '🏆'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-sm truncate flex items-center gap-1.5">
                      <span>{t.title}</span>
                      {t.isUnlocked && (
                        <span className="text-[10px] bg-accent text-accent-foreground px-1 py-0.2 rounded font-['JetBrains_Mono']">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="font-['JetBrains_Mono'] text-[11px] mt-0.5 line-clamp-2">
                      {t.description}
                    </div>
                    <div className="font-['JetBrains_Mono'] text-[10px] text-accent mt-1 font-semibold">
                      +{t.xpReward} XP{' '}
                      {t.eloReward > 0 && `• +${t.eloReward} ELO`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                  onClick={() => m.id && setSelectedDuelId(m.id)}
                  className="flex items-center gap-4 px-5 py-3 border-b border-border last:border-b-0 hover:bg-secondary/40 cursor-pointer transition-colors"
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

      {selectedDuelId && user?.id && (
        <MatchDetailsModal
          duelId={selectedDuelId}
          currentUserId={user.id}
          onClose={() => setSelectedDuelId(null)}
          onOpponentClick={(oppUsername) => setSelectedOpponent(oppUsername)}
        />
      )}

      {selectedOpponent && (
        <OpponentPopup
          username={selectedOpponent}
          onClose={() => setSelectedOpponent(null)}
          onChallenge={() => {
            setSelectedOpponent(null)
            alert('Challenge feature coming soon!')
          }}
        />
      )}
    </div>
  )
}
