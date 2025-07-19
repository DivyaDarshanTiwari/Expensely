const { pool } = require("../config/db");

// Middleware to check if user is an admin in the specified group
const requireAdmin = async (req, res, next) => {
  const { groupId } = req.params;
  const { userId } = req.body; // Changed from currentUserId to userId

  if (!groupId || !userId) {
    return res.status(400).json({
      message: "Missing required fields: groupId and userId",
    });
  }

  try {
    // Check if user is an admin in the group
    const adminCheck = await pool.query(
      `SELECT isAdmin FROM GROUP_MEMBERS WHERE groupId = $1 AND userId = $2`,
      [groupId, userId]
    );

    if (adminCheck.rowCount === 0) {
      return res.status(404).json({ message: "User not found in group" });
    }

    if (!adminCheck.rows[0].isadmin) {
      return res.status(403).json({ message: "Admin privileges required" });
    }

    // Add admin status to request for potential use in controllers
    req.isAdmin = true;
    req.groupId = groupId;
    req.currentUserId = userId; // Keep this for backward compatibility

    next();
  } catch (err) {
    console.error("Error in admin middleware:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Middleware to check if user is a member (admin or regular) in the group
const requireMember = async (req, res, next) => {
  const { groupId } = req.params;
  const { userId } = req.body; // Changed from currentUserId to userId

  if (!groupId || !userId) {
    return res.status(400).json({
      message: "Missing required fields: groupId and userId",
    });
  }

  try {
    // Check if user is a member in the group
    const memberCheck = await pool.query(
      `SELECT isAdmin FROM GROUP_MEMBERS WHERE groupId = $1 AND userId = $2`,
      [groupId, userId]
    );

    if (memberCheck.rowCount === 0) {
      return res.status(404).json({ message: "User not found in group" });
    }

    // Add member info to request
    req.isAdmin = memberCheck.rows[0].isadmin;
    req.groupId = groupId;
    req.currentUserId = userId; // Keep this for backward compatibility

    next();
  } catch (err) {
    console.error("Error in member middleware:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  requireAdmin,
  requireMember,
};
