const express = require('express');
const router = express.Router();
const OutfitLog = require('../models/OutfitLog');
const Item = require('../models/Item');
const auth = require('../middleware/auth');

// @route   POST /api/logs
// @desc    Save a new outfit log entry for today (or a specified date)
router.post('/', auth, async (req, res) => {
    try {
        const { date, occasion, itemIds, notes } = req.body;
        if (!itemIds || itemIds.length === 0) {
            return res.status(400).json({ message: 'At least one item ID is required' });
        }

        const logDate = date ? new Date(date) : new Date();
        // Normalize to start of day UTC
        logDate.setUTCHours(0, 0, 0, 0);

        // Upsert: if a log for this user+date already exists, update it
        const log = await OutfitLog.findOneAndUpdate(
            { userId: req.userId, date: logDate },
            { occasion: occasion || '', itemIds, notes: notes || '' },
            { new: true, upsert: true }
        );

        res.status(201).json(log);
    } catch (err) {
        console.error('Error saving outfit log:', err);
        res.status(500).json({ message: 'Server error saving outfit log' });
    }
});

// @route   GET /api/logs
// @desc    Get all outfit logs for the logged-in user (optionally filtered by month YYYY-MM)
router.get('/', auth, async (req, res) => {
    try {
        const filter = { userId: req.userId };

        if (req.query.month) {
            const [year, month] = req.query.month.split('-').map(Number);
            const start = new Date(Date.UTC(year, month - 1, 1));
            const end = new Date(Date.UTC(year, month, 1));
            filter.date = { $gte: start, $lt: end };
        }

        const logs = await OutfitLog.find(filter)
            .populate('itemIds', 'name imageUrl category color type')
            .sort({ date: -1 });

        res.json(logs);
    } catch (err) {
        console.error('Error fetching outfit logs:', err);
        res.status(500).json({ message: 'Server error fetching logs' });
    }
});

// @route   GET /api/logs/date/:dateStr
// @desc    Get the outfit log for a specific date (YYYY-MM-DD)
router.get('/date/:dateStr', auth, async (req, res) => {
    try {
        const d = new Date(req.params.dateStr);
        d.setUTCHours(0, 0, 0, 0);

        const log = await OutfitLog.findOne({ userId: req.userId, date: d })
            .populate('itemIds', 'name imageUrl category color type');

        if (!log) return res.status(404).json({ message: 'No log for this date' });
        res.json(log);
    } catch (err) {
        console.error('Error fetching log by date:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/logs/:id
// @desc    Delete a log entry by ID
router.delete('/:id', auth, async (req, res) => {
    try {
        const log = await OutfitLog.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!log) return res.status(404).json({ message: 'Log not found' });
        res.json({ message: 'Log deleted' });
    } catch (err) {
        console.error('Error deleting log:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
