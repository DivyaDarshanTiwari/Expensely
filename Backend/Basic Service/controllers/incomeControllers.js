const { pool } = require("../config/db");

const inputValidation = require("../services/InputValidation");

//userId needs to be updated to FOREIGN KEY
pool.query(
  `
    CREATE TABLE IF NOT EXISTS INCOME (
        incomeId SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        description VARCHAR(100)
    );
    `,
  (err, res) => {
    if (err) {
      console.error("Error creating INCOME Table!");
    } else {
      console.log("INCOME Table created or already existed!");
    }
  }
);

exports.addIncome = async (req, res) => {
  const validatedData = inputValidation.safeParse(req.body);

  if (!validatedData.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: validatedData.error.issues,
    });
  }

  const { userId, amount, category, description } = req.body;

  // console.log(userId, amount, category, description);

  try {
    if (!userId || !amount || !category) {
      return res.status(400).json({ error: "Missing require fields!" });
    }

    const result = await pool.query(
      `INSERT INTO INCOME (userId, amount, category, description) VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, amount, category, description]
    );

    const income = result.rows[0];

    res.status(201).json({
      message: "Income added",
      income: {
        incomeId: income.incomeId,
        amount: income.amount,
        category: income.category,
        description: income.description || null,
      },
    });
  } catch (err) {
    console.error("Error adding income : ", err);
    return res.status(500).json({ error: "Internal Server Error!" });
  }
};

exports.getAllIncome = async (req, res) => {
  const { userId } = req.params;

  console.log(userId);

  if (!userId) {
    return res.status(404).json({ error: "User ID missing!" });
  }

  try {
    const result = await pool.query(
      `SELECT incomeId, amount, category, description, createdAt FROM INCOME WHERE userId = $1 ORDER BY createdAt DESC`,
      [userId]
    );

    res.status(200).json({
      message: "All incomes fetched successfully",
      expenses: result.rows,
    });
  } catch (err) {
    console.error("Error getting all income : ", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//deleting the expense according to there incomeId(id)
exports.deleteIncome = async (req, res) => {
  const { incomeId } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM INCOME WHERE incomeId = $1 RETURNING *",
      [incomeId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json({
      message: "Income deleted successfully",
      deletedIncome: result.rows[0],
    });
  } catch (err) {
    console.error("Error deleting income : ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
