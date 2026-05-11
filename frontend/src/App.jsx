import React, { useState, useEffect } from 'react';
import API_BASE from './api';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useSearchParams } from 'react-router-dom';
import { Sparkles, Shirt, Calendar, ShoppingBag, PartyPopper, TrendingUp, AlertCircle, CloudSun, Loader, Menu, X as XIcon, Sun, Moon } from 'lucide-react';
import Wardrobe from './pages/Wardrobe';
import Stylist from './pages/Stylist';
import AuthPage from './pages/AuthPage';
import OutfitCalendar from './pages/OutfitCalendar';
import Analytics from './pages/Analytics';
import Community from './pages/Community';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import BottomNav from './components/BottomNav';
import FloatingAddButton from './components/FloatingAddButton';
import Header from './components/Header';
import ProfileMenu from './components/ProfileMenu';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WeatherProvider, useWeather } from './context/WeatherContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import './index.css';

// Navigation Component
const Navigation = () => {
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    // Close menu when route changes
    useEffect(() => { setMenuOpen(false); }, [location.pathname]);

    const navLinks = [
        { to: '/', label: 'Dashboard' },
        { to: '/wardrobe', label: 'Wardrobe' },
        { to: '/stylist', label: 'AI Stylist' },
        { to: '/calendar', label: 'Calendar' },
        { to: '/community', label: 'Community' },
        { to: '/analytics', label: 'Analytics' },
    ];

    return (
        <nav className={`glass-nav ${menuOpen ? 'nav-open' : ''}`}>
            <div className="nav-top-row">
                <Link to="/" className="logo" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Sparkles className="logo-icon" size={24} />
                    <span>ClosetMate</span>
                </Link>
                <div className="nav-links nav-links-desktop">
                    {navLinks.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`nav-btn ${location.pathname === link.to ? 'active' : ''}`}
                        >{link.label}</Link>
                    ))}
                </div>
                <div className="nav-right">
                    <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle theme">
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <ProfileMenu />
                    <button
                        className="hamburger-btn"
                        onClick={() => setMenuOpen(o => !o)}
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? <XIcon size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile dropdown */}
            {menuOpen && (
                <div className="nav-mobile-menu">
                    {navLinks.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`nav-mobile-link ${location.pathname === link.to ? 'active' : ''}`}
                        >{link.label}</Link>
                    ))}
                </div>
            )}
        </nav>
    );
};

// Protected App Shell — only visible when logged in
const AppShell = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="app-container">
            {isMobile ? <Header /> : <Navigation />}
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/wardrobe" element={<Wardrobe />} />
                <Route path="/stylist" element={<Stylist />} />
                <Route path="/calendar" element={<OutfitCalendar />} />
                <Route path="/community" element={<Community />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/profile" element={<Profile />} />
            </Routes>
            {isMobile && <BottomNav />}
            {isMobile && <FloatingAddButton />}
        </div>
    );
};

// Root App — decides between Auth page and main app
const AppRouter = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="auth-page">
                <div className="auth-brand">
                    <Sparkles size={40} className="auth-logo-icon" />
                    <h1 className="gradient-text">ClosetMate</h1>
                    <p className="auth-tagline">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <AuthPage />;
    }

    return <AppShell />;
};

// Main App Wrapper
function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <WeatherProvider>
                    <Router>
                        <AppRouter />
                    </Router>
                </WeatherProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
