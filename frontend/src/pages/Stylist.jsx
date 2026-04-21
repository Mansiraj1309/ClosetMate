import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Loader, ShoppingBag, Zap, CalendarCheck, CheckCircle, CloudSun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWeather } from '../context/WeatherContext';
import './Stylist.css';

const QUICK_PROMPTS = [
    { emoji: '☀️', label: 'What should I wear today?' },
    { emoji: '💼', label: 'Office outfit' },
    { emoji: '🌹', label: 'Date night outfit' },
    { emoji: '🎉', label: 'Festival outfit' },
    { emoji: '✈️', label: 'Travel outfit' },
    { emoji: '🎓', label: 'College outfit' },
    { emoji: '🏋️', label: 'Gym outfit' },
    { emoji: '🖤', label: 'Gothic party night' },
];

const OCCASION_OPTIONS = ['Casual', 'Office', 'Business', 'Party', 'Wedding', 'Date Night', 'Festival', 'Travel', 'Gym', 'College'];
const WEATHER_OPTIONS = ['All Season', 'Summer', 'Winter', 'Rainy'];
const STYLE_OPTIONS = ['', 'Minimal', 'Streetwear', 'Sporty', 'Elegant', 'Vintage', 'Classic', 'Boho', 'Formal', 'Casual'];

// Map outfit breakdown slot → display label
const SLOT_LABELS = { top: '👕 Top', bottom: '👖 Bottom', shoes: '👟 Shoes', outerwear: '🧥 Outerwear', accessory: '💍 Accessory' };

const Stylist = () => {
    const { token } = useAuth();
    const { weather, season: liveSeason } = useWeather();
    const [searchParams] = useSearchParams();

    // Free-text mode
    const [occasion, setOccasion] = useState('');

    // Structured generator mode
    const [genOccasion, setGenOccasion] = useState('Casual');
    const [genWeather, setGenWeather] = useState('All Season');
    const [genStyle, setGenStyle] = useState('');

    const [loading, setLoading] = useState(false);
    const [recommendation, setRecommendation] = useState(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('freetext'); // 'freetext' | 'generator'
    const [logLoading, setLogLoading] = useState(false);
    const [logSuccess, setLogSuccess] = useState(false);
    const [loggedOccasion, setLoggedOccasion] = useState('');

    // Auto-populate weather dropdown with live season when weather loads
    useEffect(() => {
        if (liveSeason && liveSeason !== 'All Season') {
            setGenWeather(liveSeason);
        }
    }, [liveSeason]);

    useEffect(() => {
        const fromUrl = searchParams.get('occasion');
        if (fromUrl) {
            setOccasion(fromUrl);
            setActiveTab('freetext');
        }
    }, [searchParams]);

    const callStylist = async (body) => {
        setLoading(true);
        setError('');
        setRecommendation(null);
        setLogSuccess(false);
        setLoggedOccasion(body.occasion || '');
        try {
            const res = await fetch('http://localhost:5001/api/stylist/recommend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to get recommendation');
            setRecommendation(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Build a concise live weather context string to append to AI prompts
    const liveWeatherContext = weather
        ? `Current real-world weather: ${Math.round(weather.main.temp)}°C, ${weather.weather[0].description} in ${weather.name}. Humidity: ${weather.main.humidity}%. Please factor this into your outfit recommendation.`
        : null;

    const handleFreeTextSubmit = (e) => {
        e.preventDefault();
        if (!occasion.trim()) return;
        const fullOccasion = liveWeatherContext
            ? `${occasion}. ${liveWeatherContext}`
            : occasion;
        callStylist({ occasion: fullOccasion, season: liveSeason });
    };

    const handleGeneratorSubmit = (e) => {
        e.preventDefault();
        const basePrompt = `${genOccasion} outfit${genStyle ? ` in ${genStyle} style` : ''}, weather: ${genWeather}`;
        const fullPrompt = liveWeatherContext
            ? `${basePrompt}. ${liveWeatherContext}`
            : basePrompt;
        callStylist({ occasion: fullPrompt, season: genWeather, style: genStyle });
    };

    const handleQuickPrompt = (label) => {
        setOccasion(label);
        setActiveTab('freetext');
        const fullOccasion = liveWeatherContext
            ? `${label}. ${liveWeatherContext}`
            : label;
        callStylist({ occasion: fullOccasion, season: liveSeason });
    };

    // Build a slot→item map from outfitBreakdown + full outfit array
    const outfitSlotMap = {};
    if (recommendation?.outfitBreakdown && recommendation?.outfit) {
        Object.entries(recommendation.outfitBreakdown).forEach(([slot, itemId]) => {
            if (itemId) {
                const found = recommendation.outfit.find(i => String(i._id) === String(itemId));
                if (found) outfitSlotMap[slot] = found;
            }
        });
    }
    const hasSlotMap = Object.keys(outfitSlotMap).length > 0;

    const handleLogOutfit = async () => {
        if (!recommendation?.outfit?.length) return;
        setLogLoading(true);
        try {
            const itemIds = recommendation.outfit.map(i => i._id);
            const res = await fetch('http://localhost:5001/api/logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    date: new Date().toISOString().split('T')[0],
                    occasion: loggedOccasion,
                    itemIds,
                }),
            });
            if (res.ok) {
                setLogSuccess(true);
                setTimeout(() => setLogSuccess(false), 4000);
            }
        } catch (err) {
            console.error('Error logging outfit:', err);
        } finally {
            setLogLoading(false);
        }
    };

    return (
        <div className="stylist-page">
            <header className="stylist-header">
                <Sparkles size={40} className="header-icon" />
                <h1 className="gradient-text">Your Personal AI Stylist</h1>
                <p className="subtitle">Tell me what you're dressing for, and I'll curate the perfect look from your closet.</p>
            </header>

            {/* Live Weather Pill */}
            {weather && (
                <div className="stylist-weather-pill">
                    <CloudSun size={16} />
                    <span>
                        <strong>{Math.round(weather.main.temp)}°C</strong>
                        {' · '}{weather.weather[0].description}
                        {' · '}<span style={{ opacity: 0.75 }}>📍 {weather.name}</span>
                    </span>
                    <span className="weather-pill-badge">{liveSeason}</span>
                    <span className="weather-pill-hint">AI outfit picks will factor in today's weather ✓</span>
                </div>
            )}

            {/* Quick Prompt Buttons */}
            <div className="quick-prompt-row">
                {QUICK_PROMPTS.map(qp => (
                    <button key={qp.label} className="quick-chip" onClick={() => handleQuickPrompt(qp.label)} disabled={loading}>
                        {qp.emoji} {qp.label}
                    </button>
                ))}
            </div>

            {/* Tabs */}
            <div className="stylist-tabs">
                <button className={`tab-btn ${activeTab === 'freetext' ? 'tab-active' : ''}`} onClick={() => setActiveTab('freetext')}>
                    <Sparkles size={14} /> Free Text
                </button>
                <button className={`tab-btn ${activeTab === 'generator' ? 'tab-active' : ''}`} onClick={() => setActiveTab('generator')}>
                    <Zap size={14} /> Outfit Generator
                </button>
            </div>

            <div className="stylist-container">
                {/* Free text input */}
                {activeTab === 'freetext' && (
                    <div className="glass-card input-card">
                        <form onSubmit={handleFreeTextSubmit} className="stylist-form">
                            <input
                                type="text"
                                placeholder="e.g. 'Holi festival - ethnic style' or 'Gothic party night'"
                                value={occasion}
                                onChange={(e) => setOccasion(e.target.value)}
                                className="occasion-input"
                                disabled={loading}
                            />
                            <button type="submit" className="cta-button" disabled={loading || !occasion.trim()}>
                                {loading ? <Loader className="spin" size={20} /> : <><Sparkles size={18} /> Style Me</>}
                            </button>
                        </form>
                    </div>
                )}

                {/* Structured Outfit Generator */}
                {activeTab === 'generator' && (
                    <div className="glass-card input-card generator-card">
                        <form onSubmit={handleGeneratorSubmit} className="generator-form">
                            <div className="gen-row">
                                <div className="gen-field">
                                    <label>Occasion</label>
                                    <select value={genOccasion} onChange={e => setGenOccasion(e.target.value)}>
                                        {OCCASION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div className="gen-field">
                                    <label>Weather / Season</label>
                                    <select value={genWeather} onChange={e => setGenWeather(e.target.value)}>
                                        {WEATHER_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                                    </select>
                                </div>
                                <div className="gen-field">
                                    <label>Style</label>
                                    <select value={genStyle} onChange={e => setGenStyle(e.target.value)}>
                                        <option value="">Any</option>
                                        {STYLE_OPTIONS.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="cta-button gen-submit" disabled={loading}>
                                {loading ? <Loader className="spin" size={20} /> : <><Zap size={18} /> Generate Outfit</>}
                            </button>
                        </form>
                    </div>
                )}

                {error && <div className="error-message">{error}</div>}

                {/* Results */}
                {recommendation && (
                    <div className="recommendation-result animation-fade-in">
                        {/* Rationale */}
                        <div className="glass-card ai-rationale-card">
                            <div className="rationale-header">
                                <Sparkles className="highlight" size={20} />
                                <h3>Stylist's Thoughts</h3>
                            </div>
                            <p className="rationale-text">{recommendation.rationale}</p>
                            {/* Log Outfit Button */}
                            <div className="log-outfit-row">
                                {logSuccess ? (
                                    <div className="log-success-toast">
                                        <CheckCircle size={16} /> Outfit logged to your calendar!
                                    </div>
                                ) : (
                                    <button
                                        className="log-outfit-btn"
                                        onClick={handleLogOutfit}
                                        disabled={logLoading}
                                    >
                                        {logLoading
                                            ? <Loader size={15} className="spin" />
                                            : <CalendarCheck size={15} />}
                                        {logLoading ? 'Logging…' : '📅 Log This Outfit'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Outfit Breakdown (structured slots) */}
                        {hasSlotMap && (
                            <>
                                <h3 className="outfit-heading">Outfit Breakdown</h3>
                                <div className="breakdown-grid">
                                    {Object.entries(SLOT_LABELS).map(([slot, label]) => {
                                        const item = outfitSlotMap[slot];
                                        return (
                                            <div key={slot} className={`breakdown-slot glass-card ${item ? '' : 'slot-empty'}`}>
                                                <span className="slot-label">{label}</span>
                                                {item ? (
                                                    <>
                                                        <img src={item.imageUrl} alt={item.category} className="slot-img" />
                                                        <span className="slot-name">{item.name || `${item.color} ${item.type || item.category}`}</span>
                                                    </>
                                                ) : (
                                                    <span className="slot-missing">—</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* Full outfit cards */}
                        <h3 className="outfit-heading">Your Outfit</h3>
                        <div className="outfit-grid">
                            {recommendation.outfit.map((item, idx) => (
                                <div key={item._id || idx} className="item-card glass-card">
                                    <div className="item-image-wrapper">
                                        <img src={item.imageUrl} alt={item.category} className="item-image" />
                                        <span className="outfit-number-badge">#{idx + 1}</span>
                                    </div>
                                    <div className="item-details">
                                        <h4>{item.name || `${item.color} ${item.category}`}</h4>
                                        {item.type && <span className="type-label">{item.type}</span>}
                                        <div className="item-tags">
                                            <span className="tag">{item.formality}</span>
                                            {item.style && <span className="tag">{item.style}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Shopping suggestions */}
                        {recommendation.shoppingSuggestions && recommendation.shoppingSuggestions.length > 0 && (
                            <div className="shopping-section">
                                <h3 className="outfit-heading"><ShoppingBag size={20} /> Complete Your Look — Buy These</h3>
                                <div className="shopping-grid">
                                    {recommendation.shoppingSuggestions.map((item, idx) => (
                                        <div key={idx} className="glass-card shopping-card">
                                            <h4 className="shopping-item-name">{item.item}</h4>
                                            {item.slot && <span className="tag" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>For: {item.slot}</span>}
                                            <p className="shopping-reason">{item.reason}</p>
                                            <div className="shopping-where">
                                                <strong>Where to buy:</strong>
                                                <div className="shopping-links">
                                                    {item.whereToBuy.map((store, sIdx) => (
                                                        <a key={sIdx} href={store.url} target="_blank" rel="noopener noreferrer" className="store-link">
                                                            {store.name} →
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                            {item.estimatedPrice && (
                                                <p className="estimated-price">💰 Est. price: {item.estimatedPrice}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Stylist;
