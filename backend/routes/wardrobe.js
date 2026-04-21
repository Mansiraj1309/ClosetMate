const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const Item = require('../models/Item');
const auth = require('../middleware/auth');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// All wardrobe routes are now protected — user must be logged in

// @route   POST /api/wardrobe
// @desc    Upload an image and save item details for the logged-in user
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        const {
            name, category, type, color, season, formality,
            occasions, style, gender, tags, styleNotes, purchasePrice, purchaseDate
        } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        // Parse JSON arrays sent as strings from FormData
        let parsedOccasions = [];
        if (occasions) {
            try { parsedOccasions = JSON.parse(occasions); } catch { parsedOccasions = [occasions]; }
        }
        let parsedTags = [];
        if (tags) {
            try { parsedTags = JSON.parse(tags); } catch { parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean); }
        }

        const newItem = new Item({
            userId: req.userId,
            name: name || '',
            imageUrl: req.file.path,
            cloudinaryId: req.file.filename,
            category,
            type: type || '',
            color,
            season,
            formality,
            occasions: parsedOccasions,
            style: style || '',
            gender: gender || 'Unisex',
            tags: parsedTags,
            styleNotes: styleNotes || '',
            purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
            purchaseDate: purchaseDate ? new Date(purchaseDate) : Date.now(),
        });

        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (err) {
        console.error('Error saving item:', err);
        res.status(500).json({ message: 'Server error saving item' });
    }
});

// @route   GET /api/wardrobe
// @desc    Get all wardrobe items for the logged-in user (with optional filters & search)
router.get('/', auth, async (req, res) => {
    try {
        const filter = { userId: req.userId };

        // Optional filters via query params
        if (req.query.category) filter.category = req.query.category;
        if (req.query.season) filter.season = req.query.season;
        if (req.query.formality) filter.formality = req.query.formality;
        if (req.query.style) filter.style = req.query.style;
        if (req.query.color) filter.color = { $regex: req.query.color, $options: 'i' };
        if (req.query.gender) filter.gender = req.query.gender;
        if (req.query.type) filter.type = { $regex: req.query.type, $options: 'i' };

        // Text search across name, tags, color, type
        if (req.query.search) {
            const s = { $regex: req.query.search, $options: 'i' };
            filter.$or = [
                { name: s },
                { color: s },
                { type: s },
                { tags: s },
                { styleNotes: s },
            ];
        }

        const items = await Item.find(filter).sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        console.error('Error fetching items:', err);
        res.status(500).json({ message: 'Server error fetching items' });
    }
});

// @route   PUT /api/wardrobe/:id
// @desc    Update an existing wardrobe item's details (no image change)
router.put('/:id', auth, async (req, res) => {
    try {
        const {
            name, category, type, color, season, formality,
            occasions, style, gender, tags, styleNotes, purchasePrice, purchaseDate
        } = req.body;

        // Parse JSON arrays sent as strings
        let parsedOccasions;
        if (occasions !== undefined) {
            try { parsedOccasions = JSON.parse(occasions); } catch { parsedOccasions = Array.isArray(occasions) ? occasions : [occasions]; }
        }
        let parsedTags;
        if (tags !== undefined) {
            try { parsedTags = JSON.parse(tags); } catch { parsedTags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : tags; }
        }

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (category !== undefined) updates.category = category;
        if (type !== undefined) updates.type = type;
        if (color !== undefined) updates.color = color;
        if (season !== undefined) updates.season = season;
        if (formality !== undefined) updates.formality = formality;
        if (style !== undefined) updates.style = style;
        if (gender !== undefined) updates.gender = gender;
        if (styleNotes !== undefined) updates.styleNotes = styleNotes;
        if (parsedOccasions !== undefined) updates.occasions = parsedOccasions;
        if (parsedTags !== undefined) updates.tags = parsedTags;
        if (purchasePrice !== undefined) updates.purchasePrice = purchasePrice ? parseFloat(purchasePrice) : null;
        if (purchaseDate !== undefined) updates.purchaseDate = purchaseDate ? new Date(purchaseDate) : Date.now();

        const item = await Item.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { $set: updates },
            { new: true }
        );
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
    } catch (err) {
        console.error('Error updating item:', err);
        res.status(500).json({ message: 'Server error updating item' });
    }
});

// @route   PATCH /api/wardrobe/:id/wear
// @desc    Increment wearCount and set lastWorn date
router.patch('/:id/wear', auth, async (req, res) => {
    try {
        const item = await Item.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { $inc: { wearCount: 1 }, $set: { lastWorn: new Date() } },
            { new: true }
        );
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
    } catch (err) {
        console.error('Error updating wear:', err);
        res.status(500).json({ message: 'Server error updating wear count' });
    }
});

// @route   DELETE /api/wardrobe/:id
// @desc    Delete a wardrobe item (only if it belongs to the logged-in user)
router.delete('/:id', auth, async (req, res) => {
    try {
        const item = await Item.findOne({ _id: req.params.id, userId: req.userId });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        await item.deleteOne();
        res.json({ message: 'Item removed' });
    } catch (err) {
        console.error('Error deleting item:', err);
        res.status(500).json({ message: 'Server error deleting item' });
    }
});

// @route   POST /api/wardrobe/analyze-image
// @desc    Use Gemini Vision to auto-tag a clothing item from its base64 image
router.post('/analyze-image', auth, async (req, res) => {
    try {
        const { imageBase64, mimeType } = req.body;
        if (!imageBase64 || !mimeType) {
            return res.status(400).json({ message: 'imageBase64 and mimeType are required' });
        }

        const prompt = `You are a fashion tagging AI. Analyze this clothing image and return structured metadata.

Return ONLY a raw JSON object (no markdown, no backticks) with EXACTLY these fields:
{
  "category": one of ["Tops", "Bottoms", "Dresses / Suits", "Outerwear", "Shoes", "Accessories", "Activewear", "Ethnic"],
  "type": specific sub-type (e.g. "T-shirt", "Jeans", "Sneakers", "Kurta" etc.),
  "color": primary color (one of: Black, White, Blue, Red, Green, Beige, Brown, Grey, Navy, Pink, Yellow, Orange, Purple, Maroon, Olive, Teal — or a descriptive color name if none match),
  "season": one of ["All Season", "Summer", "Winter", "Rainy"],
  "formality": one of ["Casual", "Smart Casual", "Formal", "Party", "Ethnic"],
  "style": one of ["Minimal", "Streetwear", "Sporty", "Elegant", "Vintage", "Classic", "Boho", "Formal", "Casual"] or empty string,
  "occasions": array of applicable occasions from ["Casual", "Office", "Business", "Party", "Wedding", "Date Night", "Festival", "Travel", "Gym", "College"],
  "styleNotes": a single short sentence describing styling tips for this item
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType, data: imageBase64 } }
                    ]
                }
            ],
        });

        let aiText = response.text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        const tags = JSON.parse(aiText);
        res.json(tags);
    } catch (err) {
        console.error('Auto-tag error:', err);
        res.status(500).json({ message: 'Failed to analyze image. Try tagging manually.' });
    }
});

module.exports = router;
