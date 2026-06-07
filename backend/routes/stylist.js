const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const auth = require('../middleware/auth');
const { GoogleGenAI } = require('@google/genai'); // ✅ FIXED: use new SDK, not @google/generative-ai

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Model fallback chain — if primary model fails, try the next
const MODEL_CHAIN = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

// Helper: call Gemini with retry on rate limit + automatic model fallback
const callGemini = async (prompt) => {
    const maxAttempts = 2;
    for (const model of MODEL_CHAIN) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                console.log(`Calling Gemini model: ${model} (attempt ${attempt + 1})`);
                const response = await ai.models.generateContent({
                    model,
                    contents: [{ parts: [{ text: prompt }] }],
                });
                return response.text;
            } catch (err) {
                const isRetryable = err.status === 429 || err.code === 429;
                const isBlocked = err.status === 403 || err.status === 400;
                if (isRetryable && attempt < maxAttempts - 1) {
                    console.log(`Rate limited on ${model}. Retry ${attempt + 1}...`);
                    await new Promise(resolve => setTimeout(resolve, 4000));
                } else if (isBlocked || (isRetryable && attempt === maxAttempts - 1)) {
                    console.log(`Model ${model} failed (${err.status}), trying next model...`);
                    break; // try next model in chain
                } else {
                    throw err;
                }
            }
        }
    }
    throw new Error('All Gemini models failed. Please try again later.');
};

// @route   POST /api/stylist/recommend
router.post('/recommend', auth, async (req, res) => {
    try {
        const { occasion, season, style } = req.body;

        if (!occasion) {
            return res.status(400).json({ message: 'Occasion is required' });
        }

        const wardrobeItems = await Item.find({ userId: req.userId });

        if (wardrobeItems.length === 0) {
            return res.status(400).json({
                message: 'Your wardrobe is empty! Add some clothes first.'
            });
        }

        const formattedWardrobe = wardrobeItems.map(item => ({
            id: item._id.toString(), // ✅ FIXED: ensure string IDs for JSON parsing
            name: item.name || '',
            category: item.category,
            type: item.type || '',
            color: item.color,
            season: item.season,
            formality: item.formality,
            occasions: item.occasions || [],
            style: item.style || '',
            gender: item.gender || 'Unisex',
            wearCount: item.wearCount || 0,
            notes: item.styleNotes
        }));

        const extraContext = [];
        if (season) extraContext.push(`Preferred season/weather: ${season}`);
        if (style) extraContext.push(`Preferred style: ${style}`);

        const prompt = `
You are an expert fashion stylist and personal shopper. You will be provided with a JSON list of clothing items available in a user's digital wardrobe, and a specific occasion they are dressing for.

Your goals:
1. Build the BEST complete outfit for the occasion from their available clothes.
   - A complete outfit should include: Top, Bottom, Shoes, and optionally Outerwear/Accessories.
   - Consider color compatibility, style cohesion, season suitability, formality level, and gender.
   - Prefer items suited to the occasion (check the "occasions" array, formality, and style fields).
   - Prefer less-worn items when quality of match is similar (check wearCount).
2. If the outfit is incomplete or could be significantly improved with items they DON'T own, suggest 1-3 specific items to BUY.

Occasion: "${occasion}"
${extraContext.length ? extraContext.join('\n') : ''}

Available Wardrobe (${wardrobeItems.length} items):
${JSON.stringify(formattedWardrobe, null, 2)}

Return ONLY raw JSON, no markdown, no extra text:
{
  "rationale": "A brief, stylish explanation of why you chose these items.",
  "outfitBreakdown": {
    "top": "id or null",
    "bottom": "id or null",
    "shoes": "id or null",
    "outerwear": "id or null",
    "accessory": "id or null"
  },
  "selectedItemIds": ["id1", "id2", "id3"],
  "shoppingSuggestions": [
    {
      "item": "Black leather Chelsea boots",
      "slot": "shoes",
      "reason": "Why this item would complete the outfit",
      "whereToBuy": [
        { "name": "Myntra", "url": "https://www.myntra.com" },
        { "name": "Ajio", "url": "https://www.ajio.com" }
      ],
      "estimatedPrice": "₹1,500 - ₹3,000"
    }
  ]
}

Rules:
- selectedItemIds MUST only contain valid IDs from the wardrobe list above.
- outfitBreakdown values must be IDs from the wardrobe list, or null.
- For festivals like Holi, Diwali, Eid suggest culturally appropriate attire.
- Always use real Indian e-commerce stores with actual URLs.
- Prices in Indian Rupees (₹).
`;

        let aiText = await callGemini(prompt);
        aiText = aiText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

        const parsedResponse = JSON.parse(aiText);

        // ✅ FIXED: convert IDs to strings for proper MongoDB query
        const selectedIds = (parsedResponse.selectedItemIds || []).map(id => id.toString());

        const selectedOutfit = await Item.find({
            '_id': { $in: selectedIds },
            userId: req.userId
        });

        await Item.updateMany(
            { '_id': { $in: selectedIds }, userId: req.userId },
            { $inc: { wearCount: 1 }, $set: { lastWorn: new Date() } }
        );

        res.json({
            rationale: parsedResponse.rationale,
            outfitBreakdown: parsedResponse.outfitBreakdown || null,
            outfit: selectedOutfit,
            shoppingSuggestions: parsedResponse.shoppingSuggestions || [],
        });

    } catch (err) {
        console.error('AI Stylist Error:', err);
        const errMsg = err.status === 429
            ? 'AI model is rate-limited. Please wait 30 seconds and try again.'
            : `AI Stylist error: ${err.message || 'Unknown error'}`;
        res.status(500).json({ message: errMsg });
    }
});

// @route   POST /api/stylist/packing-list
router.post('/packing-list', auth, async (req, res) => {
    try {
        const { destination, duration, activities } = req.body;

        if (!destination || !duration) {
            return res.status(400).json({ message: 'Destination and duration are required' });
        }

        const wardrobeItems = await Item.find({ userId: req.userId });

        if (wardrobeItems.length === 0) {
            return res.status(400).json({
                message: 'Your wardrobe is empty! Add some clothes first before planning a trip.'
            });
        }

        const formattedWardrobe = wardrobeItems.map(item => ({
            id: item._id.toString(),
            name: item.name || '',
            category: item.category,
            type: item.type || '',
            color: item.color,
            season: item.season,
            formality: item.formality,
            occasions: item.occasions || [],
            style: item.style || '',
            wearCount: item.wearCount || 0
        }));

        const prompt = `
You are an expert travel stylist. You will be given a user's wardrobe and trip details.

Trip Details:
- Destination: ${destination}
- Duration: ${duration} days
- Planned Activities: ${activities || 'General sightseeing and relaxing'}

Goals:
1. Build a smart, versatile packing list from their existing wardrobe.
2. Group items into categories (Tops, Bottoms, Shoes, Outerwear/Accessories).
3. Create a day-by-day outfit plan using the packed items.
4. If missing essential items, suggest 1-3 specific items to BUY with Indian store links.

Available Wardrobe (${wardrobeItems.length} items):
${JSON.stringify(formattedWardrobe, null, 2)}

Return ONLY raw JSON, no markdown:
{
  "rationale": "Packing strategy summary.",
  "packingList": {
    "tops": ["id1", "id2"],
    "bottoms": ["id3"],
    "shoes": ["id4"],
    "outerwearAndAccessories": ["id5"]
  },
  "dayByDay": [
    { "day": 1, "theme": "Travel & Arrival", "outfitIds": ["id1", "id3", "id4"] }
  ],
  "shoppingSuggestions": [
    {
      "item": "Floral Swim trunks",
      "reason": "Essential for beach activities",
      "whereToBuy": [{ "name": "Myntra", "url": "https://www.myntra.com" }],
      "estimatedPrice": "₹800 - ₹1,500"
    }
  ]
}

Rules:
- All IDs must be valid from the wardrobe JSON.
- dayByDay max 7 entries.
- Prices in Indian Rupees (₹). Real stores only.
`;

        let aiText = await callGemini(prompt);
        aiText = aiText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

        const parsedResponse = JSON.parse(aiText);

        const allNeededIds = new Set();
        Object.values(parsedResponse.packingList || {}).flat().forEach(id => allNeededIds.add(id.toString()));

        const selectedItems = await Item.find({
            '_id': { $in: Array.from(allNeededIds) },
            userId: req.userId
        });

        res.json({
            rationale: parsedResponse.rationale,
            packingList: parsedResponse.packingList,
            dayByDay: parsedResponse.dayByDay || [],
            shoppingSuggestions: parsedResponse.shoppingSuggestions || [],
            populatedItems: selectedItems
        });

    } catch (err) {
        console.error('AI Packing List Error:', err);
        const errMsg = err.status === 429
            ? 'AI model is rate-limited. Please wait 30 seconds and try again.'
            : `AI Packing error: ${err.message || 'Unknown error'}`;
        res.status(500).json({ message: errMsg });
    }
});

module.exports = router;
