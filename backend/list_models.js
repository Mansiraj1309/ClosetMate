const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: 'AIzaSyDkw3JAFrtLFqXaw9hgpJZ8vpE1W6B7YLI' });

async function run() {
    try {
        const response = await ai.models.list();
        for (const model of response) {
            console.log(model.name);
        }
    } catch (e) {
        console.error(e.message);
    }
}
run();
