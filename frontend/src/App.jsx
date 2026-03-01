import React from 'react';
import { Sparkles, Shirt, Calendar, Upload } from 'lucide-react';
import './index.css';

function App() {
    return (
        <div className="app-container">
            <nav className="glass-nav">
                <div className="logo">
                    <Sparkles className="logo-icon" size={24} />
                    <span>ClosetMate</span>
                </div>
                <div className="nav-links">
                    <button className="nav-btn active">Dashboard</button>
                    <button className="nav-btn">Wardrobe</button>
                    <button className="nav-btn">AI Stylist</button>
                </div>
                <div className="profile-placeholder"></div>
            </nav>

            <main className="main-content">
                <header className="hero-section">
                    <h1 className="gradient-text">Unlock Your Perfect Look.</h1>
                    <p className="subtitle">Let AI curate your daily outfits based on your actual wardrobe and events.</p>
                    <button className="cta-button">
                        <Upload size={18} /> Add New Item
                    </button>
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
                                <span className="stat-number">42</span>
                                <span className="stat-label">Items</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-number">12</span>
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
        </div>
    );
}

export default App;
