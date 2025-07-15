"use strict";

const express = require("express");
const {
  authController,
  signUpController,
  getMe,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/validToken", authController);
router.post("/signUp", signUpController);

router.get("/me", authMiddleware, getMe);

module.exports = router;
