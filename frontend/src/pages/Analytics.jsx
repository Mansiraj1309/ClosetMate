import React, { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { BarChart2, Palette, TrendingUp, Sun, AlertCircle, IndianRupee, HeartHandshake, Loader } from 'lucide-react';
import './Analytics.css';

// Color scheme for charts
const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e', '#3b82f6', '#a855f7', '#84cc16'];

const SEASONS = ['Summer', 'Winter', 'Rainy', 'All Season'];

// Map common color names to CSS hex values for the palette display
const COLOR_HEX_MAP = {
    Black: '#1a1a1a', White: '#f0f0f0', Blue: '#3b82f6', Red: '#ef4444',
    Green: '#22c55e', Beige: '#d4b896', Brown: '#92400e', Grey: '#6b7280',
    Navy: '#1e3a5f', Pink: '#ec4899', Yellow: '#eab308', Orange: '#f97316',
    Purple: '#a855f7', Maroon: '#7f1d1d', Olive: '#65a30d', Teal: '#0d9488',
};

const Analytics = () => {
    const { token, user, updateBudget } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [budgetInput, setBudgetInput] = useState('');
    const [isUpdatingBudget, setIsUpdatingBudget] = useState(false);

    useEffect(() => {
        if (!token) return;
        fetch('http://localhost:5001/api/wardrobe', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(data => { setItems(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [token]);

    if (loading) {
        return (
            <div className="analytics-page">
                <header className="analytics-header">
                    <BarChart2 size={40} className="header-icon" style={{color:'var(--accent)' }} />
                    <h1 className="gradient-text">Wardrobe Analytics</h1>
                    <p className="subtitle">Crunching your wardrobe data…</p>
                </header>
                <div className="analytics-skeleton-grid">
                    {[...Array(4)].map((_, i) => <div key={i} className="skeleton skeleton-summary-card"></div>)}
                </div>
                <div className="analytics-skeleton-charts">
                    {[...Array(4)].map((_, i) => <div key={i} className="skeleton skeleton-chart-card"></div>)}
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="analytics-page">
                <div className="analytics-empty">
                    <AlertCircle size={48} />
                    <h3>No wardrobe data yet</h3>
                    <p>Add some items to your wardrobe to see analytics here.</p>
                </div>
            </div>
        );
    }

    // ── Derived Data ────────────────────────────────────────────────────

    // 1. Category distribution
    const categoryCount = items.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
    }, {});
    const categoryData = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));

    // 2. Seasonal distribution
    const seasonCount = SEASONS.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
    items.forEach(item => { if (seasonCount[item.season] !== undefined) seasonCount[item.season]++; });
    const seasonData = Object.entries(seasonCount).map(([season, count]) => ({ season, count }));

    // 3. Cost-per-wear (only items with purchasePrice > 0 and wearCount > 0)
    const cpwItems = items
        .filter(item => item.purchasePrice && item.purchasePrice > 0 && item.wearCount > 0)
        .map(item => ({
            ...item,
            costPerWear: (item.purchasePrice / item.wearCount).toFixed(0)
        }))
        .sort((a, b) => a.costPerWear - b.costPerWear)
        .slice(0, 8);

    // Items with price but never worn (infinite cost-per-wear)
    const unwornPricedItems = items.filter(item => item.purchasePrice && item.purchasePrice > 0 && item.wearCount === 0);

    // 4. Color palette
    const colorCount = items.reduce((acc, item) => {
        if (item.color) acc[item.color] = (acc[item.color] || 0) + 1;
        return acc;
    }, {});
    const colorData = Object.entries(colorCount).sort((a, b) => b[1] - a[1]);

    // 5. Formality breakdown
    const formalityCount = items.reduce((acc, item) => {
        acc[item.formality] = (acc[item.formality] || 0) + 1;
        return acc;
    }, {});
    const formalityData = Object.entries(formalityCount).map(([name, value]) => ({ name, value }));

    // Total wardrobe value
    const totalValue = items.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);
    const itemsWithPrice = items.filter(i => i.purchasePrice).length;

    // ── Budget & Spend Tracking ─────────────────────────────────────────

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const thisMonthSpend = items.reduce((sum, item) => {
        if (!item.purchasePrice || !item.purchaseDate) return sum;
        const pDate = new Date(item.purchaseDate);
        if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
            return sum + item.purchasePrice;
        }
        return sum;
    }, 0);

    const budget = user?.budget;
    const isOverBudget = budget ? thisMonthSpend > budget : false;
    const budgetPercentage = Math.min(Math.round((thisMonthSpend / (budget || 1)) * 100), 100);

    const handleSaveBudget = async () => {
        if (!budgetInput) return;
        setIsUpdatingBudget(true);
        try {
            await updateBudget(parseInt(budgetInput, 10));
        } catch (err) {
            console.error(err);
        } finally {
            setIsUpdatingBudget(false);
            setBudgetInput('');
        }
    };

    // ── Donation Candidates (1 year Rule) ───────────────────────────────

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const donationCandidates = items.filter(item => {
        if (item.wearCount === 0) {
            const dateToCheck = item.purchaseDate ? new Date(item.purchaseDate) : new Date(item.createdAt);
            return dateToCheck < oneYearAgo;
        } else {
            return item.lastWorn ? new Date(item.lastWorn) < oneYearAgo : false;
        }
    }).sort((a,b) => new Date(a.lastWorn || a.createdAt) - new Date(b.lastWorn || b.createdAt)).slice(0, 4);

    return (
        <div className="analytics-page">
            <header className="analytics-header">
                <BarChart2 size={40} className="header-icon" />
                <h1 className="gradient-text">Wardrobe Analytics</h1>
                <p className="subtitle">Data-driven insights into your style, spending, and wardrobe gaps.</p>
            </header>

            {/* Summary Row */}
            <div className="analytics-summary-row">
                <div className="summary-card glass-card">
                    <span className="summary-num">{items.length}</span>
                    <span className="summary-label">Total Items</span>
                </div>
                <div className="summary-card glass-card">
                    <span className="summary-num">{Object.keys(categoryCount).length}</span>
                    <span className="summary-label">Categories</span>
                </div>
                <div className="summary-card glass-card">
                    <span className="summary-num">{totalValue > 0 ? `₹${totalValue.toLocaleString('en-IN')}` : '—'}</span>
                    <span className="summary-label">Total Value{itemsWithPrice > 0 ? ` (${itemsWithPrice} items)` : ''}</span>
                </div>
                <div className="summary-card glass-card">
                    <span className="summary-num">{colorData.length}</span>
                    <span className="summary-label">Unique Colors</span>
                </div>
            </div>

            {/* Budget & Spend Tracker Section */}
            <div className="analytics-card glass-card budget-section">
                <div className="ac-header" style={{ marginBottom: '1rem' }}>
                    <IndianRupee size={22} className="ac-icon" />
                    <h3>Monthly Clothing Budget</h3>
                </div>
                
                {budget ? (
                    <div className="budget-tracker">
                        <div className="budget-stats">
                            <div>
                                <span className="budget-spend">₹{thisMonthSpend.toLocaleString('en-IN')}</span>
                                <span className="budget-label">spent this month</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span className="budget-total">₹{budget.toLocaleString('en-IN')}</span>
                                <span className="budget-label">monthly budget</span>
                            </div>
                        </div>
                        <div className="budget-bar-bg">
                            <div 
                                className={`budget-bar-fill ${isOverBudget ? 'over-budget' : ''}`} 
                                style={{ width: `${budgetPercentage}%` }}
                            ></div>
                        </div>
                        {isOverBudget ? (
                            <p className="budget-warning"><AlertCircle size={14}/> You have exceeded your monthly clothing budget. Consider buying second-hand next!</p>
                        ) : (
                            <p className="budget-success">You have ₹{(budget - thisMonthSpend).toLocaleString('en-IN')} left to spend this month.</p>
                        )}
                        
                        <div className="edit-budget-row">
                            <input 
                                type="number" 
                                placeholder="Update limits..." 
                                value={budgetInput} 
                                onChange={(e)=>setBudgetInput(e.target.value)} 
                                className="budget-input"
                            />
                            <button onClick={handleSaveBudget} disabled={isUpdatingBudget || !budgetInput} className="budget-btn">
                                Save
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="no-budget">
                        <p>Track your sustainable consumption by setting a monthly clothing allowance.</p>
                        <div className="edit-budget-row">
                            <input 
                                type="number" 
                                placeholder="₹ Enter Monthly Budget" 
                                value={budgetInput} 
                                onChange={(e)=>setBudgetInput(e.target.value)} 
                                className="budget-input"
                            />
                            <button onClick={handleSaveBudget} disabled={isUpdatingBudget || !budgetInput} className="budget-btn">
                                {isUpdatingBudget ? 'Saving...' : 'Set Budget'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Donation Nudge */}
            {donationCandidates.length > 0 && (
                <div className="analytics-card glass-card donation-section">
                    <div className="ac-header" style={{ marginBottom: '1rem' }}>
                        <HeartHandshake size={22} className="ac-icon highlight" />
                        <h3>Donate or Recycle Options</h3>
                    </div>
                    <p className="donation-subtitle">You haven't worn these items in over a year. Give them a second life!</p>
                    <div className="donation-grid">
                        {donationCandidates.map(item => (
                            <div key={item._id} className="donation-item">
                                <img src={item.imageUrl} alt={item.name} className="donation-img" />
                                <span className="donation-item-name">{item.name || item.category}</span>
                            </div>
                        ))}
                    </div>
                    <div className="donation-links">
                        <a href="https://www.clothesboxfoundation.org/" target="_blank" rel="noopener noreferrer" className="donate-link text-gradient">Donate via Clothes Box Foundation</a>
                        <a href="https://give.do/" target="_blank" rel="noopener noreferrer" className="donate-link text-gradient">Donate via GiveIndia</a>
                    </div>
                </div>
            )}

            <div className="analytics-grid">
                {/* 1. Category Donut Chart */}
                <div className="analytics-card glass-card">
                    <div className="ac-header">
                        <BarChart2 size={20} className="ac-icon" />
                        <h3>Category Breakdown</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ background: '#1e1b2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }}
                            />
                            <Legend
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{ fontSize: '0.75rem', color: '#94a3b8' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* 2. Seasonal Gap Bar Chart */}
                <div className="analytics-card glass-card">
                    <div className="ac-header">
                        <Sun size={20} className="ac-icon" />
                        <h3>Seasonal Coverage</h3>
                    </div>
                    <p className="ac-desc">Are you prepared for every season?</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={seasonData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis dataKey="season" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ background: '#1e1b2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }}
                            />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                {seasonData.map((entry, index) => (
                                    <Cell key={entry.season} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    {/* Gap analysis */}
                    {(() => {
                        const minSeason = seasonData.filter(s => s.season !== 'All Season').sort((a, b) => a.count - b.count)[0];
                        if (minSeason && minSeason.count < 3) {
                            return (
                                <div className="gap-alert">
                                    ⚠️ You only have <strong>{minSeason.count}</strong> items for <strong>{minSeason.season}</strong>. Consider expanding your {minSeason.season.toLowerCase()} wardrobe.
                                </div>
                            );
                        }
                        return <div className="gap-good">✅ Good coverage across all seasons!</div>;
                    })()}
                </div>

                {/* 3. Formality Donut */}
                <div className="analytics-card glass-card">
                    <div className="ac-header">
                        <TrendingUp size={20} className="ac-icon" />
                        <h3>Formality Mix</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={formalityData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={95}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {formalityData.map((entry, index) => (
                                    <Cell key={entry.name} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ background: '#1e1b2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }}
                            />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.75rem', color: '#94a3b8' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* 4. Color Palette */}
                <div className="analytics-card glass-card color-card">
                    <div className="ac-header">
                        <Palette size={20} className="ac-icon" />
                        <h3>Your Color Palette</h3>
                    </div>
                    <p className="ac-desc">Dominant colors in your wardrobe</p>
                    <div className="color-palette-grid">
                        {colorData.map(([color, count]) => (
                            <div key={color} className="color-swatch-item" title={`${color}: ${count} items`}>
                                <div
                                    className="color-swatch"
                                    style={{
                                        background: COLOR_HEX_MAP[color] || '#6b7280',
                                        width: `${Math.max(32, Math.min(70, count * 14))}px`,
                                        height: `${Math.max(32, Math.min(70, count * 14))}px`,
                                    }}
                                />
                                <span className="swatch-label">{color}</span>
                                <span className="swatch-count">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Cost-Per-Wear Section */}
            <section className="cpw-section glass-card">
                <div className="ac-header">
                    <TrendingUp size={20} className="ac-icon" />
                    <h3>Cost Per Wear</h3>
                    <span className="cpw-hint">Add purchase prices when adding items to track this</span>
                </div>

                {cpwItems.length === 0 ? (
                    <div className="cpw-empty">
                        <p>💡 Add purchase prices to your wardrobe items to see your cost-per-wear — the true measure of value in fashion.</p>
                    </div>
                ) : (
                    <>
                        <div className="cpw-grid">
                            {cpwItems.map(item => (
                                <div key={item._id} className="cpw-item">
                                    <img src={item.imageUrl} alt={item.name || item.category} className="cpw-img" />
                                    <div className="cpw-info">
                                        <span className="cpw-name">{item.name || `${item.color} ${item.type || item.category}`}</span>
                                        <span className="cpw-stat">₹{Number(item.purchasePrice).toLocaleString('en-IN')} ÷ {item.wearCount} wears</span>
                                        <span className={`cpw-value ${item.costPerWear < 100 ? 'cpw-great' : item.costPerWear < 300 ? 'cpw-ok' : 'cpw-high'}`}>
                                            ₹{item.costPerWear} / wear
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {unwornPricedItems.length > 0 && (
                            <div className="cpw-alert">
                                ⚠️ You have <strong>{unwornPricedItems.length}</strong> priced item{unwornPricedItems.length > 1 ? 's' : ''} that {unwornPricedItems.length > 1 ? 'have' : 'has'} never been worn. Wear {unwornPricedItems.length > 1 ? 'them' : 'it'} to get your money's worth!
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
};

export default Analytics;
