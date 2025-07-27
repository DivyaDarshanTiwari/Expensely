const express = require("express");
const router = express.Router();
const {
  getPersonalCategories,
  addPersonalCategory,
  deletePersonalCategory,
} = require("../controllers/personalCategoriesController");
const authProxyMiddleware = require("../middlewares/authProxyMiddleware");

// Get all personal categories for a user
router.get("/", getPersonalCategories);
// Add a new personal category
router.post("/", addPersonalCategory);
// Delete a personal category
router.delete("/:categoryId", deletePersonalCategory);

module.exports = router;
