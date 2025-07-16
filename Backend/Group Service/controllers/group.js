const { pool } = require("../config/db");

exports.createGroup = async (req, res) => {
  const { name, groupBudget, description, groupMembers } = req.body; //groupMembers = [userIds] Array of userIds
  const createdBy = req.body.userId;
  groupMembers.push(createdBy);
  try {
    if (!name || !createdBy || !groupBudget || !groupMembers) {
      return res.status(404).json({ message: "Incomplete Fields" });
    }
    console.log(
      name,
      createdBy,
      groupBudget,
      description,
      groupMembers,
      req.body.userId
    );
    const result = await pool.query(
      `INSERT INTO GROUPS (name, createdBy, groupBudget, description) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, createdBy, groupBudget, description]
    );
    console.log(result.rows[0].groupid);
    const groupId = result.rows[0].groupid;
    for (let member of groupMembers) {
      await pool.query(
        `INSERT INTO GROUP_MEMBERS (groupId, userId) VALUES ($1, $2) RETURNING *`,
        [groupId, member]
      );
    }
    res.status(201).json({
      message: "Group Created Successfully!",
      data: { groupId: groupId, groupName: result.rows[0].name },
    });
  } catch (err) {
    console.error("Error creating group : ", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Need to add to get the name from the USER table once USER table implemented
exports.getGroupMembers = async (req, res) => {
  const { groupId } = req.params;

  try {
    // Step 1: Get all userIds in this group
    const userIdResult = await pool.query(
      `SELECT userId FROM GROUP_MEMBERS WHERE groupId = $1`,
      [groupId]
    );
    const userIds = userIdResult.rows.map((row) => row.userid);

    const memberData = [];

    for (let userId of userIds) {
      // Step 2: Get username
      const userResult = await pool.query(
        `SELECT username FROM USERS WHERE user_id = $1`,
        [userId]
      );
      const username = userResult.rows[0]?.username;

      // Step 3: Get total amountOwned from all expenses in this group
      const amountResult = await pool.query(
        `
        SELECT COALESCE(SUM(es.amountOwned), 0) AS totalAmount
        FROM EXPENSES_SHARE es
        JOIN GROUP_EXPENSES ge ON es.expenseId = ge.id
        WHERE es.userId = $1 AND ge.groupId = $2
        `,
        [userId, groupId]
      );
      const amountOwned = parseFloat(amountResult.rows[0]?.totalamount || 0);

      memberData.push({
        userId,
        username,
        balance: amountOwned,
      });
    }

    res.status(200).json(memberData);
  } catch (err) {
    console.error("Error getting group members:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.addMemberToGroup = async (req, res) => {
  const { groupId, add_userId } = req.body;
  console.log(groupId, " ", add_userId);
  try {
    const checkUser = await pool.query(
      `SELECT * FROM GROUP_MEMBERS WHERE groupId = $1 AND userId = $2`,
      [groupId, add_userId]
    );
    if (checkUser.rowCount !== 0) {
      return res.status(400).json({ message: "Member already in group!" });
    }

    const result = await pool.query(
      `INSERT INTO GROUP_MEMBERS (groupId, userId) VALUES ($1, $2) RETURNING *`,
      [groupId, add_userId]
    );
    res.status(201).json({
      message: "Member Added Successfully!",
      data: { groupId: result.rows[0].groupid, userId: result.rows[0].userid },
    });
  } catch (err) {
    console.error("Error adding member to the group : ", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.removeMemberFromGroup = async (req, res) => {
  const { groupId, delete_user_id } = req.body;
  try {
    const result = await pool.query(
      "DELETE FROM group_members WHERE groupId = $1 AND userId = $2 RETURNING *",
      [groupId, delete_user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Member not found" });
    }

    console.log(result);
    res.status(201).json({
      message: "Member removed successfully",
      data: {
        groupId: result.rows[0].groupid,
        userId: result.rows[0].userid,
      },
    });
  } catch (err) {
    console.error("Error removing member: ", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getGroupsByUser = async (req, res) => {
  const { userId } = req.body;

  try {
    const result = await pool.query(
      `SELECT
        g.groupid,
        g.name,
        g.description,
        g.groupbudget,
        g.createdby,
      (
        SELECT COUNT(*)
        FROM group_members gm2
        WHERE gm2.groupid = g.groupid
      ) AS member_count,
      (
          SELECT COALESCE(SUM(ge.amount), 0)
          FROM group_expenses ge
          WHERE ge.groupid = g.groupid
      ) AS spent
      FROM groups g
      JOIN group_members gm ON g.groupid = gm.groupid
      WHERE gm.userid = $1;`,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error getting groups by user:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.deleteGroup = async (req, res) => {
  const { groupId, userId, action } = req.body;

  try {
    // Check if group exists and get the creator
    const checkGroup = await pool.query(
      `SELECT createdby FROM GROUPS WHERE groupid = $1`,
      [groupId]
    );

    if (checkGroup.rowCount === 0) {
      return res.status(404).json({ message: "Group not found" });
    }

    const groupCreator = checkGroup.rows[0].createdby;

    // If user is not the creator, they can only leave the group
    if (groupCreator !== userId) {
      return res.status(403).json({
        message:
          "Only group owners can delete groups. You can leave the group instead.",
      });
    }

    // If user is the creator, check action
    if (!action) {
      return res.status(404).json({
        message: "Action is required to proceed.",
      });
    }

    if (action === "leave_group") {
      // Transfer ownership to another member and remove creator
      // Find another member (lowest userId, or random)
      const membersRes = await pool.query(
        `SELECT userId FROM GROUP_MEMBERS WHERE groupId = $1 AND userId != $2 LIMIT 1`,
        [groupId, userId]
      );
      if (membersRes.rowCount === 0) {
        return res.status(400).json({
          message:
            "No other members to transfer ownership to. Cannot leave group.",
        });
      }
      const newOwnerId = membersRes.rows[0].userid;
      // Transfer ownership
      await pool.query(`UPDATE GROUPS SET createdBy = $1 WHERE groupId = $2`, [
        newOwnerId,
        groupId,
      ]);
      // Remove creator from group
      await pool.query(
        `DELETE FROM GROUP_MEMBERS WHERE groupId = $1 AND userId = $2`,
        [groupId, userId]
      );
      return res.status(200).json({
        message: "Ownership transferred and you have left the group.",
        newOwnerId,
      });
    } else if (action === "delete_group") {
      // User is the creator, proceed with full group deletion
      // Step 0: Delete from SETTLEMENTS
      await pool.query(`DELETE FROM SETTLEMENTS WHERE groupid = $1`, [groupId]);
      // Step 1: Delete from EXPENSES_SHARE (if foreign key not set to cascade)
      await pool.query(
        `
        DELETE FROM EXPENSES_SHARE
        WHERE expenseId IN (
          SELECT id FROM GROUP_EXPENSES WHERE groupId = $1
        )
        `,
        [groupId]
      );
      // Step 2: Delete from GROUP_EXPENSES
      await pool.query(`DELETE FROM GROUP_EXPENSES WHERE groupId = $1`, [
        groupId,
      ]);
      // Step 3: Delete from GROUP_MEMBERS
      await pool.query(`DELETE FROM GROUP_MEMBERS WHERE groupId = $1`, [
        groupId,
      ]);
      // Step 4: Finally delete the group
      await pool.query(`DELETE FROM GROUPS WHERE groupid = $1`, [groupId]);
      return res.status(200).json({ message: "Group deleted successfully" });
    } else {
      return res.status(400).json({ message: "Invalid action." });
    }
  } catch (err) {
    console.error("Error deleting group:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.leaveGroup = async (req, res) => {
  const { groupId, userId } = req.body;

  try {
    // 1. Check if group exists
    const checkGroup = await pool.query(
      `SELECT 1 FROM GROUPS WHERE groupid = $1`,
      [groupId]
    );

    if (checkGroup.rowCount === 0) {
      return res.status(404).json({ message: "Group not found" });
    }

    // 2. Build balances for the user
    const userOwes = {};
    const userIsOwed = {};

    const expensesRes = await pool.query(
      `SELECT id, paidby FROM GROUP_EXPENSES WHERE groupid = $1`,
      [groupId]
    );
    const expenses = expensesRes.rows;

    for (const expense of expenses) {
      const { id: expenseId, paidby } = expense;

      const sharesRes = await pool.query(
        `SELECT userid, amountowned FROM EXPENSES_SHARE WHERE expenseid = $1`,
        [expenseId]
      );

      for (const share of sharesRes.rows) {
        const { userid, amountowned } = share;
        const amount = parseFloat(amountowned);

        if (
          Number(paidby) === Number(userId) &&
          Number(userid) !== Number(userId)
        ) {
          if (!userIsOwed[userid]) userIsOwed[userid] = 0;
          userIsOwed[userid] += amount;
        } else if (
          Number(userid) === Number(userId) &&
          Number(paidby) !== Number(userId)
        ) {
          if (!userOwes[paidby]) userOwes[paidby] = 0;
          userOwes[paidby] += amount;
        }
      }
    }

    const settlementsRes = await pool.query(
      `SELECT fromuserid, touserid, amount FROM SETTLEMENTS WHERE groupid = $1 AND (fromuserid = $2 OR touserid = $2)`,
      [groupId, userId]
    );

    for (const settlement of settlementsRes.rows) {
      const fromId = Number(settlement.fromuserid);
      const toId = Number(settlement.touserid);
      const amount = parseFloat(settlement.amount);

      if (fromId === Number(userId)) {
        if (!userOwes[toId]) userOwes[toId] = 0;
        userOwes[toId] -= amount;
      } else if (toId === Number(userId)) {
        if (!userIsOwed[fromId]) userIsOwed[fromId] = 0;
        userIsOwed[fromId] -= amount;
      }
    }

    // 3. Check if unsettled
    let unsettled = false;
    for (const amount of Object.values(userOwes)) {
      if (amount > 0.009) {
        unsettled = true;
        break;
      }
    }
    if (!unsettled) {
      for (const amount of Object.values(userIsOwed)) {
        if (amount > 0.009) {
          unsettled = true;
          break;
        }
      }
    }

    if (unsettled) {
      return res.status(400).json({
        message: "You must settle all your balances before leaving the group.",
      });
    }

    // 4. Remove user from group
    await pool.query(
      `DELETE FROM GROUP_MEMBERS WHERE groupid = $1 AND userid = $2`,
      [groupId, userId]
    );

    return res.status(200).json({ message: "Successfully left the group" });
  } catch (err) {
    console.error("Error leaving group:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Add a new function to settle up with a user in a group
exports.settleUpWithUser = async (req, res) => {
  const { groupId } = req.params;
  const { fromUserId, toUserId, amount } = req.body;

  if (!groupId || !fromUserId || !toUserId || !amount) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Insert a settlement record
    await pool.query(
      `INSERT INTO SETTLEMENTS (groupid, fromuserid, touserid, amount) VALUES ($1, $2, $3, $4)`,
      [groupId, fromUserId, toUserId, amount]
    );
    res.status(201).json({ message: "Settlement recorded successfully" });
  } catch (err) {
    console.error("Error recording settlement:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get per-user group balances (who owes you, whom you owe)
exports.getUserGroupBalances = async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;

  try {
    // 1. Get all users in the group
    const membersRes = await pool.query(
      "SELECT userId FROM GROUP_MEMBERS WHERE groupId = $1",
      [groupId]
    );
    const members = membersRes.rows.map((row) => row.userid);

    // 2. Get all expenses in this group
    const expensesRes = await pool.query(
      "SELECT id, paidBy, amount FROM GROUP_EXPENSES WHERE groupId = $1",
      [groupId]
    );
    const expenses = expensesRes.rows;

    // 3. Track balances per user
    const userBalances = {};

    for (const expense of expenses) {
      const { id: expenseId, paidby } = expense;
      const sharesRes = await pool.query(
        "SELECT userId, amountOwned FROM EXPENSES_SHARE WHERE expenseId = $1",
        [expenseId]
      );
      for (const share of sharesRes.rows) {
        const { userid, amountowned } = share;
        const amount = parseFloat(amountowned);
        if (paidby === Number(userId) && userid !== Number(userId)) {
          // Requesting user paid for others → others owe them
          if (!userBalances[userid]) userBalances[userid] = 0;
          userBalances[userid] += amount;
        } else if (userid === Number(userId) && paidby !== Number(userId)) {
          // Someone else paid for requesting user → user owes them
          if (!userBalances[paidby]) userBalances[paidby] = 0;
          userBalances[paidby] -= amount;
        }
      }
    }

    // 4. Subtract settlements
    // Get all settlements for this group involving the user
    const settlementsRes = await pool.query(
      `SELECT fromuserid, touserid, amount FROM SETTLEMENTS WHERE groupid = $1 AND (fromuserid = $2 OR touserid = $2)`,
      [groupId, userId]
    );
    for (const settlement of settlementsRes.rows) {
      const fromId = Number(settlement.fromuserid);
      const toId = Number(settlement.touserid);
      const amount = parseFloat(settlement.amount);
      if (fromId === Number(userId)) {
        // User paid to someone else (reduce what they owe)
        if (!userBalances[toId]) userBalances[toId] = 0;
        userBalances[toId] += amount;
      } else if (toId === Number(userId)) {
        // Someone else paid to user (reduce what they owe user)
        if (!userBalances[fromId]) userBalances[fromId] = 0;
        userBalances[fromId] -= amount;
      }
    }

    // 5. Get usernames and split balances
    const owesMe = [];
    const iOwe = [];
    for (const [otherUserId, balance] of Object.entries(userBalances)) {
      const id = parseInt(otherUserId);
      const userRes = await pool.query(
        "SELECT username FROM USERS WHERE user_id = $1",
        [id]
      );
      const username = userRes.rows[0]?.username || `User ${id}`;
      if (balance > 0.009) {
        // They owe you
        owesMe.push({
          username,
          amount: parseFloat(balance.toFixed(2)),
          userId: id,
        });
      } else if (balance < -0.009) {
        // You owe them
        iOwe.push({
          username,
          amount: parseFloat(Math.abs(balance).toFixed(2)),
          userId: id,
        });
      }
    }

    res.status(200).json({ owesMe, iOwe });
  } catch (err) {
    console.error("Error getting user group balances: ", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
