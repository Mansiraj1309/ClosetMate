import React, { useState, useEffect, useCallback } from 'react';
import API_BASE from '../api';
import { Shirt, Plus, X, Search, Filter, CheckCircle, Pencil, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AddItemModal from '../components/AddItemModal';
import './Wardrobe.css';

const CATEGORY_OPTIONS = ['', 'Tops', 'Bottoms', 'Dresses / Suits', 'Outerwear', 'Shoes', 'Accessories', 'Activewear', 'Ethnic'];
const SEASON_OPTIONS = ['', 'All Season', 'Summer', 'Winter', 'Rainy'];
const FORMALITY_OPTIONS = ['', 'Casual', 'Smart Casual', 'Formal', 'Party', 'Ethnic'];
const STYLE_OPTIONS = ['', 'Minimal', 'Streetwear', 'Sporty', 'Elegant', 'Vintage', 'Classic', 'Boho', 'Formal', 'Casual'];
const GENDER_OPTIONS = ['', 'Menswear', 'Womenswear', 'Unisex'];

const Wardrobe = () => {
    const { token } = useAuth();
    const [items, setItems] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Filters + search
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        category: '', season: '', formality: '', style: '', gender: '',
    });

    const buildQuery = useCallback(() => {
        const params = new URLSearchParams();
        if (search.trim()) params.set('search', search.trim());
        Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
        return params.toString();
    }, [search, filters]);

    const fetchItems = useCallback(async () => {
        try {
            const qs = buildQuery();
            const url = `${API_BASE}/api/wardrobe${qs ? `?${qs}` : ''}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (err) {
            console.error("Failed to fetch wardrobe:", err);
        } finally {
            setLoading(false);
        }
    }, [token, buildQuery]);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    const handleAddItem = (newItem) => {
        setItems(prev => [newItem, ...prev]);
    };

    const handleUpdateItem = (updated) => {
        setItems(prev => prev.map(i => i._id === updated._id ? updated : i));
    };

    const openEdit = (item) => {
        setEditItem(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditItem(null);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        try {
            const res = await fetch(`${API_BASE}/api/wardrobe/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setItems(prev => prev.filter(item => item._id !== id));
        } catch (err) {
            console.error("Failed to delete item:", err);
        }
    };

    const handleWear = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/api/wardrobe/${id}/wear`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const updated = await res.json();
                setItems(prev => prev.map(i => i._id === id ? updated : i));
            }
        } catch (err) {
            console.error("Failed to mark worn:", err);
        }
    };

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const clearFilters = () => {
        setSearch('');
        setFilters({ category: '', season: '', formality: '', style: '', gender: '' });
    };

    const hasActiveFilters = search || Object.values(filters).some(Boolean);

    return (
        <div className="wardrobe-page">
            <header className="wardrobe-header">
                <div>
                    <h1 className="gradient-text">Your Digital Closet.</h1>
                    <p className="subtitle">Manage everything you own in one beautiful place.</p>
                </div>
                <div className="header-actions">
                    <button className="icon-btn" onClick={() => setShowFilters(f => !f)} title="Filters">
                        <Filter size={18} /> Filters
                    </button>
                    <button className="cta-button" onClick={() => { setEditItem(null); setIsModalOpen(true); }}>
                        <Plus size={20} /> Add New Item
                    </button>
                </div>
            </header>

            {/* Search + Filters bar */}
            <div className={`filter-bar glass-card ${showFilters ? 'filter-bar-open' : ''}`}>
                <div className="search-row">
                    <div className="search-input-wrapper">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name, color, type, tag…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    {hasActiveFilters && (
                        <button className="clear-btn" onClick={clearFilters}>Clear all</button>
                    )}
                </div>

                {showFilters && (
                    <div className="filter-selects">
                        <select name="category" value={filters.category} onChange={handleFilterChange}>
                            <option value="">All Categories</option>
                            {CATEGORY_OPTIONS.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select name="season" value={filters.season} onChange={handleFilterChange}>
                            <option value="">All Seasons</option>
                            {SEASON_OPTIONS.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select name="formality" value={filters.formality} onChange={handleFilterChange}>
                            <option value="">All Formality</option>
                            {FORMALITY_OPTIONS.filter(Boolean).map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <select name="style" value={filters.style} onChange={handleFilterChange}>
                            <option value="">All Styles</option>
                            {STYLE_OPTIONS.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select name="gender" value={filters.gender} onChange={handleFilterChange}>
                            <option value="">All Gender</option>
                            {GENDER_OPTIONS.filter(Boolean).map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="wardrobe-grid">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="item-card glass-card skeleton-card">
                            <div className="skeleton skeleton-img"></div>
                            <div className="skeleton-details">
                                <div className="skeleton skeleton-title"></div>
                                <div className="skeleton skeleton-tag"></div>
                                <div className="skeleton skeleton-tag short"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="empty-state-premium glass-card fadeIn">
                    <div className="illustration-wrap">
                        <Shirt size={80} strokeWidth={1} className="main-icon" />
                        <Sparkles size={30} className="sparkle-icon" />
                    </div>
                    <h3>{hasActiveFilters ? 'No items match your filters.' : 'Your fashion journey starts here ✨'}</h3>
                    <p>{hasActiveFilters ? 'Try adjusting or clearing filters to find what you need.' : 'ClosetMate is more fun when you have your clothes logged. Let\'s add your first item!'}</p>
                    {!hasActiveFilters && (
                        <button className="cta-button" onClick={() => setIsModalOpen(true)}>
                            <Plus size={20} /> Add Your First Item
                        </button>
                    )}
                </div>
            ) : (
                <div className="wardrobe-grid">
                    {items.map(item => (
                        <div key={item._id} className="item-card glass-card">
                            <div className="card-actions">
                                <button className="edit-btn" onClick={() => openEdit(item)} title="Edit">
                                    <Pencil size={14} />
                                </button>
                                <button className="delete-btn" onClick={() => handleDelete(item._id)} title="Delete">
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="item-image-wrapper">
                                <img src={item.imageUrl} alt={item.name || item.category} className="item-image" loading="lazy" />
                                <span className={`season-badge ${item.season?.toLowerCase().replace(/\s/g, '-')}`}>
                                    {item.season}
                                </span>
                                {item.gender && item.gender !== 'Unisex' && (
                                    <span className="gender-badge">{item.gender}</span>
                                )}
                            </div>
                            <div className="item-details">
                                <h4>{item.name || `${item.color} ${item.category}`}</h4>
                                {item.type && <span className="type-label">{item.type}</span>}
                                <div className="item-tags">
                                    <span className="tag">{item.formality}</span>
                                    {item.style && <span className="tag">{item.style}</span>}
                                    {item.occasions?.map(o => <span key={o} className="tag tag-occasion">{o}</span>)}
                                </div>
                                {item.styleNotes && <p className="item-notes">"{item.styleNotes}"</p>}
                                <div className="item-footer">
                                    <span className="wear-count">Worn {item.wearCount || 0}×</span>
                                    <button className="wear-btn" onClick={() => handleWear(item._id)} title="Mark as worn today">
                                        <CheckCircle size={14} /> Wore it
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AddItemModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onAdd={handleAddItem}
                onUpdate={handleUpdateItem}
                token={token}
                editItem={editItem}
            />
        </div>
    );
};

export default Wardrobe;
