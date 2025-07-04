"use strict";

const express = require("express");
const {
  authController,
  signUpController,
} = require("../controllers/authController");

const router = express.Router();

router.post("/validToken", authController);
router.post("/signUp", signUpController);

module.exports = router;
