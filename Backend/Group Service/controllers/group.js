const { pool } = require("../config/db");

exports.createGroup = async (req, res) => {
  const { name, createdBy, groupMembers } = req.body; //groupMembers = {userIds}
  try {
    if (!name || !createdBy || !groupMembers) {
      return res.status(404).json({ message: "Incomplete Fields" });
    }

    const result = await pool.query(
      `INSERT INTO GROUPS (name, createdBy) VALUES ($1, $2) RETURNING *`,
      [name, createdBy]
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

exports.getAllGroups = async (req, res) => {
  try {
    const result = await pool.query(`SELECT groupId, name FROM GROUPS`);
    res.status(201).json(result.rows);
  } catch (err) {
    console.error("Error getting all the groups : ", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Need to add to get the name from the USER table once USER table implemented
exports.getGroupMembers = async (req, res) => {
  const { groupId } = req.params;
  try {
    const result = await pool.query(
      `SELECT userId FROM GROUP_MEMBERS WHERE groupId = $1`,
      [groupId]
    );
    res.status(201).json(result.rows);
  } catch (err) {
    console.error("Error getting group members : ", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.addMemberToGroup = async (req, res) => {
  const { groupId, userId } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO GROUP_MEMBERS (groupId, userId) VALUES ($1, $2) RETURNING *`,
      [groupId, userId]
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
  const { groupId, userId } = req.body;
  try {
    const result = await pool.query(
      "DELETE FROM group_members WHERE groupId = $1 AND userId = $2 RETURNING *",
      [groupId, userId]
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
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT g.groupid, g.name
       FROM groups g
       JOIN group_members gm ON g.groupid = gm.groupId
       WHERE gm.userId = $1`,
      [userId]
    );

    res.status(201).json(result.rows);
  } catch (err) {
    console.error("Error getting groups by user : ", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
