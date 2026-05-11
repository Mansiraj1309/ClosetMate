const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: 'AIzaSyDkw3JAFrtLFqXaw9hgpJZ8vpE1W6B7YLI' });

async function test() {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Say hello',
        });
        console.log("Success!", response.text);
    } catch (e) {
        console.error("Failed:", e.message);
    }
}
test();
