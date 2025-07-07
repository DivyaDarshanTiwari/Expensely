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
