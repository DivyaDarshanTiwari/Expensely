"use strict";
const Tesseract = require("tesseract.js");

const ocrFunction = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "File type not allowed" });
  }
  Tesseract.recognize(
    req.file.buffer,
    "eng", // language
    { logger: (m) => console.log(m) }
  )
    .then((result) => {
      console.log(result.data.text);
      res.status(200).json({
        message: result.data.text,
      });
    })
    .catch((err) => {
      console.error("OCR failed:", err);
    });
};

module.exports = { ocrFunction };
