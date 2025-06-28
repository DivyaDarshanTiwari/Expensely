"use strict";
require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const googleAPI = async (text) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `The following text is from a bill. Please analyze it and return a JSON object with only the following keys:

1. "category" – a brief category like "Food", "Groceries", "Transport", "Medical", etc., based on the nature of the bill.
2. "total_amount" – the final total amount billed (in numerical format, without currency symbols).
3. "description" – a short summary (1-2 lines) describing the bill content or purpose.

Bill Text:
"""
${text}
"""
`,
  });
  const cleanText = response.text.replace(/```json|```/g, "").trim();
  const jsonData = JSON.parse(cleanText);
  return jsonData;
};

module.exports = { googleAPI };
