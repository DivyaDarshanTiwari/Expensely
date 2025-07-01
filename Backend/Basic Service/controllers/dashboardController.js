const { text } = require("stream/consumers");
const { pool } = require("../config/db");

exports.getDashboardAmounts = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(404).json({ error: "User ID not found!" });
  }

  try {
    const result = await pool.query(
      `SELECT totalIncome, totalExpense FROM ACCOUNT WHERE userId = $1`,
      [userId]
    );

    // console.log(result);

    res.status(201).json({
      message: "Total Income and Total Expense Sent",
      data: {
        totalIncome: result.rows[0].totalincome,
        totalExpense: result.rows[0].totalexpense,
      },
    });
  } catch (err) {
    console.error("Error getting Total Income and Total Expense! ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getFinancialOverview = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(404).json({ error: "User ID not found!" });
  }
  try {
    const result = await pool.query(
      `SELECT totalIncome, totalExpense FROM ACCOUNT WHERE userId = $1`,
      [userId]
    );

    // console.log(result);

    res.status(201).json({
      message: "Total Income and Total Expense Sent",
      data: [
        { value: result.rows[0].totalincome, text: "Income" },
        { value: result.rows[0].totalexpense, text: "Expense" },
        {
          value: result.rows[0].totalIncome - result.rows[0].totalExpense,
          text: "Balance",
        },
      ],
    });
  } catch (err) {
    console.error("Error getting Total Income and Total Expense! ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
