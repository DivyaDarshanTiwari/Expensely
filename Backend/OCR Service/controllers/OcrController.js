"use strict";
const Tesseract = require("tesseract.js");
const { googleAPI } = require("../services/testing");

const ocrFunction = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "File type not allowed" });
  }
  Tesseract.recognize(
    req.file.buffer,
    "eng" // language
  )
    .then((result) => {
      console.log(result.data.text);
      const formated_data = googleAPI(result.data.text);
      formated_data.then((data) => {
        res.status(200).json({
          message: data,
        });
      });
    })
    .catch((err) => {
      console.error("OCR failed:", err);
    });
};

module.exports = { ocrFunction };
