import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/useAuthStore'
import { useSocketStore } from './lib/socket'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import AuthSuccess from './pages/AuthSuccess'
import ProfileEdit from './pages/ProfileEdit'
import Navbar from './components/Navbar'
import { SocialPanel } from './components/social/SocialPanel'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import DuelArena from './pages/DuelArena'
import Profile from './pages/Profile'
import DuelResult from './pages/DuelResult'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './pages/admin/AdminLayout'
import UsersManager from './pages/admin/UsersManager'
import ReportsManager from './pages/admin/ReportsManager'
import ProblemsManager from './pages/admin/ProblemsManager'
import HealthDashboard from './pages/admin/HealthDashboard'
import TournamentsManager from './pages/admin/TournamentsManager'
import Tournaments from './pages/Tournaments'
import { Toaster } from 'sonner'
import { showTerminalToast } from './components/ui/terminal-toast'
import { Analytics } from '@vercel/analytics/react'
import { api } from './api/axios'

function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const { socket, connect } = useSocketStore()

  useEffect(() => {
    const checkUserBanStatus = async () => {
      try {
        await api.get('/auth/me')
      } catch (error: any) {
        if (
          error.response &&
          (error.response.status === 403 || error.response.status === 401)
        ) {
          if (error.response.data?.error?.includes('banned')) {
            showTerminalToast('ACCOUNT BANNED', error.response.data.error)
          } else {
            showTerminalToast('SESSION EXPIRED', 'Please log in again.')
          }
          useAuthStore.getState().logout()
          navigate('/login')
        }
      }
    }

    if (useAuthStore.getState().isAuthenticated) {
      checkUserBanStatus()
    }
  }, [location.pathname])

  useEffect(() => {
    if (user?.id && !location.pathname.startsWith('/duel')) {
      connect()
    }
  }, [user?.id, location.pathname, connect])

  useEffect(() => {
    const handleAchievementUnlocked = (data: any) => {
      const ach = data.achievement
      if (ach) {
        showTerminalToast(
          'BADGE UNLOCKED!',
          `${ach.iconUrl || '🏆'} ${ach.title}: ${ach.description} (+${ach.xpReward} XP, +${ach.eloReward} ELO)`
        )
      }
    }

    const handleTournamentChampion = (data: any) => {
      showTerminalToast(
        'TOURNAMENT CHAMPION!',
        `👑 Congratulations! You won the tournament "${data.title}"!`
      )
    }

    const handleApplicationReviewed = (data: any) => {
      if (data.status === 'ACCEPTED') {
        showTerminalToast(
          'APPLICATION APPROVED ✅',
          `You have been accepted into "${data.tournamentTitle}"! Get ready for brackets.`
        )
      } else if (data.status === 'REJECTED') {
        showTerminalToast(
          'APPLICATION REJECTED ❌',
          `Your application for "${data.tournamentTitle}" was declined by an admin.`
        )
      }
    }

    const handleBracketsGenerated = (data: any) => {
      showTerminalToast(
        'BRACKETS GENERATED ⚡',
        `Elimination brackets for "${data.tournamentTitle}" are locked! Matches begin in ${data.minutesRemaining || 15} minutes.`
      )
    }

    window.addEventListener(
      'achievement:unlocked',
      handleAchievementUnlocked as EventListener
    )
    window.addEventListener(
      'tournament:champion',
      handleTournamentChampion as EventListener
    )

    if (socket && user?.id) {
      socket.emit('check_active_duel', { userId: user.id })

      const handleActiveDuelFound = (data: { roomId: string }) => {
        if (!location.pathname.startsWith('/duel')) {
          navigate(`/duel/${data.roomId}`)
        }
      }

      socket.on('active_duel_found', handleActiveDuelFound)
      socket.on('tournament:application_reviewed', handleApplicationReviewed)
      socket.on('tournament:brackets_generated', handleBracketsGenerated)

      return () => {
        socket.off('active_duel_found', handleActiveDuelFound)
        socket.off('tournament:application_reviewed', handleApplicationReviewed)
        socket.off('tournament:brackets_generated', handleBracketsGenerated)
        window.removeEventListener(
          'achievement:unlocked',
          handleAchievementUnlocked as EventListener
        )
        window.removeEventListener(
          'tournament:champion',
          handleTournamentChampion as EventListener
        )
      }
    }

    return () => {
      window.removeEventListener(
        'achievement:unlocked',
        handleAchievementUnlocked as EventListener
      )
      window.removeEventListener(
        'tournament:champion',
        handleTournamentChampion as EventListener
      )
    }
  }, [socket, user?.id, location.pathname, navigate])

  // Routes where the Navbar is hidden
  const hiddenRoutes = [
    '/login',
    '/register',
    '/auth-success',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ]

  // Hide the standard navbar in admin layout too
  const isHiddenRoute =
    hiddenRoutes.includes(location.pathname) ||
    location.pathname.startsWith('/duel') ||
    location.pathname.startsWith('/admin')
  const showNavbar = isAuthenticated && !isHiddenRoute

  return (
    <div className="flex flex-col min-h-screen">
      {showNavbar && <Navbar />}
      <div className="flex-1 flex">
        <div className="flex-1 min-w-0 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth-success" element={<AuthSuccess />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/tournaments" element={<Tournaments />} />
            {/* Duel System */}
            <Route path="/duel/:roomId" element={<DuelArena />} />
            <Route path="/duel/:roomId/result" element={<DuelResult />} />
            {/* Profile & Social */}
            <Route path="/profile/:username" element={<Profile />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<HealthDashboard />} />
                <Route path="users" element={<UsersManager />} />
                <Route path="problems" element={<ProblemsManager />} />
                <Route path="tournaments" element={<TournamentsManager />} />
                <Route path="reports" element={<ReportsManager />} />
              </Route>
            </Route>
          </Routes>
        </div>
        <SocialPanel />
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" theme="dark" richColors />
      <AppContent />
      <Analytics />
    </BrowserRouter>
  )
}

export default App
