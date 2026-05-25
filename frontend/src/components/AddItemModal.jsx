import React, { useState, useEffect, useMemo, useRef } from 'react';
import API_BASE from '../api';
import { Upload, X, Sparkles, Loader, Image, CheckCircle, Camera } from 'lucide-react';
import './AddItemModal.css';

// @imgly/background-removal is now installed locally (no CDN needed)
import { removeBackground } from '@imgly/background-removal';
import heic2any from 'heic2any';

import { CLOTHING_CATEGORIES, FORMALITY_OPTIONS, SEASON_OPTIONS, STYLE_OPTIONS } from '../constants';

// ── Dropdown options (Derived from constants) ──────────────────
const CATEGORIES = Object.keys(CLOTHING_CATEGORIES.Women); // Default categories
const GENDERS = ['Men', 'Women', 'Unisex'];
const COLORS = ['Black', 'White', 'Blue', 'Red', 'Green', 'Beige', 'Brown', 'Grey', 'Navy', 'Pink', 'Yellow', 'Orange', 'Purple', 'Maroon', 'Olive', 'Teal'];
const OCCASIONS = ['Casual', 'Office', 'Wedding', 'Date Night', 'Festival', 'Travel', 'Gym', 'College', 'Party'];

// ── Component ─────────────────────────────────────────────────

const INITIAL_FORM = {
    name: '',
    brand: '',
    size: '',
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

// Helper: Downscale image to a max dimension to speed up CPU inference and save memory
const resizeImage = (file, maxDim = 1024) => {
    return new Promise((resolve) => {
        const img = new window.Image();
        const url = URL.createObjectURL(file);
        img.src = url;
        img.onload = () => {
            URL.revokeObjectURL(url);
            let width = img.naturalWidth;
            let height = img.naturalHeight;

            if (width <= maxDim && height <= maxDim) {
                resolve(file);
                return;
            }

            if (width > height) {
                if (width > maxDim) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                }
            } else {
                if (height > maxDim) {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                const resized = new File([blob], file.name, { type: 'image/jpeg' });
                resolve(resized);
            }, 'image/jpeg', 0.90);
        };
        img.onerror = () => {
            resolve(file); // Fallback to original on error
        };
    });
};

const AddItemModal = ({ isOpen, onClose, onAdd, onUpdate, token, editItem, initialData }) => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState(null);
    const [processedFile, setProcessedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
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
                brand: editItem.brand || '',
                size: editItem.size || '',
            });
        } else if (initialData) {
            setFormData({
                ...INITIAL_FORM,
                brand: initialData.brand || '',
                size: initialData.size || '',
                purchasePrice: initialData.price || '',
                name: initialData.name || '',
                style: initialData.style || '',
                season: initialData.season || 'All Season',
                category: initialData.category || 'Tops',
                type: initialData.type || '',
                gender: initialData.gender || 'Unisex',
                color: COLORS.includes(initialData.color) ? initialData.color : (initialData.color ? '__custom' : 'Black'),
                customColor: COLORS.includes(initialData.color) ? '' : (initialData.color || ''),
            });
            setStep(2); // Jump to review step if pre-filled
        } else {
            setFormData(INITIAL_FORM);
        }
        // Always reset file/preview states when modal opens or editItem changes
        setFile(null);
        setProcessedFile(null);
        setPreviewUrl(null);
        setBgRemoved(false);
        setBgError('');
        setAutoTagError('');
    }, [editItem, isOpen]);

    // Derive available types when category/gender changes
    const typeOptions = useMemo(() => {
        const genderCats = CLOTHING_CATEGORIES[formData.gender] || CLOTHING_CATEGORIES.Unisex;
        return genderCats[formData.category] || [];
    }, [formData.category, formData.gender]);

    const categoryOptions = useMemo(() => {
        return Object.keys(CLOTHING_CATEGORIES[formData.gender] || CLOTHING_CATEGORIES.Unisex);
    }, [formData.gender]);

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
        console.log('--- STARTING BACKGROUND REMOVAL ---');
        console.log('Original file:', file.name, 'size:', file.size, 'type:', file.type);
        try {
            // 1. Resize image to maximum 1024px to speed up CPU inference and prevent OOM
            const resizedFile = await resizeImage(file, 1024);
            console.log('Resized image successfully:', resizedFile.size);

            // 2. Run background removal using CPU to prevent iOS/Safari WebGL color corruption/inversion bugs
            console.log('Running background removal on CPU...');
            const blob = await removeBackground(resizedFile, {
                model: 'medium',
                device: 'cpu',
            });
            console.log('Finished background removal. Output size:', blob.size);

            // 3. Load the cutout PNG to check transparency *directly* BEFORE compositing on solid off-white background
            const cutoutImg = new window.Image();
            const objectUrl = URL.createObjectURL(blob);
            cutoutImg.src = objectUrl;
            await new Promise((resolve) => {
                cutoutImg.onload = resolve;
                cutoutImg.onerror = () => resolve(); // Handle loading error gracefully
            });

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = cutoutImg.naturalWidth || 500;
            tempCanvas.height = cutoutImg.naturalHeight || 500;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(cutoutImg, 0, 0);
            URL.revokeObjectURL(objectUrl);

            // ── Alpha Channel Restoration to bypass Safari/iOS WebKit WebAssembly precision bugs! ──
            // On iOS Safari WebViews, WebAssembly compilation/precision bugs can cause the model output
            // mask to contain extremely low alpha values (e.g. 10% opacity) for the clothing, which makes
            // the garment look washed-out, faint, or white.
            // By programmatically scanning the image data and restoring the alpha channel to 255 (fully opaque)
            // for all foreground pixels, we completely restore the rich original colors of the garment.
            const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imgData.data;
            let opaquePixels = 0;
            const totalPixels = tempCanvas.width * tempCanvas.height;

            for (let i = 0; i < data.length; i += 4) {
                const alpha = data[i + 3];
                if (alpha > 15) { // If pixel is part of the clothing foreground
                    opaquePixels++;
                    data[i + 3] = 255; // Restore to 100% full opacity to bring back the exact rich original color!
                } else {
                    data[i + 3] = 0; // Set background to completely transparent
                }
            }
            // Write the corrected, fully-vibrant pixel data back to the canvas
            tempCtx.putImageData(imgData, 0, 0);

            const opaqueRatio = opaquePixels / totalPixels;
            console.log('Cutout opacity ratio after Safari alpha restoration:', opaqueRatio);

            // 4. Smart blank-detection: if less than 1.5% of pixels are opaque,
            // the model over-erased the item. Fall back gracefully to original photo.
            if (opaqueRatio < 0.015) {
                console.warn('Over-erasing detected! Opaque ratio too low. Falling back to original image.');
                setBgError('Background removal over-erased this item. Using original photo instead.');
                setProcessedFile(null);
                setPreviewUrl(URL.createObjectURL(file));
                setBgRemoved(false);
                setIsRemovingBg(false);
                return;
            }

            // 5. Composite onto a beautiful clean off-white background
            const canvas = document.createElement('canvas');
            canvas.width = tempCanvas.width;
            canvas.height = tempCanvas.height;
            const ctx = canvas.getContext('2d');

            // Fill with solid off-white (#f7f7f5)
            ctx.fillStyle = '#f7f7f5';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw the transparent cutout on top
            ctx.drawImage(cutoutImg, 0, 0);

            // Convert canvas to a high-quality JPEG
            canvas.toBlob(async (finalBlob) => {
                const cleanFile = new File([finalBlob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
                setProcessedFile(cleanFile);
                setPreviewUrl(canvas.toDataURL('image/jpeg', 0.92));
                setBgRemoved(true);
                setIsRemovingBg(false);
                console.log('Successfully composited cutout onto #f7f7f5 background.');
            }, 'image/jpeg', 0.92);
        } catch (err) {
            console.error('BG removal error:', err);
            setBgError('Could not remove background. Check your connection or try again.');
            setIsRemovingBg(false);
        }
    };

    // The file to actually upload: processed (bg removed) or original
    const uploadFile = processedFile || file;

    const handleAutoTag = async () => {
        if (!file) return;
        setIsAutoTagging(true);
        setAutoTagError('');
        try {
            // Always send the ORIGINAL file to Gemini Vision for best accuracy.
            // Background-removed images lose colour & texture info the AI needs.
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Full = reader.result;
                const [meta, imageBase64] = base64Full.split(',');
                const mimeType = meta.match(/:(.*?);/)[1];

                const res = await fetch(`${API_BASE}/api/wardrobe/analyze-image`, {
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
        if (e && e.preventDefault) e.preventDefault();

        // For new items, image is required
        if (!isEditMode && !uploadFile) { alert("Please upload an image first!"); return; }

        setIsSubmitting(true);

        const finalColor = formData.color === '__custom' ? formData.customColor : formData.color;

        try {
            let res;
            if (isEditMode) {
                // PUT JSON for editing (no image change)
                res = await fetch(`${API_BASE}/api/wardrobe/${editItem._id}`, {
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
                        brand: formData.brand,
                        size: formData.size,
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
                payload.append('brand', formData.brand);
                payload.append('size', formData.size);

                res = await fetch(`${API_BASE}/api/wardrobe`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: payload,
                });

                if (res.ok) {
                    const newItem = await res.json();
                    onAdd(newItem);
                    onClose();
                    // State will be reset by the useEffect when modal closes/opens
                } else {
                    const errorData = await res.json();
                    alert(`Failed to add item: ${errorData.message || res.statusText}. Check server logs.`);
                }
            }
        } catch (err) {
            console.error(err);
            alert(isEditMode ? 'Error updating item.' : 'Error adding item.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="step-container fadeIn">
                        <p className="step-desc">Start by uploading a photo of your item.</p>
                        <div className="form-group file-upload">
                            {previewUrl ? (
                                <label htmlFor="file-upload" className="upload-btn upload-btn-compact">
                                    <div className="upload-preview-wrap">
                                        <img src={previewUrl} alt="preview" className="upload-preview-img" />
                                        {bgRemoved && <div className="bg-removed-badge"><CheckCircle size={13} /> Clean Look</div>}
                                    </div>
                                </label>
                            ) : isConverting ? (
                                <div className="upload-btn flex-center">
                                    <Loader className="spin" size={30} color="var(--accent-primary)" />
                                    <span>Converting HEIC...</span>
                                </div>
                            ) : (
                                <div className="photo-source-btns">
                                    <label htmlFor="camera-upload" className="photo-source-btn">
                                        <Camera size={22} />
                                        <span>Take Photo</span>
                                    </label>
                                    <label htmlFor="file-upload" className="photo-source-btn">
                                        <Upload size={22} />
                                        <span>Gallery</span>
                                    </label>
                                </div>
                            )}
                            {/* Gallery picker */}
                            <input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                            {/* Camera direct */}
                            <input id="camera-upload" type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />

                            {file && !bgRemoved && (
                                <button type="button" className={`bgremove-btn ${isRemovingBg ? 'loading' : ''}`} onClick={handleRemoveBackground} disabled={isRemovingBg}>
                                    {isRemovingBg ? <><Loader size={16} className="spin" /> Removing BG...</> : <><Image size={16} /> 🪄 Remove Background</>}
                                </button>
                            )}
                        </div>
                        <button type="button" className="cta-button" onClick={handleAutoTagAndNext} disabled={!file || isRemovingBg || isAutoTagging}>
                            {isAutoTagging ? <><Loader size={18} className="spin" /> AI Analyzing...</> : <><Sparkles size={18} /> Next: AI Auto-Tag</>}
                        </button>
                    </div>
                );
            case 2:
                return (
                    <div className="step-container fadeIn">
                        <p className="step-desc">AI has auto-filled these details. Quick check?</p>
                        <div className="form-group">
                            <label>Item Name <span style={{color:'var(--text-secondary)',fontWeight:400}}>(optional nickname)</span></label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. My favourite hoodie"
                                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Gender</label>
                                <select name="gender" value={formData.gender} onChange={handleChange}>
                                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select name="category" value={formData.category} onChange={handleChange}>
                                    {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Brand</label>
                                <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="e.g. Zara" />
                            </div>
                            <div className="form-group">
                                <label>Size</label>
                                <input type="text" name="size" value={formData.size} onChange={handleChange} placeholder="e.g. M, 32" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Specific Type</label>
                                <select name="type" value={formData.type} onChange={handleChange}>
                                    <option value="">— Select —</option>
                                    {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Color</label>
                                <select name="color" value={formData.color} onChange={handleChange}>
                                    {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                    <option value="__custom">Other…</option>
                                </select>
                                {formData.color === '__custom' && (
                                    <input type="text" name="customColor" placeholder="Color name" value={formData.customColor} onChange={handleChange} className="mt-2" />
                                )}
                            </div>
                        </div>
                        <div className="btn-group">
                            <button type="button" className="cta-button secondary-btn" onClick={prevStep}>Back</button>
                            <button type="button" className="cta-button" onClick={nextStep}>Next: Final Details</button>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="step-container fadeIn">
                        <p className="step-desc">Almost there! Add more context if you want.</p>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Season</label>
                                <select name="season" value={formData.season} onChange={handleChange}>
                                    {SEASON_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Formality</label>
                                <select name="formality" value={formData.formality} onChange={handleChange}>
                                    {FORMALITY_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Style Vibe</label>
                            <select name="style" value={formData.style} onChange={handleChange}>
                                <option value="">— Select —</option>
                                {STYLE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Occasions</label>
                            <div className="occasion-chips">
                                {OCCASIONS.map(occ => (
                                    <button
                                        key={occ}
                                        type="button"
                                        className={`occasion-chip ${formData.occasions.includes(occ) ? 'selected' : ''}`}
                                        onClick={() => toggleOccasion(occ)}
                                    >
                                        {occ}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Purchase Price (₹)</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    name="purchasePrice"
                                    value={formData.purchasePrice}
                                    onChange={handleChange}
                                    placeholder="e.g. 1999"
                                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                                />
                            </div>
                            <div className="form-group">
                                <label>Purchase Date</label>
                                <input
                                    type="date"
                                    name="purchaseDate"
                                    value={formData.purchaseDate}
                                    onChange={handleChange}
                                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Style Notes <span style={{color:'var(--text-secondary)',fontWeight:400}}>(optional)</span></label>
                            <input
                                type="text"
                                name="styleNotes"
                                value={formData.styleNotes}
                                onChange={handleChange}
                                placeholder="e.g. Pairs great with white sneakers"
                                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                            />
                        </div>
                        <div className="btn-group">
                            <button type="button" className="cta-button secondary-btn" onClick={prevStep}>Back</button>
                            <button type="button" className="cta-button" disabled={isSubmitting} onClick={handleSubmit}>
                                {isSubmitting ? 'Saving...' : 'Finish & Save'}
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const handleAutoTagAndNext = async () => {
        await handleAutoTag();
        nextStep();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card mobile-optimized">
                <button className="close-btn" onClick={onClose}><X size={20} /></button>
                <div className="modal-header-simple">
                    <h2>{isEditMode ? 'Edit Item' : 'Add Item'}</h2>
                    {!isEditMode && (
                        <div className="step-indicator">
                            <span className={step >= 1 ? 'active' : ''}></span>
                            <span className={step >= 2 ? 'active' : ''}></span>
                            <span className={step >= 3 ? 'active' : ''}></span>
                        </div>
                    )}
                </div>

                <form 
                    onSubmit={(e) => e.preventDefault()}
                    className="add-item-form-progressive"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault();
                    }}
                >
                    {renderStep()}
                </form>
            </div>
        </div>
    );
};

export default AddItemModal;
