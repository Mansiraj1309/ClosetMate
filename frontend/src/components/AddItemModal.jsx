import React, { useState, useEffect, useMemo } from 'react';
import { Upload, X } from 'lucide-react';
import './AddItemModal.css';

// ── Dropdown options ──────────────────────────────────────────

const CATEGORIES = ['Tops', 'Bottoms', 'Dresses / Suits', 'Outerwear', 'Shoes', 'Accessories', 'Activewear', 'Ethnic'];

const TYPE_MAP = {
    'Tops': ['T-shirt', 'Shirt', 'Blouse', 'Kurti', 'Sweater', 'Hoodie', 'Tank Top', 'Crop Top', 'Polo'],
    'Bottoms': ['Jeans', 'Trousers', 'Shorts', 'Skirt', 'Palazzo', 'Leggings', 'Chinos', 'Joggers'],
    'Dresses / Suits': ['Casual Dress', 'Formal Dress', 'Maxi Dress', 'Suit (2‑piece)', 'Suit (3‑piece)', 'Jumpsuit'],
    'Outerwear': ['Jacket', 'Blazer', 'Coat', 'Cardigan', 'Hoodie', 'Windbreaker'],
    'Shoes': ['Sneakers', 'Boots', 'Sandals', 'Heels', 'Formal Shoes', 'Loafers', 'Slides'],
    'Accessories': ['Watch', 'Belt', 'Bag', 'Sunglasses', 'Hat', 'Scarf', 'Jewelry', 'Tie'],
    'Activewear': ['Sports Bra', 'Track Pants', 'Gym Shorts', 'Compression Tee', 'Running Shoes'],
    'Ethnic': ['Kurta', 'Saree', 'Lehenga', 'Sherwani', 'Salwar Kameez', 'Dhoti'],
};

const GENDERS = ['Menswear', 'Womenswear', 'Unisex'];

const COLORS = ['Black', 'White', 'Blue', 'Red', 'Green', 'Beige', 'Brown', 'Grey', 'Navy', 'Pink', 'Yellow', 'Orange', 'Purple', 'Maroon', 'Olive', 'Teal'];

const SEASONS = ['All Season', 'Summer', 'Winter', 'Rainy'];

const FORMALITIES = ['Casual', 'Smart Casual', 'Formal', 'Party', 'Ethnic'];

const OCCASIONS = ['Casual', 'Office', 'Business', 'Party', 'Wedding', 'Date Night', 'Festival', 'Travel', 'Gym', 'College'];

const STYLES = ['Minimal', 'Streetwear', 'Sporty', 'Elegant', 'Vintage', 'Classic', 'Boho', 'Formal', 'Casual'];

// ── Component ─────────────────────────────────────────────────

const INITIAL_FORM = {
    name: '',
    category: 'Tops',
    type: '',
    gender: 'Unisex',
    color: 'Black',
    customColor: '',
    season: 'All Season',
    formality: 'Casual',
    occasions: [],
    style: '',
    tags: '',
    styleNotes: '',
};

const AddItemModal = ({ isOpen, onClose, onAdd, onUpdate, token, editItem }) => {
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEditMode = Boolean(editItem);

    // Pre-fill form when editing
    useEffect(() => {
        if (editItem) {
            const colorInList = COLORS.includes(editItem.color);
            setFormData({
                name: editItem.name || '',
                category: editItem.category || 'Tops',
                type: editItem.type || '',
                gender: editItem.gender || 'Unisex',
                color: colorInList ? editItem.color : '__custom',
                customColor: colorInList ? '' : (editItem.color || ''),
                season: editItem.season || 'All Season',
                formality: editItem.formality || 'Casual',
                occasions: editItem.occasions || [],
                style: editItem.style || '',
                tags: (editItem.tags || []).join(', '),
                styleNotes: editItem.styleNotes || '',
            });
            setFile(null);
        } else {
            setFormData(INITIAL_FORM);
            setFile(null);
        }
    }, [editItem]);

    // Derive available types when category changes
    const typeOptions = useMemo(() => TYPE_MAP[formData.category] || [], [formData.category]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'category') {
            // Reset type when category changes
            setFormData(prev => ({ ...prev, category: value, type: '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const toggleOccasion = (occ) => {
        setFormData(prev => {
            const exists = prev.occasions.includes(occ);
            return {
                ...prev,
                occasions: exists
                    ? prev.occasions.filter(o => o !== occ)
                    : [...prev.occasions, occ],
            };
        });
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // For new items, image is required
        if (!isEditMode && !file) { alert("Please upload an image first!"); return; }

        setIsSubmitting(true);

        const finalColor = formData.color === '__custom' ? formData.customColor : formData.color;

        try {
            let res;
            if (isEditMode) {
                // PUT JSON for editing (no image change)
                res = await fetch(`http://localhost:5001/api/wardrobe/${editItem._id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: formData.name,
                        category: formData.category,
                        type: formData.type,
                        gender: formData.gender,
                        color: finalColor,
                        season: formData.season,
                        formality: formData.formality,
                        occasions: formData.occasions,
                        style: formData.style,
                        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                        styleNotes: formData.styleNotes,
                    }),
                });

                if (res.ok) {
                    const updated = await res.json();
                    onUpdate(updated);
                    onClose();
                } else {
                    alert('Failed to update item.');
                }
            } else {
                // POST FormData for new item
                const payload = new FormData();
                payload.append('image', file);
                payload.append('name', formData.name);
                payload.append('category', formData.category);
                payload.append('type', formData.type);
                payload.append('gender', formData.gender);
                payload.append('color', finalColor);
                payload.append('season', formData.season);
                payload.append('formality', formData.formality);
                payload.append('occasions', JSON.stringify(formData.occasions));
                payload.append('style', formData.style);
                payload.append('tags', formData.tags);
                payload.append('styleNotes', formData.styleNotes);

                res = await fetch('http://localhost:5001/api/wardrobe', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: payload,
                });

                if (res.ok) {
                    const newItem = await res.json();
                    onAdd(newItem);
                    onClose();
                    setFile(null);
                    setFormData(INITIAL_FORM);
                } else {
                    alert('Failed to add item. Check server logs.');
                }
            }
        } catch (err) {
            console.error(err);
            alert(isEditMode ? 'Error updating item.' : 'Error adding item.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card">
                <button className="close-btn" onClick={onClose}><X size={20} /></button>
                <h2>{isEditMode ? 'Edit Item' : 'Add to Wardrobe'}</h2>

                <form onSubmit={handleSubmit} className="add-item-form">
                    {/* Image upload — only for new items */}
                    {!isEditMode && (
                        <div className="form-group file-upload">
                            <label htmlFor="file-upload" className="upload-btn">
                                <Upload size={20} />
                                {file ? file.name : 'Upload Image'}
                            </label>
                            <input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                        </div>
                    )}
                    {isEditMode && editItem.imageUrl && (
                        <div className="edit-image-preview">
                            <img src={editItem.imageUrl} alt={editItem.name || 'item'} />
                        </div>
                    )}

                    {/* Name */}
                    <div className="form-group">
                        <label>Name (optional)</label>
                        <input type="text" name="name" placeholder="e.g. Favourite navy blazer" value={formData.name} onChange={handleChange} />
                    </div>

                    {/* Category + Type */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Category</label>
                            <select name="category" value={formData.category} onChange={handleChange}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Type</label>
                            <select name="type" value={formData.type} onChange={handleChange}>
                                <option value="">— Select —</option>
                                {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Gender + Color */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange}>
                                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Color</label>
                            <select name="color" value={formData.color} onChange={handleChange}>
                                {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                <option value="__custom">Other…</option>
                            </select>
                            {formData.color === '__custom' && (
                                <input type="text" name="customColor" placeholder="Enter color" value={formData.customColor} onChange={handleChange} style={{ marginTop: '0.5rem' }} required />
                            )}
                        </div>
                    </div>

                    {/* Season + Formality */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Season</label>
                            <select name="season" value={formData.season} onChange={handleChange}>
                                {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Formality</label>
                            <select name="formality" value={formData.formality} onChange={handleChange}>
                                {FORMALITIES.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Style */}
                    <div className="form-group">
                        <label>Style</label>
                        <select name="style" value={formData.style} onChange={handleChange}>
                            <option value="">— None —</option>
                            {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Occasions — multi-select chips */}
                    <div className="form-group">
                        <label>Occasions</label>
                        <div className="chip-grid">
                            {OCCASIONS.map(occ => (
                                <button
                                    key={occ}
                                    type="button"
                                    className={`chip ${formData.occasions.includes(occ) ? 'chip-active' : ''}`}
                                    onClick={() => toggleOccasion(occ)}
                                >
                                    {occ}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tags + Notes */}
                    <div className="form-group">
                        <label>Tags (comma separated)</label>
                        <input type="text" name="tags" placeholder="e.g. silk, date-night, summer" value={formData.tags} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label>Notes (optional)</label>
                        <input type="text" name="styleNotes" placeholder="e.g. Goes great with white sneakers" value={formData.styleNotes} onChange={handleChange} />
                    </div>

                    <button type="submit" className="cta-button submit-btn" disabled={isSubmitting}>
                        {isSubmitting ? (isEditMode ? 'Saving...' : 'Uploading...') : (isEditMode ? 'Save Changes' : 'Save to Wardrobe')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddItemModal;
