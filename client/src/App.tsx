import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import AuthSuccess from "./pages/AuthSuccess";
import ProfileEdit from "./pages/ProfileEdit";
import Settings from "./pages/Settings";
import Navbar from "./components/Navbar";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// A temporary placeholder for the Profile page until we build it
function TempProfile() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl font-['Barlow_Condensed'] uppercase tracking-widest text-foreground">Welcome to your Profile!</h1>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  // Routes where the Navbar is hidden
  const hiddenRoutes = ["/login", "/register", "/profile/edit", "/forgot-password", "/reset-password", "/verify-email"];
  const showNavbar = isAuthenticated && !hiddenRoutes.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth-success" element={<AuthSuccess />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* We will properly protect this route later with Zustand */}
          <Route path="/profile/:username" element={<TempProfile />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
