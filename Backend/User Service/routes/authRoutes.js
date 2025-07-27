"use strict";

const express = require("express");
const {
  authController,
  signUpController,
  getMe,
  createCustomToken,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/validToken", authController);
router.post("/signUp", signUpController);
router.post("/getCustomToken", createCustomToken);

router.get("/me", authMiddleware, getMe);

module.exports = router;
