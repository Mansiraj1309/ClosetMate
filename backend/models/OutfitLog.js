const mongoose = require('mongoose');

const outfitLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    occasion: {
        type: String,
        default: '',
    },
    itemIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
    }],
    notes: {
        type: String,
        default: '',
    },
}, { timestamps: true });

// Index for fast lookup by user + date
outfitLogSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('OutfitLog', outfitLogSchema);
