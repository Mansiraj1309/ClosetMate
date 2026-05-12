const dotenv = require("dotenv");
dotenv.config();

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Available Models Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error fetching models:", err);
  }
}

listModels();
