const { pool } = require("../config/db");

const inputValidation = require("../services/InputValidation");

exports.addIncome = async (req, res) => {
  const { userId, amount, category, description } = req.body;

  const validatedData = inputValidation.safeParse(req.body);

  if (!validatedData.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: validatedData.error.issues,
    });
  }

  try {
    if (!userId || !amount || !category) {
      return res.status(400).json({ error: "Missing require fields!" });
    }

    const result = await pool.query(
      `INSERT INTO INCOME (userId, amount, category, description) VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, amount, category, description]
    );

    await pool.query(
      `
        UPDATE account
        SET totalIncome = totalIncome + $1
        WHERE userId = $2
      `,
      [amount, userId]
    );

    const income = result.rows[0];

    res.status(201).json({
      message: "Income added",
      income: {
        incomeId: income.incomeid,
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

exports.addIncome2 = async (req, res) => {
  const { user_id, amount, category, description } = req.body;

  try {
    if (!user_id || !amount || !category) {
      return res.status(400).json({ error: "Missing require fields!" });
    }

    const result = await pool.query(
      `INSERT INTO INCOME (userId, amount, category, description) VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id, amount, category, description]
    );

    await pool.query(
      `
        UPDATE account
        SET totalIncome = totalIncome + $1
        WHERE userId = $2
      `,
      [amount, user_id]
    );

    const income = result.rows[0];

    res.status(201).json({
      message: "Income added",
      income: {
        incomeId: income.incomeid,
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
  const { userId } = req.body;
  const limit = parseInt(req.query.limit) || 5;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  if (!userId) {
    return res.status(404).json({ error: "User ID missing!" });
  }

  try {
    const result = await pool.query(
      `SELECT incomeId, amount, category, description, createdAt FROM INCOME WHERE userId = $1 ORDER BY createdAt DESC
      LIMIT $2
      OFFSET $3
      `,
      [userId, limit, offset]
    );

    let total_records = await pool.query(
      `SELECT COUNT(*) FROM INCOME where userid = $1
      `,
      [userId]
    );

    total_records = parseInt(total_records.rows[0].count);

    const total_pages =
      total_records === 0 ? 1 : Math.ceil(total_records / limit);

    res.status(200).json({
      message: "All income fetched successfully",
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
    console.error("Error getting all income : ", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//deleting the expense according to there incomeId(id)
exports.deleteIncome = async (req, res) => {
  const { incomeId } = req.params;

  try {
    // Fetch the income entry first
    const incomeResult = await pool.query(
      "SELECT * FROM INCOME WHERE incomeid = $1",
      [incomeId]
    );

    if (incomeResult.rowCount === 0) {
      return res.status(404).json({ message: "Income not found" });
    }

    const income = incomeResult.rows[0];

    // Check if the income entry is older than 1 month
    const createdAt = new Date(income.createdat);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    if (createdAt < oneMonthAgo) {
      return res.status(403).json({
        message: "Cannot delete income entries older than one month",
      });
    }

    // Proceed to delete
    const deleteResult = await pool.query(
      "DELETE FROM INCOME WHERE incomeid = $1 RETURNING *",
      [incomeId]
    );

    const amount = deleteResult.rows[0].amount;
    await pool.query(
      `
        UPDATE account
        SET totalIncome = totalIncome - $1
        WHERE userId = $2
      `,
      [amount, deleteResult.rows[0].userid]
    );

    res.status(200).json({
      message: "Income deleted successfully",
      deletedIncome: deleteResult.rows[0],
    });
  } catch (err) {
    console.error("❌ Error deleting income:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
