import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Code2,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  Shield,
  Lock,
} from 'lucide-react'
import { LANGUAGES } from '../data/mock'
import { useAuthStore } from '../store/useAuthStore'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert']

const checkPasswordStrength = (pass: string) => {
  let score = 0
  if (!pass) return { score: 0, label: '', color: 'bg-muted', issues: [] }

  const issues = []
  if (pass.length < 12) issues.push('At least 12 characters')
  else score += 1

  if (!/[A-Z]/.test(pass) || !/[a-z]/.test(pass))
    issues.push('Mix of upper & lowercase')
  else score += 1

  if (!/[0-9]/.test(pass)) issues.push('At least one number')
  else score += 1

  if (!/[^A-Za-z0-9]/.test(pass)) issues.push('At least one symbol')
  else score += 1

  const lowerPass = pass.toLowerCase()
  if (
    lowerPass.includes('1234') ||
    lowerPass.includes('password') ||
    lowerPass.includes('qwerty')
  ) {
    score = Math.max(0, score - 1)
    issues.push('Avoid common sequences')
  }

  if (pass.length < 12) score = Math.min(score, 1)

  switch (score) {
    case 0:
      return { score, label: 'Weak', color: 'bg-destructive', issues }
    case 1:
      return { score, label: 'Fair', color: 'bg-orange-500', issues }
    case 2:
      return { score, label: 'Good', color: 'bg-yellow-500', issues }
    case 3:
      return { score, label: 'Strong', color: 'bg-emerald-400', issues }
    case 4:
      return { score, label: 'Excellent', color: 'bg-emerald-500', issues }
    default:
      return { score: 0, label: '', color: 'bg-muted', issues }
  }
}

export default function Register() {
  const navigate = useNavigate()
  const { register, error: authError, clearError } = useAuthStore()

  const [step, setStep] = useState(1)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    clearError()
  }, [clearError])
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    lang: 'Python',
    skill: 'Intermediate',
  })

  const strength = checkPasswordStrength(form.password)

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (strength.issues.length > 0) {
      // Don't proceed if password is weak
      return
    }
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        primaryLanguage: form.lang,
        skillLevel: form.skill,
      })
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

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 flex items-center justify-center border font-['JetBrains_Mono'] text-xs transition-colors ${step >= s ? 'bg-accent border-accent text-accent-foreground' : 'border-border text-muted-foreground'}`}
              >
                {step > s ? <Check size={12} /> : s}
              </div>
              <span
                className={`font-['Barlow'] text-xs ${step >= s ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                {s === 1 ? 'Account' : 'Profile'}
              </span>
              {s < 2 && (
                <span className="text-muted-foreground/30 mx-1">—</span>
              )}
            </div>
          ))}
        </div>

        <div className="mb-8">
          <h1 className="font-['Barlow_Condensed'] font-extrabold text-4xl uppercase text-foreground">
            {step === 1 ? 'Create Account' : 'Your Profile'}
          </h1>
          <p className="font-['Barlow'] text-sm text-muted-foreground mt-1">
            {step === 1
              ? 'Join 48,000+ coders competing daily.'
              : 'Tell us about your skills.'}
          </p>
        </div>

        {authError && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/50 text-destructive font-['JetBrains_Mono'] text-xs">
            {authError}
            {authError.toLowerCase().includes('email') && (
              <div className="mt-2">
                <Link
                  to="/forgot-password"
                  className="text-accent hover:underline font-bold"
                >
                  Do you want to recover your password?
                </Link>
              </div>
            )}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleNext} className="space-y-4">
            <div>
              <label className="font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase tracking-widest block mb-2">
                Username
              </label>
              <Input
                type="text"
                required
                minLength={3}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="font-['JetBrains_Mono'] h-11"
                placeholder="johndoe123"
              />
            </div>
            <div>
              <label className="font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase tracking-widest block mb-2">
                Email
              </label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="font-['JetBrains_Mono'] h-11"
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label className="font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase tracking-widest block mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="font-['JetBrains_Mono'] pr-10 h-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {form.password && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`flex-1 rounded-full transition-colors ${
                          strength.score >= level ? strength.color : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={`font-['JetBrains_Mono'] text-xs font-bold ${strength.color.replace('bg-', 'text-')}`}
                    >
                      {strength.label}
                    </span>
                  </div>
                  {strength.issues.length > 0 && (
                    <ul className="text-xs font-['Barlow'] text-muted-foreground list-disc pl-4 space-y-1 mt-1">
                      {strength.issues.map((issue, i) => (
                        <li key={i} className="text-destructive/80">
                          {issue}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={form.password.length > 0 && strength.issues.length > 0}
              className="w-full font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-base mt-2 h-12"
            >
              Continue <ArrowRight size={16} className="ml-2" />
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase tracking-widest block mb-2">
                Primary Language
              </label>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGES.filter((l) => l !== 'All')
                  .slice(0, 8)
                  .map((l) => (
                    <button
                      type="button"
                      key={l}
                      onClick={() => setForm({ ...form, lang: l })}
                      className={`font-['JetBrains_Mono'] text-xs px-3 py-1.5 border transition-colors ${form.lang === l ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground'}`}
                    >
                      {l}
                    </button>
                  ))}
              </div>
            </div>
            <div>
              <label className="font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase tracking-widest block mb-2">
                Skill Level
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SKILL_LEVELS.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setForm({ ...form, skill: s })}
                    className={`font-['Barlow'] text-xs px-3 py-1.5 border transition-colors ${form.skill === s ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="font-['Barlow'] text-xs text-muted-foreground mt-2">
                This sets your starting ELO rating (800–1400).
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 font-['Barlow_Condensed'] uppercase tracking-widest font-bold text-muted-foreground h-12"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-[2] font-['Barlow_Condensed'] uppercase tracking-widest font-bold h-12 text-base"
              >
                {loading ? (
                  'Creating...'
                ) : (
                  <>
                    Create Account <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex flex-col items-center gap-2.5 mb-6">
            <div className="flex items-center gap-2 text-muted-foreground/70">
              <Shield size={14} className="text-emerald-500" />
              <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest">
                100% Sandboxed Code Execution
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground/70">
              <Lock size={14} className="text-accent" />
              <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest">
                End-to-End Encrypted Credentials
              </span>
            </div>
          </div>
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
          Have an account?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
