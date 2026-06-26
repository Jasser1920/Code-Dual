import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuthStore } from "../store/useAuthStore";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const user = useAuthStore((state) => state.user);

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    if (hasFetched.current) return;
    hasFetched.current = true;

    const verifyToken = async () => {
      try {
        const res = await fetch(`http://localhost:4000/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Verification failed");

        setStatus("success");
        setMessage(data.message || "Email verified successfully!");

        // Update the global auth state so the notification banner disappears
        if (user) {
          useAuthStore.setState({ user: { ...user, emailVerified: true } });
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "An error occurred during verification.");
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm border border-border bg-card p-8 text-center shadow-lg">
        <div className="flex justify-center mb-6">
          {status === "loading" && <Loader2 size={48} className="text-accent animate-spin" />}
          {status === "success" && <CheckCircle2 size={48} className="text-emerald-500" />}
          {status === "error" && <XCircle size={48} className="text-destructive" />}
        </div>

        <h1 className="font-['Barlow_Condensed'] font-extrabold text-3xl uppercase text-foreground mb-2">
          {status === "loading" && "Verifying..."}
          {status === "success" && "Verified!"}
          {status === "error" && "Verification Failed"}
        </h1>

        <p className="font-['JetBrains_Mono'] text-sm text-muted-foreground mb-8">
          {message}
        </p>

        {status === "success" ? (
          <Button size="lg" className="w-full font-['Barlow_Condensed'] uppercase tracking-widest font-bold" onClick={() => navigate("/")}>
            Go to Arena
          </Button>
        ) : status === "error" ? (
          <Button variant="outline" size="lg" className="w-full font-['Barlow_Condensed'] uppercase tracking-widest font-bold" onClick={() => navigate("/login")}>
            Back to Login
          </Button>
        ) : null}
      </div>
    </div>
  );
}
