import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  Activity,
  Database,
  Users,
  Gamepad2,
  Clock,
  Cpu,
  PlaySquare,
  Network,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ChartPoint {
  date: string
  duels: number
}

interface ActiveDuel {
  id: string
  status: string
  remainingTime: number
  problemTitle: string
  players: { id: string; username: string }[]
}

interface HealthStats {
  sockets: {
    activePlayers: number
    waitingPlayers: number
    activeDuels: number
  }
  database: {
    status: string
    latency: number
    totalUsers: number
    duelsToday: number
  }
  judge0: {
    status: string
    latency: number
  }
  server: {
    uptime: number
    memoryMb: number
    cpuLoad: number
  }
}

export default function HealthDashboard() {
  const [stats, setStats] = useState<HealthStats | null>(null)
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [activeDuels, setActiveDuels] = useState<ActiveDuel[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const [resStats, resChart, resDuels] = await Promise.all([
        axios.get('http://localhost:4000/admin/health-stats', {
          withCredentials: true,
        }),
        axios.get('http://localhost:4000/admin/duels-chart', {
          withCredentials: true,
        }),
        axios.get('http://localhost:4000/admin/active-duels', {
          withCredentials: true,
        }),
      ])

      if (resStats.data.success) setStats(resStats.data.data)
      if (resChart.data.success) setChartData(resChart.data.data)
      if (resDuels.data.success) setActiveDuels(resDuels.data.data)

      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [])

  if (loading && !stats) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <Activity className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="p-8 text-destructive">
        Error loading dashboard: {error}
      </div>
    )
  }

  if (!stats) return null

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
  }

  const getStatusColor = (status: string, latency: number = 0) => {
    if (status === 'offline' || status === 'degraded') return 'text-destructive'
    if (latency > 500) return 'text-yellow-500'
    return 'text-green-500'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-['Barlow_Condensed'] tracking-wider text-foreground">
            SYSTEM HEALTH
          </h1>
          <p className="text-sm text-muted-foreground font-['JetBrains_Mono']">
            Real-time platform metrics and infrastructure status
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-['JetBrains_Mono'] bg-secondary px-3 py-1.5 rounded-sm border border-border">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          LIVE SYNC
        </div>
      </div>

      {/* MATCHMAKING & SOCKETS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-sm p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Network className="w-4 h-4" />
            <h2 className="text-sm font-['Barlow_Condensed'] tracking-widest">
              ACTIVE SOCKETS
            </h2>
          </div>
          <div className="text-4xl font-['JetBrains_Mono'] text-accent">
            {stats.sockets.activePlayers}
          </div>
        </div>
        <div className="bg-card border border-border rounded-sm p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Users className="w-4 h-4" />
            <h2 className="text-sm font-['Barlow_Condensed'] tracking-widest">
              IN QUEUE
            </h2>
          </div>
          <div className="text-4xl font-['JetBrains_Mono'] text-foreground">
            {stats.sockets.waitingPlayers}
          </div>
        </div>
        <div className="bg-card border border-border rounded-sm p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Gamepad2 className="w-4 h-4" />
            <h2 className="text-sm font-['Barlow_Condensed'] tracking-widest">
              ACTIVE DUELS
            </h2>
          </div>
          <div className="text-4xl font-['JetBrains_Mono'] text-purple-400">
            {stats.sockets.activeDuels}
          </div>
        </div>
      </div>

      {/* INFRASTRUCTURE */}
      <h2 className="text-xl font-['Barlow_Condensed'] tracking-wider text-foreground mt-8 mb-4 border-b border-border pb-2">
        INFRASTRUCTURE
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* DATABASE */}
        <div className="bg-card border border-border rounded-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-secondary rounded-sm border border-border">
              <Database className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h3 className="font-['Barlow_Condensed'] tracking-wider text-lg">
                POSTGRESQL DB
              </h3>
              <p className="text-xs text-muted-foreground font-['JetBrains_Mono']">
                Latency: {stats.database.latency}ms
              </p>
            </div>
          </div>
          <div
            className={`font-['JetBrains_Mono'] font-bold uppercase ${getStatusColor(stats.database.status, stats.database.latency)}`}
          >
            {stats.database.status}
          </div>
        </div>

        {/* JUDGE0 */}
        <div className="bg-card border border-border rounded-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-secondary rounded-sm border border-border">
              <PlaySquare className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h3 className="font-['Barlow_Condensed'] tracking-wider text-lg">
                JUDGE0 EXECUTION
              </h3>
              <p className="text-xs text-muted-foreground font-['JetBrains_Mono']">
                Latency:{' '}
                {stats.judge0.status === 'online'
                  ? `${stats.judge0.latency}ms`
                  : 'N/A'}
              </p>
            </div>
          </div>
          <div
            className={`font-['JetBrains_Mono'] font-bold uppercase ${getStatusColor(stats.judge0.status, stats.judge0.latency)}`}
          >
            {stats.judge0.status}
          </div>
        </div>
      </div>

      {/* PLATFORM METRICS */}
      <h2 className="text-xl font-['Barlow_Condensed'] tracking-wider text-foreground mt-8 mb-4 border-b border-border pb-2">
        PLATFORM METRICS
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-sm p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="w-4 h-4" />
            <h2 className="text-xs font-['Barlow_Condensed'] tracking-widest">
              SERVER UPTIME
            </h2>
          </div>
          <div className="text-xl font-['JetBrains_Mono'] text-foreground">
            {formatUptime(stats.server.uptime)}
          </div>
        </div>
        <div className="bg-card border border-border rounded-sm p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Cpu className="w-4 h-4" />
            <h2 className="text-xs font-['Barlow_Condensed'] tracking-widest">
              MEMORY USAGE
            </h2>
          </div>
          <div className="text-xl font-['JetBrains_Mono'] text-foreground">
            {stats.server.memoryMb} MB
          </div>
        </div>
        <div className="bg-card border border-border rounded-sm p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="w-4 h-4" />
            <h2 className="text-xs font-['Barlow_Condensed'] tracking-widest">
              TOTAL USERS
            </h2>
          </div>
          <div className="text-xl font-['JetBrains_Mono'] text-foreground">
            {stats.database.totalUsers}
          </div>
        </div>
        <div className="bg-card border border-border rounded-sm p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Gamepad2 className="w-4 h-4" />
            <h2 className="text-xs font-['Barlow_Condensed'] tracking-widest">
              DUELS TODAY
            </h2>
          </div>
          <div className="text-xl font-['JetBrains_Mono'] text-foreground">
            {stats.database.duelsToday}
          </div>
        </div>
      </div>

      {/* ACTIVITY CHART */}
      <h2 className="text-xl font-['Barlow_Condensed'] tracking-wider text-foreground mt-8 mb-4 border-b border-border pb-2">
        DUELS TREND (LAST 7 DAYS)
      </h2>
      <div className="bg-card border border-border rounded-sm p-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorDuels" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#333"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="#666"
              tick={{ fontSize: 12, fill: '#888' }}
              tickMargin={10}
            />
            <YAxis stroke="#666" tick={{ fontSize: 12, fill: '#888' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111',
                borderColor: '#333',
                borderRadius: '4px',
              }}
              itemStyle={{ color: '#22c55e' }}
            />
            <Area
              type="monotone"
              dataKey="duels"
              stroke="#22c55e"
              fillOpacity={1}
              fill="url(#colorDuels)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* SPECTATOR LIST */}
      <h2 className="text-xl font-['Barlow_Condensed'] tracking-wider text-foreground mt-8 mb-4 border-b border-border pb-2">
        ACTIVE DUELS SPECTATOR
      </h2>
      <div className="bg-card border border-border rounded-sm overflow-hidden">
        {activeDuels.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground font-['JetBrains_Mono'] text-sm">
            No active duels at the moment.
          </div>
        ) : (
          <table className="w-full text-left font-['JetBrains_Mono'] text-sm">
            <thead className="bg-secondary text-muted-foreground">
              <tr>
                <th className="p-4 font-normal">MATCHUP</th>
                <th className="p-4 font-normal">PROBLEM</th>
                <th className="p-4 font-normal">STATUS</th>
                <th className="p-4 font-normal text-right">TIME LEFT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeDuels.map((duel) => (
                <tr
                  key={duel.id}
                  className="hover:bg-secondary/50 transition-colors"
                >
                  <td className="p-4">
                    <span className="text-accent">
                      {duel.players[0]?.username || 'Waiting...'}
                    </span>
                    <span className="text-muted-foreground mx-2">vs</span>
                    <span className="text-purple-400">
                      {duel.players[1]?.username || 'Waiting...'}
                    </span>
                  </td>
                  <td className="p-4">{duel.problemTitle}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-sm text-xs border ${
                        duel.status === 'IN_GAME'
                          ? 'border-green-500/50 text-green-500 bg-green-500/10'
                          : duel.status === 'ROULETTE'
                            ? 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10'
                            : 'border-border text-muted-foreground bg-secondary'
                      }`}
                    >
                      {duel.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {Math.floor(duel.remainingTime / 60)}:
                    {(duel.remainingTime % 60).toString().padStart(2, '0')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
