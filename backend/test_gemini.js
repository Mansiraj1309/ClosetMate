require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;
console.log("Testing with API Key prefix:", apiKey ? apiKey.substring(0, 10) + "..." : "undefined");

const ai = new GoogleGenAI({ apiKey });

async function test() {
    try {
        console.log("Sending request to gemini-2.5-flash...");
        const start = Date.now();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Suggest a short, stylish tagline for an AI smart wardrobe named ClosetMate.',
        });
        const duration = ((Date.now() - start) / 1000).toFixed(2);
        console.log(`\n✅ Success! (Response time: ${duration}s)`);
        console.log("AI Response:", response.text.trim());
    } catch (e) {
        console.error("\n❌ Test Failed:", e.message);
    }
}
test();
