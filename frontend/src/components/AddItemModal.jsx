import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import './AddItemModal.css';

const AddItemModal = ({ isOpen, onClose, onAdd }) => {
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        category: 'tops',
        color: '',
        season: 'all-season',
        formality: 'casual',
        styleNotes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            alert("Please upload an image first!");
            return;
        }

        setIsSubmitting(true);

        // Create FormData object for Multer
        const payload = new FormData();
        payload.append('image', file);
        Object.keys(formData).forEach(key => payload.append(key, formData[key]));

        try {
            const res = await fetch('http://localhost:5000/api/wardrobe', {
                method: 'POST',
                body: payload, // Let browser set Content-Type to multipart/form-data
            });

            if (res.ok) {
                const newItem = await res.json();
                onAdd(newItem); // Update parent state
                onClose();      // Close modal
            } else {
                alert("Failed to add item. Check server logs.");
            }
        } catch (err) {
            console.error(err);
            alert("Error adding item.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card">
                <button className="close-btn" onClick={onClose}><X size={20} /></button>
                <h2>Add to Wardrobe</h2>

                <form onSubmit={handleSubmit} className="add-item-form">
                    <div className="form-group file-upload">
                        <label htmlFor="file-upload" className="upload-btn">
                            <Upload size={20} />
                            {file ? file.name : 'Upload Image'}
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Category</label>
                            <select name="category" value={formData.category} onChange={handleChange}>
                                <option value="tops">Tops</option>
                                <option value="bottoms">Bottoms</option>
                                <option value="dresses">Dresses/Suits</option>
                                <option value="outerwear">Outerwear</option>
                                <option value="shoes">Shoes</option>
                                <option value="accessories">Accessories</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Color</label>
                            <input
                                type="text"
                                name="color"
                                placeholder="e.g. Navy Blue"
                                value={formData.color}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Season</label>
                            <select name="season" value={formData.season} onChange={handleChange}>
                                <option value="summer">Summer</option>
                                <option value="winter">Winter</option>
                                <option value="spring_fall">Spring/Fall</option>
                                <option value="all-season">All Season</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Formality</label>
                            <select name="formality" value={formData.formality} onChange={handleChange}>
                                <option value="casual">Casual</option>
                                <option value="smart-casual">Smart Casual</option>
                                <option value="formal">Formal / Business</option>
                                <option value="party">Party / Night Out</option>
                                <option value="ethnic">Ethnic / Traditional</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Tags & Notes (Optional)</label>
                        <input
                            type="text"
                            name="styleNotes"
                            placeholder="e.g. Silk shirt, favorite for dates"
                            value={formData.styleNotes}
                            onChange={handleChange}
                        />
                    </div>

                    <button type="submit" className="cta-button submit-btn" disabled={isSubmitting}>
                        {isSubmitting ? 'Uploading...' : 'Save to Wardrobe'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddItemModal;
