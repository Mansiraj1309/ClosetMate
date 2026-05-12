import React, { useState, useEffect, useRef } from 'react';
import API_BASE from '../api';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Loader, ShoppingBag, Zap, CalendarCheck, CheckCircle, CloudSun, PlaneTakeoff, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWeather } from '../context/WeatherContext';
import { Share } from '@capacitor/share';
import './Stylist.css';

const QUICK_PROMPTS = [
    { emoji: '✨', label: 'Surprise me with a vibe' },
    { emoji: '😎', label: 'Confident & Bold' },
    { emoji: '☁️', label: 'Comfortable & Chill' },
    { emoji: '👑', label: 'Rich & Elegant' },
    { emoji: '🎓', label: 'College look' },
    { emoji: '🌹', label: 'Date night' },
    { emoji: '💼', label: 'Office' },
    { emoji: '🎉', label: 'Party' },
];

const MOOD_OPTIONS = ['Confident', 'Cute', 'Comfortable', 'Rich vibe', 'Elegant', 'Boss mode', 'Chill', 'Date ready'];
const OCCASION_OPTIONS = ['Casual', 'Office', 'Business', 'Party', 'Wedding', 'Date Night', 'Festival', 'Travel', 'Gym', 'College'];
const WEATHER_OPTIONS = ['All Season', 'Summer', 'Winter', 'Rainy'];
const STYLE_OPTIONS = ['', 'Minimal', 'Streetwear', 'Sporty', 'Elegant', 'Vintage', 'Classic', 'Boho', 'Formal', 'Casual'];

// Map outfit breakdown slot → display label
const SLOT_LABELS = { top: '👕 Top', bottom: '👖 Bottom', shoes: '👟 Shoes', outerwear: '🧥 Outerwear', accessory: '💍 Accessory' };

const Stylist = () => {
    const { token } = useAuth();
    const { weather, season: liveSeason } = useWeather();
    const [searchParams] = useSearchParams();

    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            type: 'ai',
            text: "Hello! I'm your AI Stylist. Tell me what you're dressing for today, or ask me to help you pack for a trip!",
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Handle deep links (e.g., from Dashboard)
    useEffect(() => {
        const fromUrl = searchParams.get('occasion');
        if (fromUrl) {
            handleSend(fromUrl);
        }
    }, [searchParams]);

    const addMessage = (msg) => {
        setMessages(prev => [...prev, { ...msg, id: Date.now(), timestamp: new Date() }]);
    };

    const callStylist = async (text) => {
        setIsTyping(true);
        setError('');
        
        const liveWeatherContext = weather
            ? `Current weather: ${Math.round(weather.main.temp)}°C, ${weather.weather[0].description} in ${weather.name}.`
            : '';
        
        const fullPrompt = `${text}. ${liveWeatherContext}`;

        try {
            // Check if user is asking for packing list
            const isPackingRequest = text.toLowerCase().includes('pack') || text.toLowerCase().includes('trip') || text.toLowerCase().includes('travel');
            
            let endpoint = `${API_BASE}/api/stylist/recommend`;
            let body = { occasion: fullPrompt, season: liveSeason };

            if (isPackingRequest) {
                // For packing, we'll try to extract destination/duration if possible, 
                // but for now we'll just use a general "packing-list" logic or stick to recommendations.
                // Let's stick to the recommendation endpoint but hint it's a packing list
                body.isPacking = true;
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body),
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to get recommendation');

            addMessage({
                type: 'ai',
                text: data.rationale,
                recommendation: data
            });
        } catch (err) {
            addMessage({ type: 'ai', text: "Sorry, I ran into an error. Please try again!", isError: true });
            setError(err.message);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSend = (text = inputValue) => {
        const cleanText = typeof text === 'string' ? text.trim() : inputValue.trim();
        if (!cleanText) return;

        addMessage({ type: 'user', text: cleanText });
        if (typeof text === 'string') setInputValue('');
        else setInputValue('');
        
        callStylist(cleanText);
    };

    return (
        <div className="stylist-chat-page">
            <header className="chat-header">
                <div className="header-content">
                    <Sparkles className="highlight" size={24} />
                    <div>
                        <h1>AI Stylist</h1>
                        <span className="online-status">Online & Ready</span>
                    </div>
                </div>
                {weather && (
                    <div className="header-weather">
                        <CloudSun size={14} />
                        <span>{Math.round(weather.main.temp)}°C</span>
                    </div>
                )}
            </header>

            <div className="chat-messages">
                {messages.map((msg) => (
                    <div key={msg.id} className={`message-wrapper ${msg.type}`}>
                        <div className={`message-bubble ${msg.type === 'ai' ? 'glass-card' : ''}`}>
                            <p>{msg.text}</p>
                            
                            {msg.recommendation && (
                                <RecommendationCard 
                                    recommendation={msg.recommendation} 
                                    token={token}
                                />
                            )}
                        </div>
                        <span className="message-time">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                ))}
                {isTyping && (
                    <div className="message-wrapper ai">
                        <div className="message-bubble glass-card typing-bubble">
                            <span className="dot"></span>
                            <span className="dot"></span>
                            <span className="dot"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-container glass-card">
                <div className="quick-suggestions">
                    {QUICK_PROMPTS.slice(0, 8).map(qp => (
                        <button key={qp.label} onClick={() => handleSend(qp.label)} className="suggestion-chip">
                            {qp.emoji} {qp.label}
                        </button>
                    ))}
                    <div className="mood-divider"></div>
                    {MOOD_OPTIONS.slice(0, 4).map(mood => (
                        <button key={mood} onClick={() => handleSend(`Style me for a ${mood} mood`)} className="suggestion-chip mood-chip">
                             ✨ {mood}
                        </button>
                    ))}
                </div>
                <form className="chat-input-form" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                    <input 
                        type="text" 
                        placeholder="Ask me anything about fashion..." 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isTyping}
                    />
                    <button type="submit" className="send-btn" disabled={!inputValue.trim() || isTyping}>
                        <Zap size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

// Helper Sub-component for Recommendation Cards in Chat
const RecommendationCard = ({ recommendation, token }) => {
    const [logSuccess, setLogSuccess] = useState(false);
    const [logLoading, setLogLoading] = useState(false);
    const [shareSuccess, setShareSuccess] = useState(false);
    const [shareLoading, setShareLoading] = useState(false);

    const handleShareToCommunity = async () => {
        setShareLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/community`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    items: recommendation.outfit.map(i => i._id),
                    occasion: recommendation.occasion || 'AI Recommended Look',
                    description: recommendation.rationale
                }),
            });
            if (res.ok) {
                setShareSuccess(true);
                setTimeout(() => setShareSuccess(false), 3000);
            }
        } catch (err) {
            console.error('Error sharing to community:', err);
        } finally {
            setShareLoading(false);
        }
    };

    const handleLog = async () => {
        setLogLoading(true);
        try {
            const itemIds = recommendation.outfit.map(i => i._id);
            const res = await fetch(`${API_BASE}/api/logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    date: new Date().toISOString().split('T')[0],
                    occasion: 'AI Recommendation',
                    itemIds,
                }),
            });
            if (res.ok) {
                setLogSuccess(true);
                setTimeout(() => setLogSuccess(false), 3000);
            }
        } catch (err) { console.error(err); }
        finally { setLogLoading(false); }
    };

    return (
        <div className="chat-rec-card fadeIn">
            <div className="rec-grid">
                {recommendation.outfit.map((item, idx) => (
                    <div key={item._id} className="rec-item">
                        <img src={item.imageUrl} alt="outfit item" />
                        <span className="rec-item-label">{item.type || item.category}</span>
                    </div>
                ))}
            </div>
            <div className="rec-actions">
                <button className="rec-action-btn" onClick={handleLog} disabled={logLoading}>
                    {logSuccess ? <><CheckCircle size={14} /> Logged</> : <><CalendarCheck size={14} /> Log Outfit</>}
                </button>
                <button className={`rec-action-btn ${shareSuccess ? 'success' : ''}`} onClick={handleShareToCommunity} disabled={shareLoading}>
                    {shareSuccess ? <><CheckCircle size={14} /> Shared</> : <><Compass size={14} /> Share to Community</>}
                </button>
                <button className="rec-action-btn secondary" onClick={async () => {
                    try {
                        await Share.share({
                            title: 'ClosetMate Look',
                            text: `Check out this ${recommendation.occasion || 'outfit'} on ClosetMate!`,
                            url: 'https://closetmate-app.vercel.app',
                            dialogTitle: 'Share Recommendation',
                        });
                    } catch (err) {
                        console.error('Error sharing:', err);
                        navigator.clipboard.writeText('https://closetmate-app.vercel.app');
                        alert('Link copied to clipboard!');
                    }
                }}>
                    <Share2 size={14} /> System Share
                </button>
            </div>
        </div>
    );
};

export default Stylist;
