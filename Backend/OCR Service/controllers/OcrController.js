"use strict";

require("dotenv").config();

const axios = require("axios");
const { googleAPI } = require("../services/Text_to_Json_Service");

const ocrFunction = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId && !isNaN(parseInt(userId))) {
      return res
        .status(400)
        .json({ error: "userId is required and it should be number" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }
    // Verify file type (basic check)
    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({ error: "Uploaded file is not an image." });
    }

    // Process image directly with Gemini
    const formattedData = await googleAPI(req.file.buffer, req.file.mimetype);

    // Check if it is a valid bill
    if (formattedData.is_bill === false) {
      return res.status(400).json({
        error: formattedData.error || "Uploaded image is not a valid bill.",
      });
    }

    console.log("Formatted Data: ", formattedData);
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }
    // Post the formatted data to your expense service
    const response = await axios.post(
      process.env.EXPENSE_API_URL,
      {
        userId: parseInt(userId),
        amount: formattedData.total_amount,
        category: formattedData.category,
        description: formattedData.description,
      },
      {
        headers: {
          Authorization: authHeader,
        },
      }
    );

    res.status(200).json({
      message: "Data processed and expense entry created successfully.",
      expense: response.data.expense,
    });
  } catch (error) {
    if (error.response) {
      console.error(
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
    } else if (error.request) {
      console.error("No response from Server B", error.request);
      return res.status(504).json({ error: "Server B is unreachable." });
    } else {
      console.error("Unexpected error:", error.message);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
};

module.exports = { ocrFunction };
