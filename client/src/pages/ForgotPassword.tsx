import { useState } from "react";
import { Link } from "react-router-dom";
import { Code2, ArrowLeft, Send } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    
    try {
      const res = await fetch("http://localhost:4000/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to send reset email");
      
      setStatus("success");
      setMessage(data.message || "If an account exists, a reset link was sent.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="font-['Barlow_Condensed'] font-extrabold text-4xl uppercase text-foreground">Reset Password</h1>
          <p className="font-['Barlow'] text-sm text-muted-foreground mt-1">Enter your email to receive a recovery link.</p>
        </div>

        {status === "error" && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/50 text-destructive font-['JetBrains_Mono'] text-xs">
            {message}
          </div>
        )}
        
        {status === "success" && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 font-['JetBrains_Mono'] text-xs">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase tracking-widest block mb-2">Account Email</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="font-['JetBrains_Mono'] h-11"
              placeholder="you@domain.com"
            />
          </div>

          <Button type="submit" disabled={loading || status === "success"} size="lg" className="w-full font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-base mt-2 h-12">
            {loading ? "Sending..." : <>Send Reset Link <Send size={15} className="ml-2" /></>}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border flex justify-center">
          <Link to="/login" className="flex items-center gap-2 font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
