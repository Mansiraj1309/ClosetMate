const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// @route   POST /api/stylist/recommend
// @desc    Get an outfit recommendation + shopping suggestions
// @access  Public
router.post('/recommend', async (req, res) => {
    try {
        const { occasion } = req.body;

        if (!occasion) {
            return res.status(400).json({ message: 'Occasion is required' });
        }

        // 1. Fetch the user's entire digital wardrobe
        const wardrobeItems = await Item.find();

        if (wardrobeItems.length === 0) {
            return res.status(400).json({
                message: 'Your wardrobe is empty! Add some clothes first.'
            });
        }

        // 2. Format the wardrobe data for the AI
        const formattedWardrobe = wardrobeItems.map(item => ({
            id: item._id,
            category: item.category,
            color: item.color,
            season: item.season,
            formality: item.formality,
            notes: item.styleNotes
        }));

        // 3. Construct the enhanced System Prompt
        const prompt = `
      You are an expert fashion stylist and personal shopper. You will be provided with a JSON list of clothing items available in a user's digital wardrobe, and a specific occasion they are dressing for.

      Your goals:
      1. Select the BEST outfit combination for the occasion from their available clothes.
      2. If the outfit is incomplete or could be significantly improved with items they DON'T own, suggest 1-3 specific items to BUY, including what the item is, why it would complete the look, where to buy it (real stores/websites), and an estimated price range in INR.

      Occasion: "${occasion}"

      Available Wardrobe:
      ${JSON.stringify(formattedWardrobe, null, 2)}

      Please return the response IN RAW JSON FORMAT EXACTLY like this structure, with no markdown code blocks or extra text:
      {
        "rationale": "A brief, stylish explanation of why you chose these items for the occasion.",
        "selectedItemIds": ["id1", "id2"],
        "shoppingSuggestions": [
          {
            "item": "Name of the item to buy (e.g. 'Black leather Chelsea boots')",
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
      - If the wardrobe already has everything needed for a perfect outfit, return an empty shoppingSuggestions array.
      - For festivals like Holi, Diwali, Eid etc., suggest culturally appropriate attire.
      - For style-specific requests (e.g. gothic, streetwear), tailor your picks to that aesthetic.
      - Always suggest real Indian e-commerce stores (Myntra, Ajio, Amazon India, Flipkart, Tata CLiQ) with their actual website URLs.
      - Prices should be realistic estimates in Indian Rupees (₹).
    `;

        // 4. Call the Gemini API
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        // 5. Parse the AI response
        let aiText = response.text;
        if (aiText.startsWith('```json')) {
            aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        }

        const parsedResponse = JSON.parse(aiText);

        // 6. Fetch the full item objects from MongoDB
        const selectedOutfit = await Item.find({
            '_id': { $in: parsedResponse.selectedItemIds }
        });

        // 7. Send the enhanced recommendation back
        res.json({
            rationale: parsedResponse.rationale,
            outfit: selectedOutfit,
            shoppingSuggestions: parsedResponse.shoppingSuggestions || [],
            missingRecommendation: '' // kept for backward compat
        });

    } catch (err) {
        console.error('AI Stylist Error:', err);
        res.status(500).json({ message: 'Failed to generate recommendation. Check AI API Key or try again later.' });
    }
});

module.exports = router;
