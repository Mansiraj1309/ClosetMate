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

        let aiText;
        try {
            aiText = response.text;
            if (!aiText) throw new Error("Empty AI response");
            
            // Strip markdown code fences if present
            aiText = aiText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        } catch (respErr) {
            console.error('AI Response Extract Error:', respErr);
            throw new Error(`AI generated invalid response format: ${respErr.message}`);
        }

        let parsedResponse;
        try {
            parsedResponse = JSON.parse(aiText);
        } catch (parseErr) {
            console.error('AI JSON Parse Error:', parseErr, 'Raw Text:', aiText);
            throw new Error("AI failed to generate a valid wardrobe selection. Try a different prompt.");
        }

        const selectedOutfit = await Item.find({
            '_id': { $in: parsedResponse.selectedItemIds || [] },
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
        res.status(500).json({ message: err.message || 'AI Stylist is currently unavailable.' });
    }
});

// @route   POST /api/stylist/packing-list
// @desc    Generate a packing list for a trip based on user's wardrobe
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
            id: item._id,
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
You are an expert travel stylist and personal shopper. You will be provided with a JSON list of clothing items available in a user's digital wardrobe, alongside details about an upcoming trip.

Trip Details:
- Destination: ${destination}
- Duration: ${duration} days
- Planned Activities: ${activities || 'General sightseeing and relaxing'}

Your goals:
1. Build a smart, versatile packing list from their existing wardrobe. Pick items that mix and match well to save space.
2. Group the items they need to pack into categories (Tops, Bottoms, Shoes, Outerwear/Accessories).
3. Create a day-by-day outfit plan using the packed items, tailored to the destination and activities.
4. If they are missing essential items for this specific trip (e.g., swimwear for a beach trip, snow boots for winter sports), suggest 1-3 specific items to BUY, including where to buy them in India with estimated prices in INR.

Available Wardrobe (${wardrobeItems.length} items):
${JSON.stringify(formattedWardrobe, null, 2)}

Please return the response IN RAW JSON FORMAT EXACTLY like this structure, with no markdown code blocks or extra text:
{
  "rationale": "A stylish summary of your packing strategy for this trip.",
  "packingList": {
    "tops": ["id1", "id2"],
    "bottoms": ["id3", "id4"],
    "shoes": ["id5"],
    "outerwearAndAccessories": ["id6"]
  },
  "dayByDay": [
    {
      "day": 1,
      "theme": "Travel & Arrival",
      "outfitIds": ["id1", "id3", "id5"]
    },
    {
      "day": 2,
      "theme": "Beach & Nightlife",
      "outfitIds": ["id2", "id4", "id5", "id6"]
    }
  ],
  "shoppingSuggestions": [
    {
      "item": "Name of missing item (e.g., 'Floral Swim trunks')",
      "reason": "Why they need this for the trip",
      "whereToBuy": [
        { "name": "Myntra", "url": "https://www.myntra.com" }
      ],
      "estimatedPrice": "₹800 - ₹1,500"
    }
  ]
}

Rules:
- All IDs in "packingList" and "dayByDay" MUST be valid IDs from the provided wardrobe JSON.
- If the wardrobe already has everything needed, return an empty "shoppingSuggestions" array.
- "dayByDay" should have an entry for each day of the trip (up to a max of 7 days if the trip is longer, just say "Day 1", etc.).
- Prices should be in Indian Rupees (₹). Real stores only.
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        let aiText = response.text;
        aiText = aiText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

        const parsedResponse = JSON.parse(aiText);

        // Collect all unique IDs needed to fetch from DB
        const allNeededIds = new Set();
        Object.values(parsedResponse.packingList).flat().forEach(id => allNeededIds.add(id));
        
        const selectedItems = await Item.find({
            '_id': { $in: Array.from(allNeededIds) },
            userId: req.userId
        });

        res.json({
            rationale: parsedResponse.rationale,
            packingList: parsedResponse.packingList,
            dayByDay: parsedResponse.dayByDay || [],
            shoppingSuggestions: parsedResponse.shoppingSuggestions || [],
            populatedItems: selectedItems // Send full item details to frontend to resolve IDs
        });

    } catch (err) {
        console.error('AI Packing List Error:', err);
        res.status(500).json({ message: 'Failed to generate packing list. Check AI API Key or try again later.' });
    }
});

module.exports = router;
