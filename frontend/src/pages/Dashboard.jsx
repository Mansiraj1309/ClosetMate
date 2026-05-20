import React, { useState, useEffect, useMemo } from 'react';
import API_BASE from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Sparkles, Shirt, Calendar, ShoppingBag, PartyPopper, 
    TrendingUp, AlertCircle, CloudSun, Loader, 
    ChevronRight, Heart, Zap, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWeather } from '../context/WeatherContext';
import './Dashboard.css';

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

const weatherToEmoji = (main) => {
    const map = { Clear: '☀️', Clouds: '⛅', Rain: '🌧️', Drizzle: '🌦️', Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️', Haze: '🌫️', Fog: '🌫️' };
    return map[main] || '🌤️';
};

const Dashboard = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const { weather, loading: weatherLoading } = useWeather();
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

    // Dynamic recommendation based on weather + wardrobe
    const dynamicRec = useMemo(() => {
        const hour = new Date().getHours();
        const temp = weather?.main?.temp ? Math.round(weather.main.temp) : null;
        const weatherMain = weather?.weather?.[0]?.main || '';
        const weatherDesc = weather?.weather?.[0]?.description || 'clear skies';
        const city = weather?.name || 'your city';

        // Pick occasion label based on time of day
        let timeLabel = 'Daily Look';
        let occasionPrompt = 'casual daily outfit';
        if (hour < 10) { timeLabel = 'Morning Look'; occasionPrompt = 'fresh morning casual outfit'; }
        else if (hour < 13) { timeLabel = 'Mid-Day Outfit'; occasionPrompt = 'comfortable mid-day outfit'; }
        else if (hour < 17) { timeLabel = 'Afternoon Vibe'; occasionPrompt = 'relaxed afternoon casual outfit'; }
        else if (hour < 20) { timeLabel = 'Evening Look'; occasionPrompt = 'smart casual evening outfit'; }
        else { timeLabel = 'Night Out Look'; occasionPrompt = 'stylish night out outfit'; }

        // Pick style hint based on weather
        let styleHint = '';
        let matchScore = 91;
        if (temp !== null && temp >= 32) { styleHint = 'Light fabrics are key in this heat.'; matchScore = 96; }
        else if (temp !== null && temp >= 26) { styleHint = 'Perfect weather for breathable fits.'; matchScore = 93; }
        else if (temp !== null && temp >= 20) { styleHint = 'A light layer would work great today.'; matchScore = 90; }
        else if (temp !== null && temp < 20) { styleHint = 'Layer up — it\'s a bit cool today.'; matchScore = 88; }
        if (weatherMain === 'Rain' || weatherMain === 'Drizzle') { styleHint = 'Avoid white — rain is expected!'; matchScore = 85; }
        if (weatherMain === 'Clear') { matchScore += 3; }

        // Use least-worn item as personalized suggestion
        const leastWornItem = stats.leastWorn?.[0];
        const mostWornItem = stats.mostWorn?.[0];

        let reasoning = '';
        if (leastWornItem && mostWornItem) {
            reasoning = <>It's {weatherDesc} in <strong>{city}</strong>. Try pairing your <strong>{leastWornItem.name}</strong> today — it's been sitting unused! Great chance to give it some love.</>;
        } else if (leastWornItem) {
            reasoning = <>It's {weatherDesc} in <strong>{city}</strong>. Your <strong>{leastWornItem.name}</strong> hasn't been worn recently — today's a great day to try it!</>;
        } else if (temp !== null) {
            reasoning = <>With {temp}°C and {weatherDesc} in <strong>{city}</strong>, {styleHint} Let the AI build you the perfect outfit from your closet.</>;
        } else {
            reasoning = <>Ask the AI Stylist to build you a complete outfit recommendation tailored to today's occasion and weather.</>;
        }

        const fullOccasionLink = `/stylist?occasion=${encodeURIComponent(`${occasionPrompt} for ${temp ? temp + '°C' : 'current weather'} ${weatherDesc} in ${city}`)}`;

        return { timeLabel, occasionPrompt, matchScore, styleHint, reasoning, fullOccasionLink, temp, weatherDesc, city };
    }, [weather, stats]);

    // Personality Calculation
    const stylePersonality = useMemo(() => {
        if (stats.totalItems === 0) return "Fresh Starter";
        const topCat = Object.entries(stats.categoryBreakdown).sort((a,b) => b[1]-a[1])[0]?.[0];
        if (topCat === 'Ethnic Wear') return "Ethnic Royal";
        if (topCat === 'Activewear') return "Sporty Casual";
        if (topCat === 'Accessories') return "Detail Oriented";
        const avgWears = stats.totalItems > 0 ? (stats.mostWorn.reduce((s,i) => s + i.wearCount, 0) / Math.max(stats.mostWorn.length, 1)) : 0;
        if (avgWears > 5) return "Minimalist Chic";
        return "Versatile Stylist";
    }, [stats]);

    return (
        <main className="dashboard-page" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
            {/* 1. Hero: Dynamic Today's Recommendation */}
            <section className="recommendation-hero">
                <div className="hero-content">
                    <div className="hero-badge">
                        <Sparkles size={14} /> <span>AI Pick for Today</span>
                    </div>
                    <h1 className="gradient-text">What to wear today?</h1>
                    
                    <div className="recommendation-card-large glass-card">
                        <div className="rec-info">
                            <div className="rec-header">
                                <div className="rec-title-group">
                                    <h3>{dynamicRec.timeLabel}</h3>
                                    <p className="rec-meta">
                                        Based on {dynamicRec.temp ? `${dynamicRec.temp}°C ${dynamicRec.weatherDesc}` : 'local weather'} · {dynamicRec.city}
                                    </p>
                                </div>
                                <div className="rec-confidence">
                                    <Award size={16} /> <span>{dynamicRec.matchScore}% Match</span>
                                </div>
                            </div>
                            
                            <p className="rec-reasoning">{dynamicRec.reasoning}</p>

                            <div className="rec-actions">
                                <Link to={dynamicRec.fullOccasionLink} className="cta-button">
                                    <Zap size={18} /> Style Me Now
                                </Link>
                                <Link to="/stylist?occasion=surprise me with a completely new look" className="cta-button secondary-btn">
                                    Surprise Me
                                </Link>
                            </div>
                        </div>
                        
                        <div className="rec-visual">
                            <div className="visual-stack">
                                <div className="visual-item item-1">
                                    <Shirt size={40} strokeWidth={1} />
                                </div>
                                <div className="visual-item item-2">
                                    <Zap size={30} strokeWidth={1} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Personality & Stats Row */}
            <section className="dashboard-secondary-row">
                <div className="personality-card glass-card" onClick={() => navigate('/stats')}>
                    <div className="p-icon-wrap">
                        <Heart className="p-icon" fill="currentColor" />
                    </div>
                    <div className="p-text">
                        <span className="p-label">Your Style Personality</span>
                        <h3>{stylePersonality}</h3>
                        <p>You prioritize comfort and versatility in your daily looks.</p>
                    </div>
                    <ChevronRight className="p-arrow" />
                </div>

                <div className="weather-quick-card glass-card">
                    {weatherLoading ? (
                        <Loader className="spin" />
                    ) : weather ? (
                        <div className="w-quick-content">
                            <span className="w-emoji">{weatherToEmoji(weather.weather[0].main)}</span>
                            <div className="w-text">
                                <h3>{Math.round(weather.main.temp)}°C</h3>
                                <p>{weather.name}</p>
                            </div>
                        </div>
                    ) : (
                        <p>Weather unavailable</p>
                    )}
                </div>
            </section>

            {/* 3. Main Dashboard Grid (Retaining some old features) */}
            <div className="dashboard-grid">
                {/* Digital Closet Stats */}
                <div className="glass-card feature-card">
                    <div className="card-header">
                        <Shirt className="card-icon" />
                        <h3>Your Digital Closet</h3>
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
                            <span className="stat-label">Unused</span>
                        </div>
                    </div>
                </div>

                {/* Upcoming Events */}
                <div className="glass-card feature-card events-card">
                    <div className="card-header">
                        <Calendar className="card-icon highlight" />
                        <h3>Events & Festivals</h3>
                    </div>
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
                                <Link to={`/stylist?occasion=${encodeURIComponent(event.name)}`} className="event-style-btn">
                                    Style Me
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Quick Prompts */}
                <div className="glass-card feature-card ai-card">
                    <div className="card-header">
                        <Sparkles className="card-icon highlight" />
                        <h3>AI Quick Prompts</h3>
                    </div>
                    <div className="quick-prompts">
                        <Link to="/stylist?occasion=casual" className="quick-prompt-chip">🏠 Casual</Link>
                        <Link to="/stylist?occasion=office" className="quick-prompt-chip">💼 Office</Link>
                        <Link to="/stylist?occasion=date" className="quick-prompt-chip">🌹 Date</Link>
                        <Link to="/stylist?occasion=party" className="quick-prompt-chip">🎉 Party</Link>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-card feature-card">
                    <div className="card-header">
                        <ShoppingBag className="card-icon" />
                        <h3>Quick Actions</h3>
                    </div>
                    <ul className="action-link-list">
                        <li><Link to="/wardrobe">Add new clothes</Link></li>
                        <li><Link to="/calendar">Log today's outfit</Link></li>
                        <li><Link to="/analytics">View wardrobe health</Link></li>
                        <li><Link to="/community">Explore community looks</Link></li>
                    </ul>
                </div>
            </div>
        </main>
    );
};

export default Dashboard;
