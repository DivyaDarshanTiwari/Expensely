"use strict";
require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const googleAPI = async (imageBuffer, mimeType) => {
  const base64Image = imageBuffer.toString("base64");

  const prompt = `
  You are an expert financial document analyzer. Your task is to analyze the provided image and extract bill details if it is a valid bill or receipt.

  Analyze the following:
  1. **Is this a bill/receipt?** (true/false) - It must be a payment receipt, invoice, or purchase bill. If it is a generic object, selfie, document without financial context, or unclear, set this to false.
  2. **Total Amount**: Extract the final total amount paid or due. If no amount is visible or legible, this is an invalid bill.
  3. **Category**: Categorize into one of: "Food", "Groceries", "Transport", "Medical", "Utilities", "Entertainment", "Shopping", "Other".
  4. **Description**: A short summary (1-2 lines) of what the bill is for.

  **Output Format (JSON Only):**
  If valid:
  {
    "is_bill": true,
    "category": "CategoryName",
    "total_amount": 123.45,
    "description": "Lunch at Restaurant"
  }

  If NOT a bill or NO amount detected:
  {
    "is_bill": false,
    "error": "The image provided does not appear to be a valid bill or the total amount is missing."
  }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
        ],
      },
    ],
  });

  console.log("Gemini Response structure:", Object.keys(response));
  
  let rawText;
  if (typeof response.text === 'function') {
    rawText = response.text();
  } else if (typeof response.text === 'string') {
    rawText = response.text;
  } else if (
    response.candidates &&
    response.candidates[0] &&
    response.candidates[0].content &&
    response.candidates[0].content.parts &&
    response.candidates[0].content.parts[0].text
  ) {
    rawText = response.candidates[0].content.parts[0].text;
  } else {
    console.error("Unexpected Gemini response format:", JSON.stringify(response, null, 2));
    throw new Error("Failed to extract text from Gemini response");
  }

  const cleanText = rawText.replace(/```json|```/g, "").trim();
  const jsonData = JSON.parse(cleanText);
  return jsonData;
};

module.exports = { googleAPI };
