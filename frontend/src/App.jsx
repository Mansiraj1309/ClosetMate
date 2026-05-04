import React, { useState, useEffect } from 'react';
import API_BASE from './api';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useSearchParams } from 'react-router-dom';
import { Sparkles, Shirt, Calendar, ShoppingBag, PartyPopper, TrendingUp, TrendingDown, AlertCircle, CloudSun, Loader, BarChart2, CalendarDays, Menu, X as XIcon } from 'lucide-react';
import Wardrobe from './pages/Wardrobe';
import Stylist from './pages/Stylist';
import AuthPage from './pages/AuthPage';
import OutfitCalendar from './pages/OutfitCalendar';
import Analytics from './pages/Analytics';
import Community from './pages/Community';
import ProfileMenu from './components/ProfileMenu';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WeatherProvider, useWeather } from './context/WeatherContext';
import './index.css';

// Helper: Get upcoming Indian festivals & global events
const getUpcomingEvents = () => {
    const now = new Date();
    const year = now.getFullYear();
    const events = [
        { name: 'Holi', date: new Date(year, 2, 14), style: 'ethnic', tip: 'Wear old white clothes you don\'t mind getting colorful!' },
        { name: 'Eid', date: new Date(year, 2, 31), style: 'ethnic', tip: 'Elegant kurta or sherwani with subtle accessories.' },
        { name: 'Raksha Bandhan', date: new Date(year, 7, 9), style: 'ethnic', tip: 'Traditional ethnic wear — bright colors work great.' },
        { name: 'Independence Day', date: new Date(year, 7, 15), style: 'smart-casual', tip: 'Tri-color themed outfit or crisp formals.' },
        { name: 'Dussehra', date: new Date(year, 9, 2), style: 'ethnic', tip: 'Festive kurta with churidar or a vibrant saree.' },
        { name: 'Diwali', date: new Date(year, 9, 20), style: 'ethnic', tip: 'Go all out — gold accents, rich fabrics, statement jewelry.' },
        { name: 'Christmas', date: new Date(year, 11, 25), style: 'party', tip: 'Red, green or sparkly party outfit!' },
        { name: 'New Year\'s Eve', date: new Date(year, 11, 31), style: 'party', tip: 'Your best party look — sequins, black, or metallics.' },
    ];
    return events.filter(e => e.date >= now).slice(0, 3);
};

// Weather condition to outfit emoji
const weatherToEmoji = (main) => {
    const map = { Clear: '☀️', Clouds: '⛅', Rain: '🌧️', Drizzle: '🌦️', Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️', Haze: '🌫️', Fog: '🌫️' };
    return map[main] || '🌤️';
};

// WeatherCard component — reads from shared WeatherContext (no duplicate fetch)
const WeatherCard = () => {
    const { weather, loading, error } = useWeather();

    if (loading) return (
        <div className="glass-card feature-card weather-card">
            <div className="card-header">
                <CloudSun className="card-icon highlight" />
                <h3>Today's Weather</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <Loader size={16} className="spin-anim" /> Detecting location…
            </div>
        </div>
    );

    if (error || !weather) return null;

    const temp = Math.round(weather.main.temp);
    const feelsLike = Math.round(weather.main.feels_like);
    const condition = weather.weather[0].main;
    const description = weather.weather[0].description;
    const city = weather.name;
    const emoji = weatherToEmoji(condition);

    const stylistPrompt = `Outdoor casual outfit for ${temp}°C ${description} weather in ${city} today`;

    return (
        <div className="glass-card feature-card weather-card">
            <div className="card-header">
                <CloudSun className="card-icon highlight" />
                <h3>Today's Weather</h3>
            </div>
            <div className="weather-body">
                <div className="weather-main">
                    <span className="weather-emoji">{emoji}</span>
                    <div className="weather-temp-block">
                        <span className="weather-temp">{temp}°C</span>
                        <span className="weather-desc">{description}</span>
                        <span className="weather-city">📍 {city}</span>
                    </div>
                </div>
                <div className="weather-feels">
                    <span>Feels like <strong>{feelsLike}°C</strong></span>
                    <span>Humidity <strong>{weather.main.humidity}%</strong></span>
                </div>
                <Link
                    to={`/stylist?occasion=${encodeURIComponent(stylistPrompt)}`}
                    className="cta-button secondary-btn weather-style-btn"
                    style={{ textDecoration: 'none', fontSize: '0.85rem', padding: '0.55rem 1rem' }}
                >
                    <Sparkles size={15} /> Style Me for Today
                </Link>
            </div>
        </div>
    );
};

// Dashboard Component
const Dashboard = () => {
    const { user, token } = useAuth();
    const [stats, setStats] = useState({
        totalItems: 0, totalCategories: 0, categoryBreakdown: {},
        mostWorn: [], leastWorn: [], unusedItems: [], unusedCount: 0, seasonBreakdown: {}
    });
    const upcomingEvents = getUpcomingEvents();

    useEffect(() => {
        if (token) {
            fetch(`${API_BASE}/api/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.ok ? res.json() : Promise.reject())
                .then(data => setStats(data))
                .catch(() => { });
        }
    }, [token]);

    return (
        <main className="main-content">
            <header className="hero-section">
                <h1 className="gradient-text">
                    {user?.name ? `Hey ${user.name.split(' ')[0]}, look great today.` : 'Unlock Your Perfect Look.'}
                </h1>
                <p className="subtitle">Let AI curate your daily outfits based on your actual wardrobe and events.</p>
                <div className="hero-buttons">
                    <Link to="/wardrobe" className="cta-button" style={{ textDecoration: 'none' }}>
                        <Shirt size={18} /> View My Wardrobe
                    </Link>
                    <Link to="/stylist" className="cta-button secondary-btn" style={{ textDecoration: 'none' }}>
                        <Sparkles size={18} /> Ask AI Stylist
                    </Link>
                </div>
            </header>

            {/* Weather Card */}
                <WeatherCard />

            <section className="dashboard-grid">
                {/* Wardrobe Stats Card */}
                <div className="glass-card feature-card">
                    <div className="card-header">
                        <Shirt className="card-icon" />
                        <h3>Digital Closet</h3>
                    </div>
                    <div className="stats-container">
                        <div className="stat-box">
                            <span className="stat-number">{stats.totalItems}</span>
                            <span className="stat-label">Items</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-number">{stats.totalCategories}</span>
                            <span className="stat-label">Categories</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-number">{stats.unusedCount || 0}</span>
                            <span className="stat-label">Never Worn</span>
                        </div>
                    </div>
                    {Object.keys(stats.categoryBreakdown).length > 0 && (
                        <div className="category-pills">
                            {Object.entries(stats.categoryBreakdown).map(([cat, count]) => (
                                <span key={cat} className="tag">{cat}: {count}</span>
                            ))}
                        </div>
                    )}
                    {Object.keys(stats.seasonBreakdown || {}).length > 0 && (
                        <div className="category-pills" style={{ marginTop: '0.5rem' }}>
                            {Object.entries(stats.seasonBreakdown).map(([season, count]) => (
                                <span key={season} className="tag season-tag">{season}: {count}</span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Most Worn Items */}
                {stats.mostWorn?.length > 0 && (
                    <div className="glass-card feature-card">
                        <div className="card-header">
                            <TrendingUp className="card-icon highlight" />
                            <h3>Most Worn</h3>
                        </div>
                        <div className="analytics-items">
                            {stats.mostWorn.map(item => (
                                <div key={item._id} className="analytics-item">
                                    <img src={item.imageUrl} alt={item.name || item.category} className="analytics-thumb" />
                                    <div className="analytics-info">
                                        <span className="analytics-name">{item.name || item.category}</span>
                                        <span className="analytics-meta">{item.category}{item.type ? ` · ${item.type}` : ''}</span>
                                        <span className="analytics-wear-count">{item.wearCount}× worn</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Least Worn / Unused Items */}
                {(stats.leastWorn?.length > 0 || stats.unusedItems?.length > 0) && (
                    <div className="glass-card feature-card">
                        <div className="card-header">
                            <AlertCircle className="card-icon" style={{ color: '#f59e0b' }} />
                            <h3>Needs Attention</h3>
                        </div>
                        {stats.unusedItems?.length > 0 && (
                            <>
                                <p className="analytics-subtitle">Never worn ({stats.unusedCount} total)</p>
                                <div className="analytics-items">
                                    {stats.unusedItems.map(item => (
                                        <div key={item._id} className="analytics-item faded">
                                            <img src={item.imageUrl} alt={item.name || item.category} className="analytics-thumb" />
                                            <div className="analytics-info">
                                                <span className="analytics-name">{item.name || item.category}</span>
                                                <span className="analytics-meta">{item.category}{item.color ? ` · ${item.color}` : ''}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        {stats.leastWorn?.length > 0 && (
                            <>
                                <p className="analytics-subtitle" style={{ marginTop: '0.75rem' }}>Least worn</p>
                                <div className="analytics-items">
                                    {stats.leastWorn.map(item => (
                                        <div key={item._id} className="analytics-item">
                                            <img src={item.imageUrl} alt={item.name || item.category} className="analytics-thumb" />
                                            <div className="analytics-info">
                                                <span className="analytics-name">{item.name || item.category}</span>
                                                <span className="analytics-meta">{item.category} · {item.wearCount}× worn</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Upcoming Events & Festivals Card */}
                <div className="glass-card feature-card events-card">
                    <div className="card-header">
                        <Calendar className="card-icon highlight" />
                        <h3>Upcoming Festivals & Events</h3>
                    </div>
                    {upcomingEvents.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No upcoming events found.</p>
                    ) : (
                        <ul className="event-list">
                            {upcomingEvents.map((event, idx) => (
                                <li key={idx} className="event-item-card">
                                    <div className="event-left">
                                        <PartyPopper size={18} className="event-icon" />
                                        <div>
                                            <span className="event-name">{event.name}</span>
                                            <span className="event-date">
                                                {event.date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                    <Link
                                        to={`/stylist?occasion=${encodeURIComponent(event.name + ' festival - ' + event.style + ' style')}`}
                                        className="event-style-btn"
                                    >
                                        Style Me
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* AI Quick Suggestions Card */}
                <div className="glass-card feature-card ai-card">
                    <div className="card-header">
                        <Sparkles className="card-icon highlight" />
                        <h3>Style Ideas</h3>
                    </div>
                    <p className="ai-card-desc">Tap a quick prompt to get instant AI outfit recommendations.</p>
                    <div className="quick-prompts">
                        <Link to="/stylist?occasion=casual%20day%20at%20home" className="quick-prompt-chip">🏠 Casual day at home</Link>
                        <Link to="/stylist?occasion=outdoor%20brunch%20with%20friends" className="quick-prompt-chip">☀️ Outdoor brunch</Link>
                        <Link to="/stylist?occasion=important%20office%20meeting" className="quick-prompt-chip">💼 Office meeting</Link>
                        <Link to="/stylist?occasion=romantic%20dinner%20date" className="quick-prompt-chip">🌹 Dinner date</Link>
                        <Link to="/stylist?occasion=Holi%20festival%20-%20ethnic%20style" className="quick-prompt-chip">🎨 Holi festival</Link>
                        <Link to="/stylist?occasion=gothic%20party%20night" className="quick-prompt-chip">🖤 Gothic night</Link>
                    </div>
                </div>

                {/* Quick Actions Card */}
                <div className="glass-card feature-card">
                    <div className="card-header">
                        <ShoppingBag className="card-icon" />
                        <h3>Quick Actions</h3>
                    </div>
                    <ul className="event-list">
                        <li>
                            <div className="event-dot"></div>
                            <Link to="/wardrobe" style={{ color: 'inherit', textDecoration: 'none' }}>Add clothes to your wardrobe</Link>
                        </li>
                        <li>
                            <div className="event-dot"></div>
                            <Link to="/stylist" style={{ color: 'inherit', textDecoration: 'none' }}>Ask AI for outfit ideas</Link>
                        </li>
                        <li>
                            <div className="event-dot"></div>
                            <Link to="/calendar" style={{ color: 'inherit', textDecoration: 'none' }}>View outfit calendar</Link>
                        </li>
                        <li>
                            <div className="event-dot"></div>
                            <Link to="/analytics" style={{ color: 'inherit', textDecoration: 'none' }}>Wardrobe analytics</Link>
                        </li>
                        <li>
                            <div className="event-dot"></div>
                            <Link to="/community" style={{ color: 'inherit', textDecoration: 'none' }}>Community Inspiration</Link>
                        </li>
                        <li>
                            <div className="event-dot"></div>
                            <Link to="/stylist?occasion=what%20should%20I%20wear%20today" style={{ color: 'inherit', textDecoration: 'none' }}>What should I wear today?</Link>
                        </li>
                    </ul>
                </div>
            </section>
        </main>
    );
};

// Navigation Component
const Navigation = () => {
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

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
    return (
        <div className="app-container">
            <Navigation />
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/wardrobe" element={<Wardrobe />} />
                <Route path="/stylist" element={<Stylist />} />
                <Route path="/calendar" element={<OutfitCalendar />} />
                <Route path="/community" element={<Community />} />
                <Route path="/analytics" element={<Analytics />} />
            </Routes>
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
        <AuthProvider>
            <WeatherProvider>
                <Router>
                    <AppRouter />
                </Router>
            </WeatherProvider>
        </AuthProvider>
    );
}

export default App;
