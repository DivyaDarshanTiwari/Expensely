"use strict";

const { pool } = require("../config/db");

// Get all personal categories for a user
const getPersonalCategories = async (req, res) => {
  const { userId } = req.body;
  const { type } = req.query; // 'expense' or 'income'

  try {
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    let query = `
      SELECT categoryId, name, type, createdAt
      FROM personal_categories
      WHERE userId = $1
    `;
    let params = [userId];

    if (type) {
      query += ` AND type = $2`;
      params.push(type);
    }

    query += ` ORDER BY createdAt DESC`;

    const { rows } = await pool.query(query, params);

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("❌ Error fetching personal categories:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add a new personal category
const addPersonalCategory = async (req, res) => {
  const { userId, name, type } = req.body;

  try {
    if (!userId || !name || !type) {
      return res
        .status(400)
        .json({ error: "User ID, name, and type are required" });
    }

    if (!["expense", "income"].includes(type)) {
      return res
        .status(400)
        .json({ error: "Type must be either 'expense' or 'income'" });
    }

    // Check if category already exists for this user and type
    const existingCategory = await pool.query(
      `SELECT categoryId FROM personal_categories WHERE userId = $1 AND name = $2 AND type = $3`,
      [userId, name, type]
    );

    if (existingCategory.rows.length > 0) {
      return res
        .status(409)
        .json({ error: "Category already exists for this user and type" });
    }

    const result = await pool.query(
      `INSERT INTO personal_categories (userId, name, type) VALUES ($1, $2, $3) RETURNING categoryId, name, type, createdAt`,
      [userId, name, type]
    );

    const category = result.rows[0];

    res.status(201).json({
      success: true,
      message: "Personal category added successfully",
      data: category,
    });
  } catch (err) {
    console.error("❌ Error adding personal category:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a personal category
const deletePersonalCategory = async (req, res) => {
  const { categoryId } = req.params;
  const { userId } = req.body;

  try {
    if (!userId || !categoryId) {
      return res
        .status(400)
        .json({ error: "User ID and category ID are required" });
    }

    // Check if category exists and belongs to user
    const existingCategory = await pool.query(
      `SELECT categoryId FROM personal_categories WHERE categoryId = $1 AND userId = $2`,
      [categoryId, userId]
    );

    if (existingCategory.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Category not found or access denied" });
    }

    await pool.query(
      `DELETE FROM personal_categories WHERE categoryId = $1 AND userId = $2`,
      [categoryId, userId]
    );

    res.status(200).json({
      success: true,
      message: "Personal category deleted successfully",
    });
  } catch (err) {
    console.error("❌ Error deleting personal category:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getPersonalCategories,
  addPersonalCategory,
  deletePersonalCategory,
};
