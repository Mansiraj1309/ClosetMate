const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const Item = require('../models/Item');
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
        const prompt = `You are an expert fashion AI. Carefully analyze this clothing/accessory image and return accurate metadata.

Return ONLY a raw JSON object with EXACTLY these fields (no markdown, no extra text):
{
  "gender": "Men", "Women" or "Unisex",
  "category": One of ["Tops", "Bottoms", "Dresses", "Co-ord Sets", "Loungewear", "Ethnic Wear", "Footwear", "Accessories", "Jewelry", "Outerwear", "Activewear"],
  "type": Specific type within the category (see examples below),
  "color": Primary color name,
  "season": One of ["Summer", "Winter", "Rainy", "All Season"],
  "formality": One of ["Casual", "Semi-Formal", "Formal", "Party", "Ethnic", "Sporty"],
  "style": One of ["Minimal", "Streetwear", "Classic", "Bohemian", "Gothic", "Sporty", "Vintage", "Chic"],
  "occasions": Array chosen from ["Casual", "Office", "Wedding", "Date Night", "Festival", "Travel", "Gym", "College", "Party"],
  "styleNotes": One specific premium styling tip for this item
}

GENDER RULES (follow strictly):
- If the item is clearly cut/designed for women (crop top, kurti, saree, lehenga, heels, skirt, dress, bangles, clutch, handbag, blouse) → "Women"
- If the item is clearly designed for men (kurta pajama, sherwani, dhoti, polo shirt, chinos, men's blazer) → "Men"
- Only use "Unisex" for truly gender-neutral items like plain t-shirts, hoodies, sneakers, caps, backpacks, sunglasses, watches, basic jeans

CATEGORY & TYPE examples:
- Tops: T-shirt, Oversized T-shirt, Shirt, Polo, Hoodie, Sweater, Crop Top, Blouse, Kurti, Tank Top, Kurta, Sweatshirt
- Bottoms: Jeans, Trousers, Joggers, Cargo, Shorts, Palazzo, Leggings, Skirt, Chinos, Sharara, Salwar
- Dresses: Maxi Dress, Mini Dress, Bodycon, A-Line, Shift Dress, Evening Gown, Midi Dress
- Co-ord Sets: Co-ord Set, Casual Co-ord Set, Ethnic Co-ord Set, Skirt Co-ord Set
- Loungewear: Night Suit, Pyjamas, Nighty, Tracksuit, Bathrobe
- Ethnic Wear: Saree, Salwar Suit, Lehenga, Anarkali, Kurta Set, Kurta Pajama, Sherwani, Nehru Jacket, Dupatta
- Footwear: Sneakers, Heels, Flats, Formal Shoes, Loafers, Boots, Sandals, Slippers, Ethnic Footwear
- Accessories: Watch, Belt, Cap, Sunglasses, Handbag, Clutch, Backpack, Scarf, Wallet, Hair Accessories
- Jewelry: Earrings, Necklace, Chain, Bracelet, Bangles, Ring, Anklets, Nose Ring
- Outerwear: Blazer, Jacket, Coat, Shrug, Cardigan, Denim Jacket
- Activewear: Gym Wear, Sports Bra, Track Pants, Running Shoes

COLOR RULES:
- Look at the actual dominant color carefully. Do NOT say "Black" for dark navy, burgundy, or maroon.
- Prefer: "Black", "White", "Blue", "Red", "Green", "Beige", "Brown", "Grey", "Navy", "Pink", "Yellow", "Orange", "Purple", "Maroon", "Olive", "Teal"
- For distinct shades use: "Burgundy", "Peach", "Mint Green", "Rust", "Lavender", "Mustard", "Coral", "Cream", "Ivory", "Charcoal"

Be specific and accurate. A watch → category: Accessories, type: Watch. Never leave type as a generic category name.`;

        let result;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                result = await model.generateContent([
                    { text: prompt },
                    { inlineData: { mimeType, data: imageBase64 } }
                ]);
                break;
            } catch (err) {
                if (err.status === 429 && attempts < maxAttempts - 1) {
                    attempts++;
                    console.log(`Auto-tag Rate limited. Retry ${attempts}...`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                } else {
                    throw err;
                }
            }
        }

        const response = await result.response;
        let aiText = response.text().replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        const tags = JSON.parse(aiText);
        res.json(tags);
    } catch (err) {
        console.error('Auto-tag error:', err);
        res.status(500).json({ message: 'Failed to analyze image. Try tagging manually.' });
    }
});

// @route   POST /api/wardrobe/analyze-tag
// @desc    Use Gemini Vision to extract details from a clothing tag image (OCR + AI)
router.post('/analyze-tag', auth, async (req, res) => {
    try {
        const { imageBase64, mimeType } = req.body;
        if (!imageBase64 || !mimeType) {
            return res.status(400).json({ message: 'imageBase64 and mimeType are required' });
        }

        const prompt = `You are an expert fashion inventory assistant. Analyze this image of a clothing tag and extract ALL visible technical and style information.

Return ONLY a raw JSON object with these fields (use null if not found):
{
  "brand": "Brand name (e.g. AZORTE, ZARA)",
  "name": "Full product name as on tag",
  "category": "One of [Tops, Bottoms, Dresses, Loungewear, Ethnic Wear, Footwear, Accessories, Jewelry, Outerwear, Activewear]",
  "type": "Specific item type (e.g. Saree, Kurta, T-shirt, Heels)",
  "size": "Size as on tag (e.g. L, 42, 32)",
  "color": "Color name as on tag or visible",
  "price": Number (Price value only, extract from symbols like ₹, MRP, $),
  "currency": "Currency code (e.g. INR, USD)",
  "articleId": "Product ID/Article Number/SKU",
  "fabric": "Material composition (e.g. 100% Cotton)",
  "careInstructions": "Short care summary",
  "style": "Estimated style aesthetic",
  "season": "Estimated season",
  "occasions": ["Array", "of", "occasions"],
  "formality": "Formality level"
}

If you see multiple prices, use the current sale price or MRP. Be highly accurate with the brand and price.`;

        let result;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                result = await model.generateContent([
                    { text: prompt },
                    { inlineData: { mimeType, data: imageBase64 } }
                ]);
                break;
            } catch (err) {
                if (err.status === 429 && attempts < maxAttempts - 1) {
                    attempts++;
                    console.log(`Tag analyze Rate limited. Retry ${attempts}...`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                } else {
                    throw err;
                }
            }
        }

        const response = await result.response;
        let aiText = response.text().replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        const tagData = JSON.parse(aiText);
        res.json(tagData);
    } catch (err) {
        console.error('Tag analyze error:', err);
        res.status(500).json({ message: 'Failed to read tag. Try a clearer photo or enter manually.' });
    }
});

module.exports = router;
