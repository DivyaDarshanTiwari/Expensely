// middleware/authMiddleware.js
"use strict";

const admin = require("../services/firebaseAdmin");
const { pool } = require("../config/db");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebase_uid = decodedToken.uid;

    const { rows } = await pool.query(
      "SELECT * FROM users WHERE firebase_uid = $1",
      [firebase_uid]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Unauthorized: User not registered in the system",
      });
    }

    // Attach user info to request
    req.userid = rows[0].user_id;

    next(); // Move to the next middleware or controller
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Unauthorized", error: error.message });
  }
};

module.exports = authMiddleware;
