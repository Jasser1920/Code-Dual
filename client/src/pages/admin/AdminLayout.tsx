import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Users,
  AlertTriangle,
  ShieldCheck,
  Code2,
  Activity,
  LogOut,
} from 'lucide-react'
import { cn } from '../../components/ui/utils'
import { useAuthStore } from '../../store/useAuthStore'

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: Activity, exact: true },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Problems', path: '/admin/problems', icon: Code2 },
    { name: 'Reports', path: '/admin/reports', icon: AlertTriangle },
  ]

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border flex items-center gap-2 shrink-0">
          <ShieldCheck className="w-6 h-6 text-accent" />
          <span className="font-['Barlow_Condensed'] tracking-widest uppercase text-xl font-bold text-accent">
            Admin Panel
          </span>
        </div>
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-sm font-['JetBrains_Mono'] text-sm transition-colors",
                  isActive
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 mt-auto border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-sm font-['JetBrains_Mono'] text-sm transition-colors text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
