import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Upload, X, Sparkles, Loader, Image, CheckCircle } from 'lucide-react';
import './AddItemModal.css';

// @imgly/background-removal is now installed locally (no CDN needed)
import { removeBackground } from '@imgly/background-removal';
import heic2any from 'heic2any';

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
    purchasePrice: '',
    purchaseDate: '',
};

const AddItemModal = ({ isOpen, onClose, onAdd, onUpdate, token, editItem }) => {
    const [file, setFile] = useState(null);               // raw file from picker
    const [processedFile, setProcessedFile] = useState(null); // after bg removal
    const [previewUrl, setPreviewUrl] = useState(null);   // canvas preview
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAutoTagging, setIsAutoTagging] = useState(false);
    const [isRemovingBg, setIsRemovingBg] = useState(false);
    const [bgRemoved, setBgRemoved] = useState(false);
    const [bgError, setBgError] = useState('');
    const [autoTagError, setAutoTagError] = useState('');
    const [isConverting, setIsConverting] = useState(false);

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
                purchasePrice: editItem.purchasePrice || '',
                purchaseDate: editItem.purchaseDate ? new Date(editItem.purchaseDate).toISOString().split('T')[0] : '',
            });
            setFile(null);
            setProcessedFile(null);
            setPreviewUrl(null);
            setBgRemoved(false);
        } else {
            setFormData(INITIAL_FORM);
            setFile(null);
            setProcessedFile(null);
            setPreviewUrl(null);
            setBgRemoved(false);
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

    const handleFileChange = async (e) => {
        if (e.target.files[0]) {
            let picked = e.target.files[0];
            setBgError('');
            setAutoTagError('');

            // Automatically convert HEIC/HEIF files to JPEG for native browser compatibility
            const filename = picked.name.toLowerCase();
            if (filename.endsWith('.heic') || filename.endsWith('.heif') || picked.type === 'image/heic') {
                setIsConverting(true);
                try {
                    const conversionResult = await heic2any({
                        blob: picked,
                        toType: 'image/jpeg',
                        quality: 0.85
                    });
                    
                    const finalBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
                    picked = new File([finalBlob], picked.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
                } catch (err) {
                    console.error('HEIC conversion failed:', err);
                    setBgError('Failed to convert heavy High-Efficiency image format. Please manually convert it or upload a JPG/PNG.');
                    setIsConverting(false);
                    return; // Abort upload
                }
                setIsConverting(false);
            }

            setFile(picked);
            setProcessedFile(null);
            setPreviewUrl(URL.createObjectURL(picked));
            setBgRemoved(false);
        }
    };

    // ── Background removal helper ─────────────────────────────
    const handleRemoveBackground = async () => {
        if (!file) return;
        setIsRemovingBg(true);
        setBgError('');
        try {
            // Run bg removal using locally installed package
            // Returns a Blob with transparent background (PNG)
            const blob = await removeBackground(file, {
                model: 'medium',
            });

            // Composite onto a clean off-white canvas
            const img = new window.Image();
            const objectUrl = URL.createObjectURL(blob);
            img.src = objectUrl;
            await new Promise(resolve => img.onload = resolve);

            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');

            // Fill with clean off-white background (matches wardrobe card style)
            ctx.fillStyle = '#f7f7f5';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw the cutout on top
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(objectUrl);

            // Convert canvas to a new File
            canvas.toBlob(async (finalBlob) => {
                const cleanFile = new File([finalBlob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
                setProcessedFile(cleanFile);
                setPreviewUrl(canvas.toDataURL('image/jpeg', 0.92));
                setBgRemoved(true);
                setIsRemovingBg(false);
            }, 'image/jpeg', 0.92);
        } catch (err) {
            console.error('BG removal error:', err);
            setBgError('Could not remove background. Check your connection (CDN model needed).');
            setIsRemovingBg(false);
        }
    };

    // The file to actually upload: processed (bg removed) or original
    const uploadFile = processedFile || file;

    const handleAutoTag = async () => {
        if (!uploadFile) return;
        setIsAutoTagging(true);
        setAutoTagError('');
        try {
            const reader = new FileReader();
            reader.readAsDataURL(uploadFile);
            reader.onload = async () => {
                const base64Full = reader.result;
                const [meta, imageBase64] = base64Full.split(',');
                const mimeType = meta.match(/:(.*?);/)[1];

                const res = await fetch('http://localhost:5001/api/wardrobe/analyze-image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ imageBase64, mimeType }),
                });

                if (res.ok) {
                    const tags = await res.json();
                    setFormData(prev => ({
                        ...prev,
                        category: tags.category || prev.category,
                        type: tags.type || prev.type,
                        color: COLORS.includes(tags.color) ? tags.color : (tags.color ? '__custom' : prev.color),
                        customColor: COLORS.includes(tags.color) ? '' : (tags.color || ''),
                        season: tags.season || prev.season,
                        formality: tags.formality || prev.formality,
                        style: tags.style || prev.style,
                        occasions: tags.occasions || prev.occasions,
                        styleNotes: tags.styleNotes || prev.styleNotes,
                    }));
                } else {
                    const err = await res.json();
                    setAutoTagError(err.message || 'Auto-tagging failed.');
                }
                setIsAutoTagging(false);
            };
            reader.onerror = () => {
                setAutoTagError('Could not read file.');
                setIsAutoTagging(false);
            };
        } catch (err) {
            setAutoTagError('Auto-tagging failed. Try manually.');
            setIsAutoTagging(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // For new items, image is required
        if (!isEditMode && !uploadFile) { alert("Please upload an image first!"); return; }

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
                        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
                        purchaseDate: formData.purchaseDate || undefined,
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
                payload.append('image', uploadFile);  // use processed file if bg was removed
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
                if (formData.purchasePrice) payload.append('purchasePrice', formData.purchasePrice);
                if (formData.purchaseDate) payload.append('purchaseDate', formData.purchaseDate);

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
                            {/* Upload / Preview area */}
                            <label htmlFor="file-upload" className={`upload-btn ${previewUrl ? 'upload-btn-compact' : ''}`}>
                                {isConverting ? (
                                    <div className="upload-preview-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '120px' }}>
                                        <Loader className="spin-icon" size={30} style={{ margin: 'auto', color: 'var(--accent-primary)' }}/>
                                        <span style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Processing HEIC format...</span>
                                    </div>
                                ) : previewUrl ? (
                                    <div className="upload-preview-wrap">
                                        <img src={previewUrl} alt="preview" className="upload-preview-img" />
                                        {bgRemoved && (
                                            <div className="bg-removed-badge">
                                                <CheckCircle size={13} /> Clean Background
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <><Upload size={20} /> Upload or Capture Photo</>
                                )}
                            </label>
                            <input id="file-upload" type="file" accept="image/*,.heic,.heif" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} disabled={isConverting} />

                            {/* Background removal button */}
                            {file && !bgRemoved && (
                                <button
                                    type="button"
                                    className={`bgremove-btn ${isRemovingBg ? 'bgremove-loading' : ''}`}
                                    onClick={handleRemoveBackground}
                                    disabled={isRemovingBg}
                                >
                                    {isRemovingBg ? (
                                        <><Loader size={15} className="spin-icon" /> Removing background…</>
                                    ) : (
                                        <><Image size={15} /> 🪄 Remove Background</>
                                    )}
                                </button>
                            )}
                            {bgRemoved && (
                                <div className="bg-success-note">
                                    <CheckCircle size={14} /> Background removed ✓ &nbsp;
                                    <button type="button" className="bg-redo-btn" onClick={() => { setBgRemoved(false); setProcessedFile(null); setPreviewUrl(URL.createObjectURL(file)); }}>
                                        Undo
                                    </button>
                                </div>
                            )}
                            {bgError && <p className="autotag-error">{bgError}</p>}

                            {/* Auto-tag button */}
                            {file && (
                                <button
                                    type="button"
                                    className={`autotag-btn ${isAutoTagging ? 'autotag-loading' : ''}`}
                                    onClick={handleAutoTag}
                                    disabled={isAutoTagging || isRemovingBg}
                                >
                                    {isAutoTagging
                                        ? <><Loader size={15} className="spin-icon" /> Analyzing…</>
                                        : <><Sparkles size={15} /> ✨ Auto-tag with AI</>
                                    }
                                </button>
                            )}
                            {autoTagError && <p className="autotag-error">{autoTagError}</p>}
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

                    <div className="form-row">
                        <div className="form-group">
                            <label>Purchase Price (₹) <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '0.78rem' }}>— optional</span></label>
                            <input
                                type="number"
                                name="purchasePrice"
                                placeholder="e.g. 1299"
                                value={formData.purchasePrice}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label>Purchase Date <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '0.78rem' }}>— optional</span></label>
                            <input
                                type="date"
                                name="purchaseDate"
                                value={formData.purchaseDate}
                                onChange={handleChange}
                            />
                        </div>
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
