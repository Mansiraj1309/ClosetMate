const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        default: '',
    },
    imageUrl: {
        type: String,
        required: true,
    },
    cloudinaryId: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        default: '',
    },
    color: {
        type: String,
        required: true,
    },
    season: {
        type: String,
        required: true,
    },
    formality: {
        type: String,
        required: true,
    },
    occasions: {
        type: [String],
        default: [],
    },
    style: {
        type: String,
        default: '',
    },
    gender: {
        type: String,
        default: 'Unisex',
    },
    wearCount: {
        type: Number,
        default: 0,
    },
    lastWorn: {
        type: Date,
        default: null,
    },
    tags: {
        type: [String],
        default: [],
    },
    styleNotes: {
        type: String,
        default: '',
    },
    purchasePrice: {
        type: Number,
        default: null,
    },
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
