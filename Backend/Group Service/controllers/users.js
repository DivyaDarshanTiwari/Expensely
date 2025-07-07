const { pool } = require("../config/db");

exports.searchUser = async (req, res) => {
  const query = req.query.q;

  if (!query || query.trim().length < 2) {
    return res.status(400).json({ error: "Query too short" });
  }

  try {
    const result = await pool.query(
      `SELECT user_id, username, email FROM USERS WHERE username ILIKE $1`,
      [query + "%"]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Search failed", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
