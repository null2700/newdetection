// frontend/src/App.js
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ArticleList from "./pages/ArticleList";
import ArticleDetail from "./pages/ArticleDetail";
import AuthModal from "./pages/AuthModal";
import Profile from "./pages/Profile";
import QuizPage from "./pages/QuizPage";
import Dashboard from "./pages/Dashboard";
import DashboardUser from "./pages/dashboard_user";
import AnalyzePage from "./pages/AnalyzePage";
import LandingPage from "./pages/LandingPage";
import SettingsPage from "./pages/SettingsPage";
import "./App.css";

function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readingStreak, setReadingStreak] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const location = useLocation();
  const profileMenuRef = useRef(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      
      const res = await fetch("http://127.0.0.1:8000/auth/me", { headers, credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        const statsRes = await fetch("http://127.0.0.1:8000/user/stats", { headers, credentials: "include" });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setReadingStreak(statsData.reading_streak || 0);
          setUserPoints(statsData.points || 0);
        }
      }
    } catch (err) {
      console.log("Not authenticated");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("http://127.0.0.1:8000/auth/logout", { method: "POST", credentials: "include" });
      localStorage.removeItem("token");
      setCurrentUser(null);
      setReadingStreak(0);
      setUserPoints(0);
      setShowProfileMenu(false);
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/unbiased-news");
      const data = await res.json();
      setArticles(data.articles || []);
      setError(null);
    } catch (err) {
      setError("Failed to fetch news.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const isLanding = location.pathname === "/";
  const navLinks = [
    { to: "/feed", label: "Feed" },
    { to: "/analyze", label: "Analyze" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/quiz", label: "Quiz" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="text-white font-black text-sm">FF</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
              FairFeed
            </span>
          </Link>

          {/* Center Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === link.to
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <>
                {/* Points */}
                <div className="hidden sm:flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
                  <span className="text-amber-400 text-xs font-bold">⚡ {userPoints} pts</span>
                </div>
                {/* Streak */}
                <div className="hidden sm:flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full">
                  <span className="text-orange-400 text-xs font-bold">🔥 {readingStreak}</span>
                </div>
              </>
            )}

            {/* Refresh */}
            <button
              onClick={fetchNews}
              disabled={loading}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              title="Refresh Feed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-cyan-400" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M4 10a8.001 8.001 0 0113.657-5.657L20 10M4 14a8.001 8.001 0 0013.657 5.657L20 14" />
                </svg>
              )}
            </button>

            {currentUser ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 hover:bg-white/5 px-2 py-1.5 rounded-lg transition-colors border border-white/10"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-300 hidden sm:block">{currentUser.name.split(" ")[0]}</span>
                </button>
                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 bg-[#13131a] border border-white/10 shadow-2xl rounded-xl py-2 z-50"
                    >
                      <div className="px-4 py-2.5 border-b border-white/10">
                        <p className="font-semibold text-white text-sm">{currentUser.name}</p>
                        <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                      </div>
                      {[
                        { label: "My Profile", href: "/profile" },
                        { label: "Settings", href: "/settings" },
                      ].map((item) => (
                        <button
                          key={item.href}
                          onClick={() => { setShowProfileMenu(false); window.location.href = item.href; }}
                          className="w-full text-left px-4 py-2 hover:bg-white/5 text-sm text-gray-300 transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                      <hr className="my-1 border-white/10" />
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 text-sm transition-colors">
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              !authLoading && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-lg font-semibold transition-colors text-sm shadow-lg shadow-cyan-500/20"
                >
                  Sign In
                </button>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {error && (
          <div className="max-w-7xl mx-auto mt-4 px-6">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            <Routes>
              <Route path="/" element={<LandingPage onSignIn={() => setShowAuthModal(true)} currentUser={currentUser} />} />
              <Route path="/feed" element={<ArticleList articles={articles} loading={loading} currentUser={currentUser} />} />
              <Route path="/article" element={<ArticleDetail currentUser={currentUser} />} />
              <Route path="/article/quiz" element={<QuizPage currentUser={currentUser} />} />
              <Route path="/quiz" element={<QuizPage currentUser={currentUser} />} />
              <Route path="/analyze" element={<AnalyzePage currentUser={currentUser} />} />
              <Route path="/dashboard" element={<DashboardUser />} />
              <Route
                path="/profile"
                element={currentUser ? <Profile currentUser={currentUser} /> : (
                  <div className="max-w-xl mx-auto text-center mt-24 px-6">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-white mb-3">Sign in to view your profile</h2>
                    <button onClick={() => setShowAuthModal(true)} className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-3 rounded-xl font-semibold transition-colors">
                      Sign In
                    </button>
                  </div>
                )}
              />
              <Route path="/settings" element={<SettingsPage currentUser={currentUser} />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onAuthSuccess={(user) => { setCurrentUser(user); checkAuth(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;