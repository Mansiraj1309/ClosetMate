import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Sparkles, Shirt, Calendar, Upload } from 'lucide-react';
import Wardrobe from './pages/Wardrobe';
import './index.css';

// We extract the original Dashboard into its own component
const Dashboard = () => {
    return (
        <main className="main-content">
            <header className="hero-section">
                <h1 className="gradient-text">Unlock Your Perfect Look.</h1>
                <p className="subtitle">Let AI curate your daily outfits based on your actual wardrobe and events.</p>
                <Link to="/wardrobe" className="cta-button" style={{ textDecoration: 'none' }}>
                    <Shirt size={18} /> View My Wardrobe
                </Link>
            </header>

            <section className="dashboard-grid">
                {/* AI Suggestion Card */}
                <div className="glass-card feature-card ai-card">
                    <div className="card-header">
                        <Sparkles className="card-icon highlight" />
                        <h3>Today's AI Pick</h3>
                    </div>
                    <p>Smart casual for the team meeting.</p>
                    <div className="placeholder-image ai-demo-img"></div>
                </div>

                {/* Wardrobe Stats Card */}
                <div className="glass-card feature-card">
                    <div className="card-header">
                        <Shirt className="card-icon" />
                        <h3>Digital Closet</h3>
                    </div>
                    <div className="stats-container">
                        <div className="stat-box">
                            <span className="stat-number">--</span>
                            <span className="stat-label">Items</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-number">--</span>
                            <span className="stat-label">Outfits</span>
                        </div>
                    </div>
                </div>

                {/* Upcoming Event Card */}
                <div className="glass-card feature-card">
                    <div className="card-header">
                        <Calendar className="card-icon" />
                        <h3>Upcoming Events</h3>
                    </div>
                    <ul className="event-list">
                        <li>
                            <div className="event-dot"></div>
                            <span>Dinner Party (Friday, 8pm)</span>
                        </li>
                        <li>
                            <div className="event-dot"></div>
                            <span>Outdoor Festival (Sunday)</span>
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

    return (
        <nav className="glass-nav">
            <div className="logo">
                <Sparkles className="logo-icon" size={24} />
                <span>ClosetMate</span>
            </div>
            <div className="nav-links">
                <Link to="/" className={`nav-btn ${location.pathname === '/' ? 'active' : ''}`}>Dashboard</Link>
                <Link to="/wardrobe" className={`nav-btn ${location.pathname === '/wardrobe' ? 'active' : ''}`}>Wardrobe</Link>
                <button className="nav-btn" disabled>AI Stylist (Soon)</button>
            </div>
            <div className="profile-placeholder"></div>
        </nav>
    );
};

// Main App Wrapper
function App() {
    return (
        <Router>
            <div className="app-container">
                <Navigation />
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/wardrobe" element={<Wardrobe />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
