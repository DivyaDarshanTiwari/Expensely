"use strict";

const { pool } = require("../config/db");
const expenseSchema = require("../services/InputValidation"); //importing schema checking object for input validation

// FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE (have to add to the table)
pool.query(
  `
  CREATE TABLE IF NOT EXISTS EXPENSE (
    expenseId SERIAL PRIMARY KEY,
    userId INTEGER NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description VARCHAR(100)
  );
`,
  (err, res) => {
    if (err) {
      console.error("❌ Error creating expense table:", err);
    } else {
      console.log("✅ Expense table created or already exists");
    }
  }
);

//Add expense
const addExpense = async (req, res) => {
  const validatedData = expenseSchema.safeParse(req.body);

  if (!validatedData.success) {
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

    const expense = result.rows[0];

    res.status(201).json({
      message: "Expense added",
      expense: {
        expenseId: expense.expenseId,
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

  if (!userId) {
    return res.status(404).json({
      message: "UserId not provided",
    });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM expense where userid = $1 ORDER BY createdAt DESC",
      [userId]
    );

    const expenses = result.rows.map((expense) => ({
      expenseid: expense.expenseid,
      amount: expense.amount,
      category: expense.category,
      createdat: expense.createdat,
      description: expense.description,
    }));

    res.status(200).json({
      message: "All expenses fetched successfully",
      expenses: expenses,
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
