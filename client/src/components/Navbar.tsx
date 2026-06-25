import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { Code2, Home, ChevronDown, Settings, Edit3, LogOut } from "lucide-react";
import Avatar from "./Avatar";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const hiddenRoutes = ["/login", "/register", "/profile/edit"];
  if (!isAuthenticated || hiddenRoutes.includes(location.pathname)) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
        {/* Left: Logo */}
        <NavLink to="/" className="flex items-center gap-2">
          <Code2 size={18} className="text-accent" />
          <span className="font-['Barlow_Condensed'] font-extrabold text-lg tracking-widest uppercase text-foreground">
            Code<span className="text-accent">Duel</span>
          </span>
        </NavLink>

        {/* Middle: Home Icon */}
        <div className="flex items-center">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-2 transition-colors px-4 py-2 rounded-full ${
                isActive ? "text-accent bg-accent/10" : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <Home size={18} />
          </NavLink>
        </div>

        {/* Right: Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
          >
            {user && <Avatar user={user} size="sm" />}
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
                  onClick={() => { setMenuOpen(false); navigate("/settings"); }}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary/80 flex items-center gap-3 font-['JetBrains_Mono'] transition-colors"
                >
                  <Settings size={14} className="text-muted-foreground" /> Settings
                </button>
                <button
                  onClick={() => { setMenuOpen(false); navigate("/profile/edit"); }}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary/80 flex items-center gap-3 font-['JetBrains_Mono'] transition-colors"
                >
                  <Edit3 size={14} className="text-muted-foreground" /> Edit Profile
                </button>
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
  );
}
