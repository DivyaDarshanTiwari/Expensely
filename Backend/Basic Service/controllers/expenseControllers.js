"use strict";

const { pool } = require("../config/db");
const expenseSchema = require("../services/InputValidation"); //importing schema checking object for input validation

//Add expense
const addExpense = async (req, res) => {
  const validatedData = expenseSchema.safeParse(req.body);

  if (!validatedData.success) {
    console.log(validatedData.error.issues);
    return res.status(400).json({
      error: "Validation failed",
      details: validatedData.error.issues,
    });
  }
  const { userId, amount, category, description } = req.body;

  try {
    if (!userId || !amount || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const result = await pool.query(
      `
        INSERT INTO expense (userId, amount, category,description) 
       VALUES ($1, $2, $3,$4) RETURNING *
        `,
      [userId, amount, category, description]
    );

    await pool.query(
      `
        UPDATE account
        SET totalExpense = totalExpense + $1
        WHERE userId = $2
      `,
      [amount, userId]
    );

    const expense = result.rows[0];

    res.status(201).json({
      message: "Expense added",
      expense: {
        expenseId: expense.expenseid,
        amount: expense.amount,
        category: expense.category,
        description: expense.description || null,
      },
    });
  } catch (err) {
    console.error("❌ Error adding expense:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

//Getting all the expense/spenditure
const getAllExpense = async (req, res) => {
  const { userId } = req.params;
  const limit = req.query.limit || 5;
  const page = req.query.page || 1;
  const offset = (page - 1) * limit;

  if (!userId) {
    return res.status(404).json({
      message: "UserId not provided",
    });
  }

  try {
    const result = await pool.query(
      `SELECT expenseid , amount, category, createdat, description FROM expense where userid = $1 ORDER BY createdAt DESC
      LIMIT $2
      OFFSET $3
      `,
      [userId, limit, offset]
    );

    let total_records = await pool.query(
      `SELECT COUNT(*) FROM expense where userid = $1
      `,
      [userId]
    );
    total_records = parseInt(total_records.rows[0].count);
    const total_pages =
      total_records === 0 ? 1 : Math.ceil(total_records / limit);

    res.status(200).json({
      message: "All expenses fetched successfully",
      data: result.rows,
      pagination: {
        total_records: total_records,
        total_pages: total_pages,
        current_page: page,
        next_page: page < total_pages ? page + 1 : null,
        previous_page: page > 1 ? page - 1 : null,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching expenses:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

//deleting the expense according to there expenseId(id)
const deleteExpense = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM expense WHERE expenseid = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const amount = result.rows[0].amount;
    await pool.query(
      `
        UPDATE account
        SET totalExpense = totalExpense - $1
        WHERE userId = $2
      `,
      [amount, result.rows[0].userid]
    );

    res.status(200).json({
      message: "Expense deleted successfully",
      deletedExpense: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error deleting expense:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { addExpense, getAllExpense, deleteExpense };
