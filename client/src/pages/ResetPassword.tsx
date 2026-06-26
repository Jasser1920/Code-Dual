import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Code2, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
const strengthColors = ["bg-destructive", "bg-destructive", "bg-orange-500", "bg-emerald-500", "bg-emerald-400"];

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [form, setForm] = useState({ new: "", repeat: "" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length > 7) score++;
    if (pwd.match(/[a-z]/) && pwd.match(/[A-Z]/)) score++;
    if (pwd.match(/\d/)) score++;
    if (pwd.match(/[^a-zA-Z\d]/)) score++;
    return Math.min(score, 4);
  };

  const pwdStrength = calculateStrength(form.new);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatus("error");
      setMessage("Invalid or missing reset token.");
      return;
    }
    if (form.new !== form.repeat) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setStatus("idle");
    
    try {
      const res = await fetch("http://localhost:4000/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: form.new }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      
      setStatus("success");
      setMessage(data.message || "Password reset successful.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6">
        <div className="w-full max-w-sm border border-border bg-card p-8 text-center shadow-lg">
          <div className="flex justify-center mb-6">
            <CheckCircle2 size={48} className="text-emerald-500" />
          </div>
          <h1 className="font-['Barlow_Condensed'] font-extrabold text-3xl uppercase text-foreground mb-2">Password Reset</h1>
          <p className="font-['JetBrains_Mono'] text-sm text-muted-foreground mb-8">Your password has been successfully updated.</p>
          <Button size="lg" className="w-full font-['Barlow_Condensed'] uppercase tracking-widest font-bold" onClick={() => navigate("/login")}>
            Sign In Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10">
          <Code2 size={18} className="text-accent" />
          <span className="font-['Barlow_Condensed'] font-extrabold text-lg tracking-widest uppercase">
            Code<span className="text-accent">Duel</span>
          </span>
        </div>

        <div className="mb-8">
          <h1 className="font-['Barlow_Condensed'] font-extrabold text-4xl uppercase text-foreground">New Password</h1>
          <p className="font-['Barlow'] text-sm text-muted-foreground mt-1">Create a new secure password.</p>
        </div>

        {status === "error" && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/50 text-destructive font-['JetBrains_Mono'] text-xs">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase tracking-widest block mb-2">New Password</label>
            <Input type="password" required value={form.new} onChange={e => setForm({...form, new: e.target.value})} className="font-['JetBrains_Mono'] h-11" placeholder="••••••••" />
            {form.new && (
              <div className="mt-2">
                <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden flex">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className={`h-full flex-1 border-r border-background/20 last:border-r-0 ${i <= pwdStrength ? strengthColors[pwdStrength] : 'bg-transparent'}`} />
                  ))}
                </div>
                <p className={`text-right text-[10px] mt-1 font-['JetBrains_Mono'] ${pwdStrength > 0 ? strengthColors[pwdStrength].replace('bg-', 'text-') : 'text-muted-foreground'}`}>{strengthLabels[pwdStrength]}</p>
              </div>
            )}
          </div>
          <div className="space-y-1 pt-2">
            <label className="font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase tracking-widest block mb-2">Confirm Password</label>
            <Input type="password" required value={form.repeat} onChange={e => setForm({...form, repeat: e.target.value})} className="font-['JetBrains_Mono'] h-11" placeholder="••••••••" />
          </div>

          <Button type="submit" disabled={loading || !token} size="lg" className="w-full font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-base mt-6 h-12">
            {loading ? "Updating..." : <>Set Password <ArrowRight size={16} className="ml-2" /></>}
          </Button>
        </form>

        {!token && (
          <p className="font-['Barlow'] text-xs text-destructive text-center mt-6">
            Error: No reset token found in URL.
          </p>
        )}
      </div>
    </div>
  );
}
