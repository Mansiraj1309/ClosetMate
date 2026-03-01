const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const Item = require('../models/Item');

// @route   POST /api/wardrobe
// @desc    Upload an image to Cloudinary and save item details to MongoDB
// @access  Public (for now, until we add user auth)
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { category, color, season, formality, styleNotes } = req.body;

        // upload.single('image') attached the file to req.file
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        const newItem = new Item({
            imageUrl: req.file.path, // Cloudinary URL
            cloudinaryId: req.file.filename,
            category,
            color,
            season,
            formality,
            styleNotes,
        });

        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (err) {
        console.error('Error saving item:', err);
        res.status(500).json({ message: 'Server error saving item' });
    }
});

// @route   GET /api/wardrobe
// @desc    Get all wardrobe items
// @access  Public
router.get('/', async (req, res) => {
    try {
        const items = await Item.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        console.error('Error fetching items:', err);
        res.status(500).json({ message: 'Server error fetching items' });
    }
});

// @route   DELETE /api/wardrobe/:id
// @desc    Delete a wardrobe item from DB and Cloudinary
// @access  Public
router.delete('/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Optionally delete from Cloudinary here as well using item.cloudinaryId
        // await cloudinary.uploader.destroy(item.cloudinaryId);

        await item.deleteOne();
        res.json({ message: 'Item removed' });
    } catch (err) {
        console.error('Error deleting item:', err);
        res.status(500).json({ message: 'Server error deleting item' });
    }
});

module.exports = router;
