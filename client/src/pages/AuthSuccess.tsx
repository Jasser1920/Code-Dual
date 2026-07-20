import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { Code2 } from 'lucide-react'

export default function AuthSuccess() {
  const navigate = useNavigate()
  const checkAuth = useAuthStore((state) => state.checkAuth)

  useEffect(() => {
    const init = async () => {
      // A small UX delay so the screen doesn't just flash instantly
      await new Promise((r) => setTimeout(r, 500))

      // Call the backend /auth/refresh to validate the HttpOnly cookie
      // and retrieve the user's profile and new JWT token
      await checkAuth()

      const user = useAuthStore.getState().user
      if (user?.isAdmin) {
        navigate('/admin')
      } else {
        navigate('/')
      }
    }
    init()
  }, [checkAuth, navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Code2 size={40} className="text-accent animate-pulse mb-6" />
      <h2 className="font-['Barlow_Condensed'] font-extrabold text-3xl uppercase tracking-widest text-foreground">
        Authenticating...
      </h2>
      <p className="font-['Barlow'] text-sm text-muted-foreground mt-2">
        Validating your GitHub credentials and entering the arena
      </p>
    </div>
  )
}
