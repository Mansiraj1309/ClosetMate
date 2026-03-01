import React, { useState, useEffect } from 'react';
import { Shirt, Plus } from 'lucide-react';
import AddItemModal from '../components/AddItemModal';
import './Wardrobe.css';

const Wardrobe = () => {
    const [items, setItems] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch items from backend
    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/wardrobe');
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (err) {
            console.error("Failed to fetch wardrobe:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = (newItem) => {
        setItems([newItem, ...items]); // Add new item to the top of the list
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;

        try {
            const res = await fetch(`http://localhost:5000/api/wardrobe/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setItems(items.filter(item => item._id !== id));
            }
        } catch (err) {
            console.error("Failed to delete item:", err);
        }
    };

    return (
        <div className="wardrobe-page">
            <header className="wardrobe-header">
                <div>
                    <h1 className="gradient-text">Your Digital Closet.</h1>
                    <p className="subtitle">Manage everything you own in one beautiful place.</p>
                </div>
                <button className="cta-button" onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} /> Add New Item
                </button>
            </header>

            {loading ? (
                <div className="loading-state">Loading your wardrobe...</div>
            ) : items.length === 0 ? (
                <div className="empty-state glass-card">
                    <Shirt size={48} className="empty-icon" />
                    <h3>Your closet is empty!</h3>
                    <p>Click "Add New Item" to start building your digital wardrobe.</p>
                </div>
            ) : (
                <div className="wardrobe-grid">
                    {items.map(item => (
                        <div key={item._id} className="item-card glass-card">
                            <button className="delete-btn" onClick={() => handleDelete(item._id)}>
                                <X size={16} />
                            </button>
                            <div className="item-image-wrapper">
                                <img src={item.imageUrl} alt={item.category} className="item-image" />
                                <span className={`season-badge ${item.season}`}>{item.season.replace('_', ' ')}</span>
                            </div>
                            <div className="item-details">
                                <h4>{item.color} {item.category}</h4>
                                <div className="item-tags">
                                    <span className="tag">{item.formality}</span>
                                </div>
                                {item.styleNotes && <p className="item-notes">"{item.styleNotes}"</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AddItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAddItem}
            />
        </div>
    );
};

// Add X icon to the imports at top since handleDelete uses it later
import { X } from 'lucide-react';

export default Wardrobe;
