const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

// @route   GET /api/stats
// @desc    Get wardrobe statistics for the Dashboard
// @access  Public
router.get('/', async (req, res) => {
    try {
        const totalItems = await Item.countDocuments();

        // Count unique category combinations for "outfits potential"
        const categories = await Item.distinct('category');

        // Count items by category
        const categoryBreakdown = {};
        for (const cat of categories) {
            categoryBreakdown[cat] = await Item.countDocuments({ category: cat });
        }

        res.json({
            totalItems,
            totalCategories: categories.length,
            categoryBreakdown
        });
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
});

module.exports = router;
