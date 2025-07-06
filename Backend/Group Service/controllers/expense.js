const { pool } = require("../config/db");

exports.addGroupExpense = async (req, res) => {
  const { groupId, paidBy, amount, description, shares, category } = req.body;
  // shares = [{ userId: 1, amountOwed: 400 }, { userId: 2, amountOwed: 400 }, ...]
  try {
    const payerResult = await pool.query(
      "SELECT user_id FROM USERS WHERE username = $1",
      [paidBy]
    );
    if (payerResult.rows.length === 0) {
      return res.status(400).json({ message: `Payer ${paidBy} not found` });
    }
    const paidById = payerResult.rows[0].user_id;

    const expenseResult = await pool.query(
      "INSERT INTO GROUP_EXPENSES (groupId, paidBy, amount, description, category) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [groupId, paidById, amount, description, category]
    );
    const expenseId = expenseResult.rows[0].id;
    for (let share of shares) {
      // Get userId from username
      const userResult = await pool.query(
        "SELECT user_id FROM USERS WHERE username = $1",
        [share.username]
      );

      if (userResult.rows.length === 0) {
        return res
          .status(400)
          .json({ message: `User ${share.username} not found` });
      }

      const userId = userResult.rows[0].user_id;
      await pool.query(
        "INSERT INTO EXPENSES_SHARE (expenseId, userId, amountOwned) VALUES ($1, $2, $3)",
        [expenseId, userId, share.amountOwned]
      );
    }
    res.status(201).json({ message: "Expense added", expenseId });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

exports.getGroupExpenses = async (req, res) => {
  const { groupId } = req.params;
  try {
    const result = await pool.query(
      `
      SELECT 
        USERS.username AS paidBy,
        GROUP_EXPENSES.id,
        GROUP_EXPENSES.amount,
        GROUP_EXPENSES.category,
        GROUP_EXPENSES.description,
        GROUP_EXPENSES.createdat
      FROM GROUP_EXPENSES
      JOIN USERS ON GROUP_EXPENSES.paidBy = USERS.user_id
      WHERE GROUP_EXPENSES.groupId = $1
      ORDER BY GROUP_EXPENSES.createdat DESC
      `,
      [groupId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error getting group expenses: ", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getExpenseSettlement = async (req, res) => {
  const { groupId } = req.params;
  try {
    // 1. Get all users in the group
    const membersRes = await pool.query(
      "SELECT userId FROM GROUP_MEMBERS WHERE groupId = $1",
      [groupId]
    );
    const members = membersRes.rows.map((row) => row.userid);

    // 2. Init net balance map
    const netBalance = {};
    members.forEach((userId) => (netBalance[userId] = 0));

    // 3. Get all expenses in this group
    const expensesRes = await pool.query(
      "SELECT id, paidBy, amount FROM GROUP_EXPENSES WHERE groupId = $1",
      [groupId]
    );
    const expenses = expensesRes.rows;

    for (const expense of expenses) {
      const { id: expenseId, paidby, amount } = expense;

      // Paid amount
      netBalance[paidby] += Number(amount);

      // Owed amount per user
      const sharesRes = await pool.query(
        "SELECT userId, amountOwned FROM EXPENSES_SHARE WHERE expenseId = $1",
        [expenseId]
      );

      for (const share of sharesRes.rows) {
        const { userid, amountowned } = share;
        netBalance[userid] -= Number(amountowned);
      }
    }

    // 4. Separate debtors and creditors
    const creditors = [],
      debtors = [];

    for (const [userId, balance] of Object.entries(netBalance)) {
      const id = parseInt(userId);
      if (balance > 0) creditors.push({ userId: id, balance });
      else if (balance < 0) debtors.push({ userId: id, balance: -balance });
    }

    // 5. Calculate transactions (who owes whom)
    const settlements = [];

    for (const debtor of debtors) {
      for (const creditor of creditors) {
        if (debtor.balance === 0) break;
        if (creditor.balance === 0) continue;

        const amount = Math.min(debtor.balance, creditor.balance);
        settlements.push({
          from: debtor.userId,
          to: creditor.userId,
          amount: parseFloat(amount.toFixed(2)),
        });

        debtor.balance -= amount;
        creditor.balance -= amount;
      }
    }

    res.status(201).json(settlements);
  } catch (err) {
    console.error("Error getting group expense settlement : ", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getExpenseById = async (req, res) => {
  const { expenseId } = req.params;

  try {
    const result = await pool.query(
      "SELECT amount, category, description, paidBy FROM group_expenses WHERE id = $1",
      [expenseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(201).json(result.rows);
  } catch (err) {
    console.error("Error getting expense : ", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getExpenseShares = async (req, res) => {
  const { expenseId } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM expenses_share WHERE expenseid = $1",
      [expenseId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error getting shares:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getExpensesByUser = async (req, res) => {
  const { userId } = req.body;

  try {
    const result = await pool.query(
      `SELECT DISTINCT ge.* 
       FROM group_expenses ge 
       JOIN expenses_share es ON ge.id = es.expenseid 
       WHERE es.userid = $1 OR ge.paidby = $1`,
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error getting user expenses:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
