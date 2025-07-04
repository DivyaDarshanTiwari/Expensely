"use strict";
const express = require("express");
const { ocrFunction } = require("../controllers/OcrController");
const multer = require("multer");
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  //Accept only image files (jpeg and png)
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

const router = express.Router();

router.post("/get/json", upload.single("bill"), ocrFunction);

module.exports = router;
