import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import {
  Code2,
  Home,
  ChevronDown,
  Edit3,
  LogOut,
  AlertTriangle,
  Send,
  Trophy,
  User,
  ShieldCheck,
} from 'lucide-react'
import Avatar from './Avatar'
import { api } from '../api/axios'

export default function Navbar() {
  const { user, isAuthenticated, logout, isProfileComplete } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendStatus, setResendStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle')

  const hiddenRoutes = ['/login', '/register', '/profile/edit']
  if (!isAuthenticated || hiddenRoutes.includes(location.pathname)) {
    return null
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleResendVerification = async () => {
    setIsResending(true)
    setResendStatus('idle')
    try {
      await api.post('/auth/resend-verification')
      setResendStatus('success')
      setTimeout(() => setResendStatus('idle'), 5000)
    } catch {
      setResendStatus('error')
      setTimeout(() => setResendStatus('idle'), 5000)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <nav className="sticky top-0 left-0 right-0 z-50 flex flex-col bg-background/90 backdrop-blur-md border-b border-border">
      {/* Profile Incomplete Banner */}
      {!isProfileComplete() && (
        <div className="bg-red-500/10 border-b border-red-500/30 text-red-500 px-6 py-2.5 flex items-center justify-between font-['JetBrains_Mono'] text-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle size={14} />
            <span>
              Your profile is incomplete. You will need to complete it before
              joining a duel.
            </span>
          </div>
          <button
            onClick={() => navigate('/profile/edit')}
            className="font-bold underline hover:no-underline flex items-center gap-1 shrink-0"
          >
            Complete Profile
          </button>
        </div>
      )}

      {/* Email Verification Banner */}
      {user && !user.emailVerified && (
        <div className="bg-orange-500/10 border-b border-orange-500/30 text-orange-500 px-6 py-2.5 flex items-center justify-between font-['JetBrains_Mono'] text-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle size={14} />
            <span>Please check your inbox to verify your email address.</span>
          </div>
          <button
            onClick={handleResendVerification}
            disabled={isResending || resendStatus === 'success'}
            className={`font-bold flex items-center gap-1 shrink-0 ${resendStatus === 'success' ? 'text-emerald-500' : resendStatus === 'error' ? 'text-destructive' : 'underline hover:no-underline'}`}
          >
            {isResending ? (
              'Sending...'
            ) : resendStatus === 'success' ? (
              'Sent!'
            ) : resendStatus === 'error' ? (
              'Failed!'
            ) : (
              <>
                Resend <Send size={12} />
              </>
            )}
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14 w-full">
        {/* Left: Logo */}
        <NavLink to="/" className="flex items-center gap-2">
          <Code2 size={18} className="text-accent" />
          <span className="font-['Barlow_Condensed'] font-extrabold text-lg tracking-widest uppercase text-foreground">
            Code<span className="text-accent">Duel</span>
          </span>
        </NavLink>

        {/* Middle: Navigation Icons */}
        <div className="flex items-center gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-2 transition-colors px-4 py-2 rounded-full ${
                isActive
                  ? 'text-accent bg-accent/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
            title="Home"
          >
            <Home size={18} />
          </NavLink>
          <NavLink
            to="/leaderboard"
            className={({ isActive }) =>
              `flex items-center gap-2 transition-colors px-4 py-2 rounded-full ${
                isActive
                  ? 'text-accent bg-accent/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
            title="Leaderboard"
          >
            <Trophy size={18} />
          </NavLink>
        </div>

        {/* Right: Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
          >
            {user && (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="font-['JetBrains_Mono'] text-xs font-bold text-accent">
                    Lvl {user.level || 1}
                  </span>
                </div>
                <Avatar user={user} size="sm" />
              </div>
            )}
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>

          {menuOpen && (
            <>
              {/* Invisible overlay to close dropdown when clicking outside */}
              <div
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setMenuOpen(false)}
              ></div>

              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border shadow-2xl z-50 py-1">
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    navigate(`/profile/${user?.username}`)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary/80 flex items-center gap-3 font-['JetBrains_Mono'] transition-colors"
                >
                  <User size={14} className="text-muted-foreground" /> My
                  Profile
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('/profile/edit')
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary/80 flex items-center gap-3 font-['JetBrains_Mono'] transition-colors"
                >
                  <Edit3 size={14} className="text-muted-foreground" /> Edit
                  Profile
                </button>

                {user?.isAdmin && (
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      navigate('/admin/users')
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-accent hover:bg-accent/10 flex items-center gap-3 font-['JetBrains_Mono'] transition-colors"
                  >
                    <ShieldCheck size={14} className="text-accent" /> Admin
                    Panel
                  </button>
                )}

                <div className="border-t border-border my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-secondary/80 flex items-center gap-3 font-['JetBrains_Mono'] transition-colors"
                >
                  <LogOut size={14} className="text-red-400" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
