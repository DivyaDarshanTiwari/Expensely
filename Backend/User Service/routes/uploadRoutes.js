"use strict";

const express = require("express");
const router = express.Router();
const multer = require("multer");
const { upload_image } = require("../controllers/uploadController");
const authMiddleware = require("../middleware/authMiddleware");

const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/profilePic",
  authMiddleware,
  upload.single("picture"),
  upload_image
);

module.exports = router;
