const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const auth = require('../middleware/auth');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// @route   POST /api/stylist/recommend
// @desc    Get an outfit recommendation + shopping suggestions for the logged-in user
router.post('/recommend', auth, async (req, res) => {
    try {
        const { occasion, season, style } = req.body;

        if (!occasion) {
            return res.status(400).json({ message: 'Occasion is required' });
        }

        // Fetch only THIS user's wardrobe
        const wardrobeItems = await Item.find({ userId: req.userId });

        if (wardrobeItems.length === 0) {
            return res.status(400).json({
                message: 'Your wardrobe is empty! Add some clothes first.'
            });
        }

        const formattedWardrobe = wardrobeItems.map(item => ({
            id: item._id,
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

        // Build extra context from optional structured inputs
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
2. If the outfit is incomplete or could be significantly improved with items they DON'T own, suggest 1-3 specific items to BUY, including what the item is, why it would complete the look, where to buy it (real stores/websites), and an estimated price range in INR.

Occasion: "${occasion}"
${extraContext.length ? extraContext.join('\n') : ''}

Available Wardrobe (${wardrobeItems.length} items):
${JSON.stringify(formattedWardrobe, null, 2)}

Please return the response IN RAW JSON FORMAT EXACTLY like this structure, with no markdown code blocks or extra text:
{
  "rationale": "A brief, stylish explanation of why you chose these items for the occasion.",
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
      "item": "Name of the item to buy (e.g. 'Black leather Chelsea boots')",
      "slot": "shoes",
      "reason": "Why this item would complete or elevate the outfit",
      "whereToBuy": [
        { "name": "Myntra", "url": "https://www.myntra.com" },
        { "name": "Ajio", "url": "https://www.ajio.com" },
        { "name": "Amazon India", "url": "https://www.amazon.in" }
      ],
      "estimatedPrice": "₹1,500 - ₹3,000"
    }
  ]
}

Rules:
- selectedItemIds MUST only contain valid IDs from the wardrobe list above.
- outfitBreakdown values must be IDs from the wardrobe list, or null if that slot is not filled.
- If the wardrobe already has everything needed for a perfect outfit, return an empty shoppingSuggestions array.
- For festivals like Holi, Diwali, Eid etc., suggest culturally appropriate attire.
- For style-specific requests (e.g. gothic, streetwear), tailor your picks to that aesthetic.
- Always suggest real Indian e-commerce stores (Myntra, Ajio, Amazon India, Flipkart, Tata CLiQ) with their actual website URLs.
- Prices should be realistic estimates in Indian Rupees (₹).
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        let aiText = response.text;
        // Strip markdown code fences if present
        aiText = aiText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

        const parsedResponse = JSON.parse(aiText);

        const selectedOutfit = await Item.find({
            '_id': { $in: parsedResponse.selectedItemIds },
            userId: req.userId
        });

        // Increment wearCount for recommended items
        await Item.updateMany(
            { '_id': { $in: parsedResponse.selectedItemIds }, userId: req.userId },
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
        res.status(500).json({ message: 'Failed to generate recommendation. Check AI API Key or try again later.' });
    }
});

module.exports = router;
