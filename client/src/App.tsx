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
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/react'
function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const { socket, connect } = useSocketStore()

  useEffect(() => {
    if (user?.id && !location.pathname.startsWith('/duel')) {
      connect()
    }
  }, [user?.id, location.pathname, connect])

  useEffect(() => {
    if (socket && user?.id) {
      socket.emit('check_active_duel', { userId: user.id })

      const handleActiveDuelFound = (data: { roomId: string }) => {
        if (!location.pathname.startsWith('/duel')) {
          navigate(`/duel/${data.roomId}`)
        }
      }

      socket.on('active_duel_found', handleActiveDuelFound)

      return () => {
        socket.off('active_duel_found', handleActiveDuelFound)
      }
    }
  }, [socket, user?.id, location.pathname, navigate])

  // Routes where the Navbar is hidden
  const hiddenRoutes = [
    '/login',
    '/register',
    '/profile/edit',
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
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth-success" element={<AuthSuccess />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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
              <Route path="reports" element={<ReportsManager />} />
            </Route>
          </Route>
        </Routes>
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
