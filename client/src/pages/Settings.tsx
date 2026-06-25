import { useNavigate } from "react-router-dom";
import { Zap, Trophy, TrendingUp, Calendar, ArrowRight, Edit3 } from "lucide-react";
import { PROBLEMS, DIFF_BG } from "../data/mock";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAuthStore } from "../store/useAuthStore";
import Avatar from "../components/Avatar";
import { Button } from "../components/ui/button";

const RATING_HISTORY = [
  { date: "Jan", rating: 1920 },
  { date: "Feb", rating: 2005 },
  { date: "Mar", rating: 1988 },
  { date: "Apr", rating: 2134 },
  { date: "May", rating: 2201 },
  { date: "Jun", rating: 2847 },
];

const MATCH_HISTORY = [
  { opp: "nullptr", result: "win", rating: "+18", prob: "Two Sum", time: "02:14", date: "Jun 22" },
  { opp: "bytewolf", result: "win", rating: "+21", prob: "LRU Cache", time: "08:42", date: "Jun 21" },
  { opp: "0xAlice", result: "loss", rating: "−15", prob: "Graph DFS", time: "11:00", date: "Jun 21" },
  { opp: "xh4cker", result: "win", rating: "+24", prob: "Coin Change", time: "06:37", date: "Jun 20" },
  { opp: "wc3pro", result: "win", rating: "+19", prob: "Merge K Lists", time: "09:55", date: "Jun 19" },
  { opp: "segfault", result: "loss", rating: "−12", prob: "Segment Tree", time: "14:00", date: "Jun 18" },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 flex justify-center">
        <p className="text-muted-foreground font-['JetBrains_Mono']">Please log in to view your settings.</p>
      </div>
    );
  }

  // We don't have actual win/loss data yet, so let's mock it for the display
  const wins = 42;
  const losses = 15;
  const streak = 4;
  const globalRank = 1337;
  const winRate = Math.round((wins / (wins + losses)) * 100);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="grid lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 flex items-start gap-6">
          <Avatar user={user} size="lg" className="shrink-0" />
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-['JetBrains_Mono'] font-bold text-2xl text-foreground">{user.username}</h1>
              <span className="font-['JetBrains_Mono'] text-xs text-accent border border-accent/30 bg-accent/10 px-2 py-0.5">{user.rankTier}</span>
              {user.location && (
                <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground border border-border px-2 py-0.5">{user.location}</span>
              )}
              {streak > 3 && (
                <div className="flex items-center gap-1 bg-accent/10 border border-accent/30 px-2 py-0.5">
                  <Zap size={11} className="text-accent" />
                  <span className="font-['JetBrains_Mono'] text-xs text-accent">{streak} streak</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-6 mt-3">
              <div>
                <div className="font-['Barlow_Condensed'] font-extrabold text-3xl text-foreground">{user.elo}</div>
                <div className="font-['Barlow'] text-xs text-muted-foreground">ELO Rating</div>
              </div>
              <div>
                <div className="font-['Barlow_Condensed'] font-extrabold text-3xl text-foreground">#{globalRank}</div>
                <div className="font-['Barlow'] text-xs text-muted-foreground">Global Rank</div>
              </div>
              <div>
                <div className="font-['Barlow_Condensed'] font-extrabold text-3xl text-foreground">{winRate}%</div>
                <div className="font-['Barlow'] text-xs text-muted-foreground">Win Rate</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-start justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/profile/edit")} className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-xs h-10 px-5">
            <Edit3 size={13} className="mr-1.5" /> Edit Profile
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="border border-border bg-card p-5">
            <h2 className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-foreground text-sm mb-4">Stats</h2>
            <div className="space-y-3">
              {[
                { label: "Wins", value: wins, icon: <Trophy size={13} /> },
                { label: "Losses", value: losses, icon: <Zap size={13} /> },
                { label: "Win Streak", value: streak, icon: <TrendingUp size={13} /> },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                  <div className="flex items-center gap-2 text-muted-foreground">{s.icon}<span className="font-['Barlow'] text-xs">{s.label}</span></div>
                  <span className="font-['JetBrains_Mono'] text-sm text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Solved problems */}
          <div className="border border-border bg-card p-5">
            <h2 className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-foreground text-sm mb-4">Solved</h2>
            <div className="space-y-2">
              {PROBLEMS.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-b-0 cursor-pointer group" onClick={() => navigate(`/problems/${p.id}`)}>
                  <span className="font-['Barlow'] text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate pr-2">{p.title}</span>
                  <span className={`font-['JetBrains_Mono'] text-[10px] px-1.5 py-0.5 shrink-0 ${DIFF_BG[p.diff]}`}>{p.diff}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rating chart */}
          <div className="border border-border bg-card p-5">
            <h2 className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-foreground text-sm mb-5">Rating History</h2>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={RATING_HISTORY}>
                  <XAxis dataKey="date" tick={{ fill: "#6b6b7e", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b6b7e", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={40} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ background: "#131318", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 0, fontFamily: "JetBrains Mono", fontSize: 11 }}
                    itemStyle={{ color: "#5b4ff0" }}
                    labelStyle={{ color: "#6b6b7e" }}
                  />
                  <Line type="monotone" dataKey="rating" stroke="#5b4ff0" strokeWidth={2} dot={{ fill: "#5b4ff0", r: 3 }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Match history */}
          <div className="border border-border bg-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-foreground text-sm">Match History</h2>
              <Button variant="ghost" size="sm" className="font-['Barlow'] text-xs h-8 text-muted-foreground">
                All <ArrowRight size={13} className="ml-1" />
              </Button>
            </div>
            {MATCH_HISTORY.map((m, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3 border-b border-border last:border-b-0 hover:bg-secondary/20 transition-colors">
                <div className={`w-12 text-center font-['Barlow_Condensed'] font-bold text-sm uppercase ${m.result === "win" ? "text-emerald-400" : "text-red-400"}`}>
                  {m.result}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-['JetBrains_Mono'] text-sm text-foreground">vs {m.opp}</span>
                    <span className={`font-['JetBrains_Mono'] text-xs ${m.result === "win" ? "text-emerald-400" : "text-red-400"}`}>{m.rating}</span>
                  </div>
                  <span className="font-['Barlow'] text-xs text-muted-foreground">{m.prob}</span>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="font-['JetBrains_Mono'] text-xs text-muted-foreground">{m.time}</div>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <Calendar size={10} className="text-muted-foreground/50" />
                    <span className="font-['Barlow'] text-xs text-muted-foreground/50">{m.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
