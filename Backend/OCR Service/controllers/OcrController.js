"use strict";

require("dotenv").config();
const Tesseract = require("tesseract.js");
const axios = require("axios");
const { googleAPI } = require("../services/Text_to_Json_Service");

const ocrFunction = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId && isNaN(parseInt(userId))) {
      return res
        .status(400)
        .json({ error: "userId is required and it should be number" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    // Perform OCR on the uploaded image
    const ocrResult = await Tesseract.recognize(req.file.buffer, "eng");
    const extractedText = ocrResult.data.text;

    // Convert extracted text to structured JSON using your Google API service
    const formattedData = await googleAPI(extractedText);

    // Post the formatted data to your expense service
    const response = await axios.post(process.env.EXPENSE_API_URL, {
      userId: parseInt(userId),
      amount: formattedData.total_amount,
      category: formattedData.category,
      description: formattedData.description,
    });

    res.status(200).json({
      message: "Data processed and expense entry created successfully.",
      expense: response.data.expense,
    });
  } catch (error) {
    if (error.response) {
      console.log(
        "Server Expense responed with error ",
        error.response.status,
        error.response.data
      );
      if (error.response.status == 400) {
        return res.status(400).json({
          error:
            "Expnesely server rejected the request: " +
              error.response.data.error || "BAD REQUEST",
        });
      } else {
        return res.status(502).json({
          error: "Upstream server error. Please try again later.",
        });
      }
    } else if (err.request) {
      console.error("No response from Server B", err.request);
      return res.status(504).json({ error: "Server B is unreachable." });
    } else {
      console.error("Unexpected error:", err.message);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
};

module.exports = { ocrFunction };
