const { pool } = require("../config/db");

exports.getDashboardAmounts = async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(404).json({ error: "User ID not found!" });
  }

  try {
    const result = await pool.query(
      `SELECT totalIncome, totalExpense FROM ACCOUNT WHERE userId = $1`,
      [userId]
    );
    if (!result.rows.length) {
      return res
        .status(404)
        .json({ error: "Account not found for given userId" });
    }

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
  const { userId } = req.body;

  if (!userId) {
    return res.status(404).json({ error: "User ID not found!" });
  }
  try {
    const result = await pool.query(
      `SELECT totalIncome, totalExpense FROM ACCOUNT WHERE userId = $1`,
      [userId]
    );

    if (!result.rows.length) {
      return res
        .status(404)
        .json({ error: "Account not found for given userId" });
    }

    res.status(201).json({
      message: "Total Income and Total Expense Sent",
      data: [
        { value: parseFloat(result.rows[0].totalincome), text: "Income" },
        { value: parseFloat(result.rows[0].totalexpense), text: "Expense" },
        {
          value:
            parseFloat(result.rows[0].totalincome) -
            parseFloat(result.rows[0].totalexpense),
          text: "Balance",
        },
      ],
    });
  } catch (err) {
    console.error("Error getting Total Income and Total Expense! ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getMergedTransactions = async (req, res) => {
  try {
    const userId = req.body.userId; // adjust if using req.user.userId
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        incomeId AS id,
        amount,
        category,
        createdAt,
        description,
        'income' AS type
      FROM income
      WHERE userId = $1

      UNION ALL

      SELECT
        expenseId AS id,
        amount,
        category,
        createdAt,
        description,
        'expense' AS type
      FROM expense
      WHERE userId = $1

      ORDER BY createdAt DESC
      LIMIT $2 OFFSET $3
    `;

    const { rows } = await pool.query(query, [userId, limit, offset]);

    const now = new Date();

    const data = rows.map((item) => {
      const createdAt = new Date(item.createdat);
      const diffTime = now.getTime() - createdAt.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      let dayAgo;
      if (diffDays === 0) {
        dayAgo = "today";
      } else if (diffDays === 1) {
        dayAgo = "1 day ago";
      } else {
        dayAgo = `${diffDays} days ago`;
      }

      return {
        id: item.id,
        amount: item.amount,
        category: item.category,
        dayAgo,
        type: item.type,
        description: item.description,
      };
    });

    res.status(200).json({
      success: true,
      page,
      limit,
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching transactions.",
    });
  }
};
