const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const auth = require('../middleware/auth');

// @route   GET /api/stats
// @desc    Get wardrobe statistics & analytics for the logged-in user
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const allItems = await Item.find({ userId }).lean();
        const totalItems = allItems.length;

        // Category breakdown
        const categoryBreakdown = {};
        const seasonBreakdown = {};
        allItems.forEach(item => {
            categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
            if (item.season) seasonBreakdown[item.season] = (seasonBreakdown[item.season] || 0) + 1;
        });

        const totalCategories = Object.keys(categoryBreakdown).length;

        // Most worn (top 3)
        const mostWorn = [...allItems]
            .filter(i => i.wearCount > 0)
            .sort((a, b) => b.wearCount - a.wearCount)
            .slice(0, 3)
            .map(i => ({ _id: i._id, name: i.name || `${i.color} ${i.category}`, imageUrl: i.imageUrl, wearCount: i.wearCount }));

        // Least worn (bottom 3, wearCount > 0)
        const leastWorn = [...allItems]
            .filter(i => i.wearCount > 0)
            .sort((a, b) => a.wearCount - b.wearCount)
            .slice(0, 3)
            .map(i => ({ _id: i._id, name: i.name || `${i.color} ${i.category}`, imageUrl: i.imageUrl, wearCount: i.wearCount }));

        // Unused items (never worn)
        const unusedItems = allItems
            .filter(i => !i.wearCount || i.wearCount === 0)
            .map(i => ({ _id: i._id, name: i.name || `${i.color} ${i.category}`, imageUrl: i.imageUrl }));

        res.json({
            totalItems,
            totalCategories,
            categoryBreakdown,
            seasonBreakdown,
            mostWorn,
            leastWorn,
            unusedCount: unusedItems.length,
            unusedItems: unusedItems.slice(0, 5), // top 5 for display
        });
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
});

module.exports = router;
