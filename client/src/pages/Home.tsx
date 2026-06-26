import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, Trophy, Users, Code2, Zap, Shield, GitBranch, Star, ChevronRight, AlertTriangle } from "lucide-react";
import { LIVE_DUELS, LEADERBOARD, PROBLEMS, STATS_GLOBAL, DIFF_COLORS } from "../data/mock";
import { useAuthStore } from "../store/useAuthStore";

function DuelMockup() {
  return (
    <div className="border border-border bg-card rounded-sm overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground">LIVE DUEL #4821</span>
        </div>
        <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-xs text-muted-foreground">
          <Clock size={12} />
          <span>08:32</span>
        </div>
      </div>
      <div className="grid grid-cols-2 border-b border-border">
        <div className="px-4 py-3 border-r border-border">
          <div className="flex items-center justify-between">
            <span className="font-['JetBrains_Mono'] text-sm font-medium text-foreground">r3cursion</span>
            <span className="font-['JetBrains_Mono'] text-xs text-accent">2847</span>
          </div>
          <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ width: "72%" }} />
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="font-['JetBrains_Mono'] text-sm font-medium text-foreground">nullptr</span>
            <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground">2741</span>
          </div>
          <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-muted-foreground/40 rounded-full" style={{ width: "58%" }} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2">
        {[
          { code: `def solve(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        diff = target - n\n        if diff in seen:\n            return [seen[diff], i]\n        seen[n] = i`, active: true },
          { code: `fn solve(nums: Vec<i32>,\n         target: i32) -> Vec<i32> {\n    let mut map = HashMap::new();\n    for (i, &n) in nums.iter()\n                       .enumerate() {`, active: false },
        ].map((editor, idx) => (
          <div key={idx} className={`p-4 font-['JetBrains_Mono'] text-xs leading-relaxed border-r border-border last:border-r-0 ${editor.active ? "bg-card" : "bg-secondary/30"}`}>
            <pre className="text-foreground/70 whitespace-pre-wrap">{editor.code}</pre>
            {editor.active && <span className="inline-block w-0.5 h-3 bg-accent animate-pulse ml-0.5 align-middle" />}
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-border bg-secondary/50 flex items-center justify-between">
        <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground">Two Sum · Easy</span>
        <span className="font-['JetBrains_Mono'] text-xs text-accent">Tests: 7/10</span>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { isProfileComplete, isAuthenticated, user } = useAuthStore();

  const features = [
    { icon: <Zap size={18} />, title: "Sub-100ms Judging", desc: "Our execution engine compiles and runs your code against all test cases in under 100 milliseconds on average." },
    { icon: <Shield size={18} />, title: "Anti-Cheat Engine", desc: "Behavioral analysis, identical-test detection, and submission timing algorithms keep duels fair." },
    { icon: <GitBranch size={18} />, title: "12 Languages", desc: "Python, C++, Rust, Go, Java, TypeScript, C, Ruby, Kotlin, Swift, Scala, Haskell — all first-class." },
    { icon: <Star size={18} />, title: "ELO Rating System", desc: "A calibrated rating system modeled on competitive chess ensures every match is meaningful." },
    { icon: <Trophy size={18} />, title: "Weekly Tournaments", desc: "Open and invite-only brackets with cash prizes and sponsor perks every Sunday." },
    { icon: <Code2 size={18} />, title: "Replay & Analysis", desc: "Replay any duel keystroke-by-keystroke. See where you lost time and study opponents' approaches." },
  ];

  const steps = [
    { num: "01", icon: <Users size={20} />, title: "Matchmake", desc: "Queue by rating or challenge a friend directly. The system pairs you with a rival at your skill level in seconds." },
    { num: "02", icon: <Code2 size={20} />, title: "Code", desc: "Both coders get the same problem simultaneously. Write your solution in any supported language inside the live editor." },
    { num: "03", icon: <Zap size={20} />, title: "Submit", desc: "Pass all test cases before your opponent does. Speed and correctness both matter — first clean solution wins." },
    { num: "04", icon: <Trophy size={20} />, title: "Rank Up", desc: "Your ELO rating updates instantly. Climb the global leaderboard, earn titles, and unlock tournament invitations." },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[calc(100vh-3.5rem)] flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-[0.06]" style={{ background: "radial-gradient(ellipse, #5b4ff0 0%, transparent 70%)" }} />
        <div className="relative max-w-7xl mx-auto px-6 w-full py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground tracking-widest uppercase">{LIVE_DUELS.length} duels live now</span>
              </div>
              <h1 className="font-['Barlow_Condensed'] font-extrabold text-6xl lg:text-8xl leading-none tracking-tight text-foreground mb-4 uppercase">
                Code.<br /><span className="text-accent">Battle.</span><br />Win.
              </h1>
              <p className="font-['Barlow'] text-muted-foreground text-lg leading-relaxed max-w-md mb-8">
                Real-time 1v1 coding duels. Pick a problem, match against a rival, and prove you're the faster engineer. Rated, ranked, and ruthless.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <button onClick={() => navigate("/duels")} className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-sm bg-accent text-accent-foreground px-6 py-3 flex items-center gap-2 hover:bg-accent/90 transition-colors">
                  Find a Duel <ArrowRight size={16} />
                </button>
                <button onClick={() => navigate("/leaderboard")} className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-sm border border-border text-muted-foreground px-6 py-3 hover:text-foreground hover:border-foreground/20 transition-colors">
                  Watch Live
                </button>
              </div>
              <div className="grid grid-cols-4 gap-6 mt-12 pt-12 border-t border-border">
                {STATS_GLOBAL.map((s) => (
                  <div key={s.label}>
                    <div className="font-['Barlow_Condensed'] font-extrabold text-2xl text-foreground">{s.value}</div>
                    <div className="font-['Barlow'] text-xs text-muted-foreground mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:block"><DuelMockup /></div>
          </div>
        </div>
      </section>

      {/* Live Duels */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <h2 className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-foreground text-xl">Live Duels</h2>
            </div>
            <button onClick={() => navigate("/duels")} className="font-['Barlow'] text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {LIVE_DUELS.slice(0, 4).map((duel) => (
              <div key={duel.id} className="border border-border bg-card hover:border-accent/30 transition-colors cursor-pointer p-4" onClick={() => navigate(`/duel/${duel.id}`)}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground">{duel.lang}</span>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock size={11} />
                    <span className="font-['JetBrains_Mono'] text-xs">{duel.elapsed}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-['JetBrains_Mono'] text-sm font-medium text-foreground">{duel.p1}</div>
                    <div className="font-['JetBrains_Mono'] text-xs text-accent">{duel.p1rating}</div>
                  </div>
                  <span className="font-['Barlow_Condensed'] text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">vs</span>
                  <div className="text-right">
                    <div className="font-['JetBrains_Mono'] text-sm font-medium text-foreground">{duel.p2}</div>
                    <div className="font-['JetBrains_Mono'] text-xs text-muted-foreground">{duel.p2rating}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <span className="font-['Barlow'] text-xs text-muted-foreground">{duel.prob}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground tracking-widest uppercase">How it works</span>
            <h2 className="font-['Barlow_Condensed'] font-extrabold text-4xl uppercase text-foreground mt-2">Four steps.<br />Zero excuses.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {steps.map((step) => (
              <div key={step.num} className="bg-background p-8">
                <div className="font-['JetBrains_Mono'] text-xs text-accent mb-6">{step.num}</div>
                <div className="text-foreground mb-4">{step.icon}</div>
                <h3 className="font-['Barlow_Condensed'] font-bold uppercase text-xl text-foreground mb-3 tracking-wide">{step.title}</h3>
                <p className="font-['Barlow'] text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard + Problems preview */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground tracking-widest uppercase">Global</span>
                  <h2 className="font-['Barlow_Condensed'] font-extrabold text-3xl uppercase text-foreground mt-1">Leaderboard</h2>
                </div>
                <button onClick={() => navigate("/leaderboard")} className="font-['Barlow'] text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                  Full rankings <ChevronRight size={14} />
                </button>
              </div>
              <div className="border border-border overflow-hidden">
                <div className="grid grid-cols-[2rem_1fr_auto_auto] gap-4 px-4 py-2 border-b border-border bg-secondary/50">
                  {["#", "Player", "Rating", "Streak"].map((h) => (
                    <span key={h} className="font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase tracking-widest">{h}</span>
                  ))}
                </div>
                {LEADERBOARD.slice(0, 8).map((player, idx) => (
                  <div key={player.rank} className={`grid grid-cols-[2rem_1fr_auto_auto] gap-4 px-4 py-3 items-center border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors cursor-pointer ${idx === 0 ? "bg-accent/5" : ""}`} onClick={() => navigate(`/profile/${player.name}`)}>
                    <span className={`font-['JetBrains_Mono'] text-sm ${idx < 3 ? "text-accent" : "text-muted-foreground"}`}>{player.rank}</span>
                    <div>
                      <span className="font-['JetBrains_Mono'] text-sm text-foreground">{player.name}</span>
                      <span className="font-['Barlow'] text-xs text-muted-foreground ml-2">{player.lang}</span>
                    </div>
                    <span className="font-['JetBrains_Mono'] text-sm text-foreground">{player.rating}</span>
                    <div className="flex items-center gap-1">
                      <Zap size={11} className={player.streak > 0 ? "text-accent" : "text-muted-foreground/30"} />
                      <span className={`font-['JetBrains_Mono'] text-xs ${player.streak > 0 ? "text-accent" : "text-muted-foreground/30"}`}>{player.streak}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground tracking-widest uppercase">Practice</span>
                  <h2 className="font-['Barlow_Condensed'] font-extrabold text-3xl uppercase text-foreground mt-1">Problem Set</h2>
                </div>
                <button onClick={() => navigate("/problems")} className="font-['Barlow'] text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                  All 340 <ChevronRight size={14} />
                </button>
              </div>
              <div className="border border-border overflow-hidden">
                {PROBLEMS.slice(0, 6).map((prob) => (
                  <div key={prob.id} className="flex items-center justify-between px-4 py-3.5 border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors cursor-pointer group" onClick={() => navigate(`/problems/${prob.id}`)}>
                    <div className="flex-1 min-w-0">
                      <div className="font-['Barlow'] text-sm text-foreground group-hover:text-accent transition-colors truncate">{prob.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {prob.tags.map((tag) => (
                          <span key={tag} className="font-['JetBrains_Mono'] text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4 shrink-0">
                      <span className={`font-['JetBrains_Mono'] text-xs ${DIFF_COLORS[prob.diff]}`}>{prob.diff}</span>
                      <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground hidden sm:block">{prob.solves.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground tracking-widest uppercase">Platform</span>
            <h2 className="font-['Barlow_Condensed'] font-extrabold text-4xl uppercase text-foreground mt-2">Built for competitors</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {features.map((f) => (
              <div key={f.title} className="bg-background p-8 hover:bg-secondary/20 transition-colors">
                <div className="text-accent mb-4">{f.icon}</div>
                <h3 className="font-['Barlow_Condensed'] font-bold uppercase text-lg text-foreground mb-2 tracking-wide">{f.title}</h3>
                <p className="font-['Barlow'] text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground tracking-widest uppercase">Ready?</span>
          <h2 className="font-['Barlow_Condensed'] font-extrabold text-6xl lg:text-8xl uppercase text-foreground mt-4 mb-4 leading-none">
            Enter the<br /><span className="text-accent">Arena.</span>
          </h2>
          <p className="font-['Barlow'] text-muted-foreground text-lg max-w-md mx-auto mb-10">
            Free to play. No setup. Just you, your editor, and an opponent waiting to be beaten.
          </p>
          <button onClick={() => navigate("/register")} className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-sm bg-accent text-accent-foreground px-8 py-4 flex items-center gap-2 mx-auto hover:bg-accent/90 transition-colors">
            Create free account <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}
