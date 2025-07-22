const { pool } = require("../config/db");

exports.addGroupExpense = async (req, res) => {
  const { groupId, paidBy, amount, description, shares, category, userId } = req.body;
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

    // userId is the creator (adder)
    const expenseResult = await pool.query(
      "INSERT INTO GROUP_EXPENSES (groupId, paidBy, createdBy, amount, description, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [groupId, paidById, userId, amount, description, category]
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

      const shareUserId = userResult.rows[0].user_id;
      await pool.query(
        "INSERT INTO EXPENSES_SHARE (expenseId, userId, amountOwned) VALUES ($1, $2, $3)",
        [expenseId, shareUserId, share.amountOwned]
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
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  try {
    const result = await pool.query(
      `
      SELECT 
        USERS.username AS paidBy,
        GROUP_EXPENSES.id,
        GROUP_EXPENSES.amount,
        GROUP_EXPENSES.category,
        GROUP_EXPENSES.description,
        GROUP_EXPENSES.createdat,
        GROUP_EXPENSES.createdBy
      FROM GROUP_EXPENSES
      JOIN USERS ON GROUP_EXPENSES.paidBy = USERS.user_id
      WHERE GROUP_EXPENSES.groupId = $1
      ORDER BY GROUP_EXPENSES.createdat DESC
      LIMIT $2 OFFSET $3
      `,
      [groupId, limit, offset]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error getting group expenses: ", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update getExpenseById to return createdBy as userId
exports.getExpenseById = async (req, res) => {
  const { expenseId } = req.params;
  try {
    const expenseResult = await pool.query(
      'SELECT amount, category, description, paidBy, createdBy FROM group_expenses WHERE id = $1',
      [expenseId]
    );
    if (expenseResult.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    const expense = expenseResult.rows[0];
    // Get paidBy username
    const payerResult = await pool.query(
      'SELECT username FROM USERS WHERE user_id = $1',
      [expense.paidby]
    );
    const paidByUsername = payerResult.rows[0]?.username || null;
    // Get shares with usernames
    const sharesResult = await pool.query(
      'SELECT es.amountOwned, u.username FROM expenses_share es JOIN users u ON es.userId = u.user_id WHERE es.expenseId = $1',
      [expenseId]
    );
    const shares = sharesResult.rows.map(row => ({ username: row.username, amountOwned: row.amountowned }));
    res.status(200).json({
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      paidBy: paidByUsername,
      createdBy: expense.createdby, // userId
      shares
    });
  } catch (err) {
    console.error('Error getting expense details:', err);
    res.status(500).json({ message: 'Internal Server Error' });
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

// Helper to check if user is admin in group
async function isUserAdmin(groupId, userId) {
  const adminRes = await pool.query(
    'SELECT isAdmin FROM GROUP_MEMBERS WHERE groupId = $1 AND userId = $2',
    [groupId, userId]
  );
  return adminRes.rows.length > 0 && adminRes.rows[0].isadmin === true;
}

// Update editGroupExpense to allow creator or admin
exports.editGroupExpense = async (req, res) => {
  const { groupId, expenseId } = req.params;
  const { userId, amount, description, category, shares } = req.body;
  try {
    // Check if the user is the creator (adder) or admin of the group
    const expenseResult = await pool.query(
      'SELECT createdBy FROM GROUP_EXPENSES WHERE id = $1 AND groupId = $2',
      [expenseId, groupId]
    );
    if (expenseResult.rowCount === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    const isCreator = expenseResult.rows[0].createdby === userId;
    const isAdmin = await isUserAdmin(groupId, userId);
    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: 'Only the creator or a group admin can edit this expense' });
    }
    // Update the expense
    await pool.query(
      'UPDATE GROUP_EXPENSES SET amount = $1, description = $2, category = $3 WHERE id = $4',
      [amount, description, category, expenseId]
    );
    // Remove old shares
    await pool.query('DELETE FROM EXPENSES_SHARE WHERE expenseId = $1', [expenseId]);
    // Insert new shares
    for (let share of shares) {
      // Get userId from username
      const userResult = await pool.query(
        'SELECT user_id FROM USERS WHERE username = $1',
        [share.username]
      );
      if (userResult.rows.length === 0) {
        return res.status(400).json({ message: `User ${share.username} not found` });
      }
      const shareUserId = userResult.rows[0].user_id;
      await pool.query(
        'INSERT INTO EXPENSES_SHARE (expenseId, userId, amountOwned) VALUES ($1, $2, $3)',
        [expenseId, shareUserId, share.amountOwned]
      );
    }
    res.status(200).json({ message: 'Expense updated successfully' });
  } catch (err) {
    console.error('Error editing group expense:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update deleteGroupExpense to allow creator or admin
exports.deleteGroupExpense = async (req, res) => {
  const { groupId, expenseId } = req.params;
  const { userId } = req.body;
  try {
    // Check if the user is the creator (adder) or admin of the group
    const expenseResult = await pool.query(
      'SELECT createdBy FROM GROUP_EXPENSES WHERE id = $1 AND groupId = $2',
      [expenseId, groupId]
    );
    if (expenseResult.rowCount === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    const isCreator = expenseResult.rows[0].createdby === userId;
    const isAdmin = await isUserAdmin(groupId, userId);
    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: 'Only the creator or a group admin can delete this expense' });
    }
    // Delete from EXPENSES_SHARE first (if exists)
    await pool.query('DELETE FROM EXPENSES_SHARE WHERE expenseId = $1', [expenseId]);
    // Delete the expense itself
    const result = await pool.query('DELETE FROM GROUP_EXPENSES WHERE id = $1 RETURNING *', [expenseId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (err) {
    console.error('Error deleting group expense:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
