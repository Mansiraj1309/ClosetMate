const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
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
        required: true, // e.g., 'tops', 'bottoms', 'shoes', 'accessories'
    },
    color: {
        type: String,
        required: true, // e.g., 'red', 'blue'
    },
    season: {
        type: String,
        required: true, // e.g., 'summer', 'winter', 'all-season'
    },
    formality: {
        type: String,
        required: true, // e.g., 'casual', 'formal', 'party', 'ethnic'
    },
    styleNotes: {
        type: String, // Any specific details from the user
        default: '',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Item', itemSchema);
