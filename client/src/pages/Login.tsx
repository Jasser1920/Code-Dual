import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Code2, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

export default function Login() {
  const navigate = useNavigate()
  const { login, error: authError } = useAuthStore()

  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login({ email: form.email, password: form.password })
      navigate('/')
    } catch {
      // Error state is caught and set by Zustand store
    } finally {
      setLoading(false)
    }
  }

  const handleGithubLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
    window.location.href = `${apiUrl}/auth/login/github`
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <Code2 size={18} className="text-accent" />
          <span className="font-['Barlow_Condensed'] font-extrabold text-lg tracking-widest uppercase">
            Code<span className="text-accent">Duel</span>
          </span>
        </div>

        <div className="mb-8">
          <h1 className="font-['Barlow_Condensed'] font-extrabold text-4xl uppercase text-foreground">
            Sign In
          </h1>
          <p className="font-['Barlow'] text-sm text-muted-foreground mt-1">
            Enter the arena.
          </p>
        </div>

        {authError && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/50 text-destructive font-['JetBrains_Mono'] text-xs">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase tracking-widest block mb-2">
              Email or Username
            </label>
            <Input
              type="text"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="font-['JetBrains_Mono'] h-11"
              placeholder="Email or Username"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase tracking-widest block">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="font-['JetBrains_Mono'] text-xs text-accent hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="font-['JetBrains_Mono'] pr-10 h-11"
                placeholder="Password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="w-full font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-base mt-2 h-12"
          >
            {loading ? (
              'Signing in...'
            ) : (
              <>
                Sign In <ArrowRight size={16} className="ml-2" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={handleGithubLogin}
              className="w-full font-['Barlow_Condensed'] uppercase tracking-widest font-bold text-sm h-11 text-muted-foreground"
            >
              GitHub
            </Button>
          </div>
        </div>

        <p className="font-['Barlow'] text-xs text-muted-foreground text-center mt-6">
          No account?{' '}
          <Link to="/register" className="text-accent hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
