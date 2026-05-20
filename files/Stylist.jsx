import React, { useState, useEffect, useRef } from 'react';
import API_BASE from '../api';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Loader, ShoppingBag, Zap, CalendarCheck, CheckCircle, CloudSun, Share2, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWeather } from '../context/WeatherContext';
import './Stylist.css';

// ✅ REMOVED: import { Share } from '@capacitor/share'; — crashes on web

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

const Stylist = () => {
    const { token } = useAuth();
    const { weather, season: liveSeason } = useWeather();
    const [searchParams] = useSearchParams();

    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            type: 'ai',
            text: "Hello! I'm your AI Stylist ✨ Tell me what you're dressing for, or say 'Pack for Goa 3 days' for a trip packing list!",
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Handle deep links from Dashboard
    useEffect(() => {
        const fromUrl = searchParams.get('occasion');
        if (fromUrl) {
            handleSend(fromUrl);
        }
    }, [searchParams]);

    const addMessage = (msg) => {
        setMessages(prev => [...prev, { ...msg, id: Date.now(), timestamp: new Date() }]);
    };

    // ✅ FIXED: detect packing requests and call correct endpoint
    const isPackingRequest = (text) => {
        const lower = text.toLowerCase();
        return lower.includes('pack') || lower.includes('trip') || lower.includes('travel') || lower.includes('vacation');
    };

    // ✅ FIXED: extract destination and duration from packing text
    const extractPackingParams = (text) => {
        const durationMatch = text.match(/(\d+)\s*(?:day|days|night|nights)/i);
        const duration = durationMatch ? parseInt(durationMatch[1]) : 3;
        // Remove duration from text to get destination hint
        const destination = text.replace(/pack(?:ing)?\s*(?:for|list)?/gi, '')
            .replace(/\d+\s*(?:day|days|night|nights)/gi, '')
            .replace(/trip|travel|vacation/gi, '')
            .trim() || 'a trip';
        return { destination, duration };
    };

    const callStylist = async (text) => {
        setIsTyping(true);

        const liveWeatherContext = weather
            ? `Current weather: ${Math.round(weather.main.temp)}°C, ${weather.weather[0].description} in ${weather.name}.`
            : '';

        try {
            let endpoint, body;

            if (isPackingRequest(text)) {
                // ✅ FIXED: actually call the packing-list endpoint
                const { destination, duration } = extractPackingParams(text);
                endpoint = `${API_BASE}/api/stylist/packing-list`;
                body = { destination, duration, activities: text };
            } else {
                endpoint = `${API_BASE}/api/stylist/recommend`;
                body = {
                    occasion: `${text}. ${liveWeatherContext}`,
                    season: liveSeason
                };
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

            if (isPackingRequest(text)) {
                addMessage({
                    type: 'ai',
                    text: data.rationale,
                    packingData: data
                });
            } else {
                addMessage({
                    type: 'ai',
                    text: data.rationale,
                    recommendation: data
                });
            }
        } catch (err) {
            console.error('Stylist Error:', err);
            addMessage({ type: 'ai', text: `Sorry, I ran into an issue: ${err.message}. Please try again!`, isError: true });
        } finally {
            setIsTyping(false);
        }
    };

    const handleSend = (text = inputValue) => {
        const cleanText = typeof text === 'string' ? text.trim() : inputValue.trim();
        if (!cleanText) return;
        addMessage({ type: 'user', text: cleanText });
        setInputValue('');
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
                        <span>{Math.round(weather.main.temp)}°C · {weather.name}</span>
                    </div>
                )}
            </header>

            <div className="chat-messages">
                {messages.map((msg) => (
                    <div key={msg.id} className={`message-wrapper ${msg.type}`}>
                        <div className={`message-bubble ${msg.type === 'ai' ? 'glass-card' : ''}`}>
                            <p>{msg.text}</p>

                            {/* ✅ Outfit recommendation card */}
                            {msg.recommendation && (
                                <RecommendationCard
                                    recommendation={msg.recommendation}
                                    token={token}
                                />
                            )}

                            {/* ✅ NEW: Packing list card */}
                            {msg.packingData && (
                                <PackingCard packingData={msg.packingData} />
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
                    {QUICK_PROMPTS.map(qp => (
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
                    <button onClick={() => handleSend('Pack for Goa 3 days beach trip')} className="suggestion-chip pack-chip">
                        ✈️ Pack for a trip
                    </button>
                </div>
                <div className="chat-input-form">
                    <input
                        type="text"
                        placeholder="Ask me anything… or 'Pack for Manali 5 days'"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isTyping && inputValue.trim()) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        disabled={isTyping}
                    />
                    <button
                        type="button"
                        className="send-btn"
                        onClick={() => handleSend()}
                        disabled={!inputValue.trim() || isTyping}
                    >
                        <Zap size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ✅ FIXED RecommendationCard: shows shopping suggestions, fixed Share crash
const RecommendationCard = ({ recommendation, token }) => {
    const [logSuccess, setLogSuccess] = useState(false);
    const [logLoading, setLogLoading] = useState(false);
    const [shareSuccess, setShareSuccess] = useState(false);
    const [shareLoading, setShareLoading] = useState(false);
    const [showShopping, setShowShopping] = useState(false);

    const hasOutfitItems = recommendation.outfit && recommendation.outfit.length > 0;
    const hasShopping = recommendation.shoppingSuggestions && recommendation.shoppingSuggestions.length > 0;

    const handleShareToCommunity = async () => {
        if (!hasOutfitItems) return;
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
        if (!hasOutfitItems) return;
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

    // ✅ FIXED: Web Share API instead of Capacitor
    const handleSystemShare = async () => {
        const shareData = {
            title: 'ClosetMate Look',
            text: `Check out this outfit on ClosetMate!`,
            url: 'https://closet-mate.vercel.app',
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText('https://closet-mate.vercel.app');
                alert('Link copied to clipboard!');
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                navigator.clipboard.writeText('https://closet-mate.vercel.app');
                alert('Link copied to clipboard!');
            }
        }
    };

    return (
        <div className="chat-rec-card fadeIn">
            {/* Outfit grid */}
            {hasOutfitItems ? (
                <div className="rec-grid">
                    {recommendation.outfit.map((item) => (
                        <div key={item._id} className="rec-item">
                            <img src={item.imageUrl} alt={item.type || item.category} />
                            <span className="rec-item-label">{item.type || item.category}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="rec-empty-note">No matching items in your wardrobe for this outfit slot. Check shopping suggestions below!</p>
            )}

            {/* ✅ NEW: Shopping suggestions section */}
            {hasShopping && (
                <div className="shopping-section">
                    <button
                        className="shopping-toggle"
                        onClick={() => setShowShopping(s => !s)}
                    >
                        <ShoppingBag size={14} />
                        {showShopping ? 'Hide' : 'Show'} {recommendation.shoppingSuggestions.length} Shopping Suggestion{recommendation.shoppingSuggestions.length > 1 ? 's' : ''}
                    </button>
                    {showShopping && (
                        <div className="shopping-list">
                            {recommendation.shoppingSuggestions.map((s, i) => (
                                <div key={i} className="shopping-item">
                                    <div className="shopping-item-header">
                                        <span className="shopping-item-name">{s.item}</span>
                                        <span className="shopping-item-price">{s.estimatedPrice}</span>
                                    </div>
                                    <p className="shopping-item-reason">{s.reason}</p>
                                    <div className="shopping-links">
                                        {(s.whereToBuy || []).map((store, j) => (
                                            <a key={j} href={store.url} target="_blank" rel="noopener noreferrer" className="store-link">
                                                {store.name} <ExternalLink size={10} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Action buttons */}
            <div className="rec-actions">
                <button className="rec-action-btn" onClick={handleLog} disabled={logLoading || !hasOutfitItems}>
                    {logSuccess ? <><CheckCircle size={14} /> Logged</> : <><CalendarCheck size={14} /> Log Outfit</>}
                </button>
                <button className={`rec-action-btn ${shareSuccess ? 'success' : ''}`} onClick={handleShareToCommunity} disabled={shareLoading || !hasOutfitItems}>
                    {shareSuccess ? <><CheckCircle size={14} /> Shared</> : <><Zap size={14} /> To Community</>}
                </button>
                <button className="rec-action-btn secondary" onClick={handleSystemShare}>
                    <Share2 size={14} /> Share
                </button>
            </div>
        </div>
    );
};

// ✅ NEW: Packing list card component
const PackingCard = ({ packingData }) => {
    const { packingList, dayByDay, shoppingSuggestions, populatedItems } = packingData;
    const [activeTab, setActiveTab] = useState('list');

    // Build a lookup of id -> item
    const itemMap = {};
    (populatedItems || []).forEach(item => {
        itemMap[item._id.toString()] = item;
    });

    const categoryLabels = {
        tops: '👕 Tops',
        bottoms: '👖 Bottoms',
        shoes: '👟 Shoes',
        outerwearAndAccessories: '🧥 Outerwear & Accessories'
    };

    return (
        <div className="packing-card fadeIn">
            <div className="packing-tabs">
                <button className={`packing-tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>Packing List</button>
                <button className={`packing-tab ${activeTab === 'days' ? 'active' : ''}`} onClick={() => setActiveTab('days')}>Day by Day</button>
                {shoppingSuggestions?.length > 0 && (
                    <button className={`packing-tab ${activeTab === 'shop' ? 'active' : ''}`} onClick={() => setActiveTab('shop')}>🛒 Buy</button>
                )}
            </div>

            {activeTab === 'list' && (
                <div className="packing-list-view">
                    {Object.entries(packingList || {}).map(([cat, ids]) => {
                        if (!ids || ids.length === 0) return null;
                        return (
                            <div key={cat} className="packing-category">
                                <h4>{categoryLabels[cat] || cat}</h4>
                                <div className="packing-items-row">
                                    {ids.map(id => {
                                        const item = itemMap[id];
                                        if (!item) return null;
                                        return (
                                            <div key={id} className="packing-item-chip">
                                                <img src={item.imageUrl} alt={item.name || item.category} />
                                                <span>{item.name || `${item.color} ${item.type || item.category}`}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === 'days' && (
                <div className="day-by-day-view">
                    {(dayByDay || []).map(day => (
                        <div key={day.day} className="day-block">
                            <div className="day-header">
                                <span className="day-number">Day {day.day}</span>
                                <span className="day-theme">{day.theme}</span>
                            </div>
                            <div className="day-items">
                                {(day.outfitIds || []).map(id => {
                                    const item = itemMap[id];
                                    if (!item) return null;
                                    return (
                                        <div key={id} className="day-item-chip">
                                            <img src={item.imageUrl} alt={item.name || item.category} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'shop' && (
                <div className="shopping-list">
                    {(shoppingSuggestions || []).map((s, i) => (
                        <div key={i} className="shopping-item">
                            <div className="shopping-item-header">
                                <span className="shopping-item-name">{s.item}</span>
                                <span className="shopping-item-price">{s.estimatedPrice}</span>
                            </div>
                            <p className="shopping-item-reason">{s.reason}</p>
                            <div className="shopping-links">
                                {(s.whereToBuy || []).map((store, j) => (
                                    <a key={j} href={store.url} target="_blank" rel="noopener noreferrer" className="store-link">
                                        {store.name} <ExternalLink size={10} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Stylist;
