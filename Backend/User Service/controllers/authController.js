"use strict";

const admin = require("../services/firebaseAdmin");
const { pool } = require("../config/db");

const authController = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodeToken = await admin.auth().verifyIdToken(idToken);
    if (!decodedToken.email_verified) {
      return res.status(403).json({ message: "Email not verified" });
    }
    const firebase_uid = decodeToken.uid;
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE firebase_uid = $1",
      [firebase_uid]
    );

    if (rows.length === 0) {
      // UID not found in your DB, unauthorized
      return res.status(401).json({
        message: "Unauthorized: User not registered in the system",
      });
    }

    // If found, respond with success and user info
    res.status(200).json({
      message: "Token is valid, user found",
      user: {
        user_id: rows[0].user_id,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Unauthorized", error: error.message });
  }
};

const signUpController = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
  const { phone_number } = req.body ?? {}; // safer

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodeToken = await admin.auth().verifyIdToken(idToken);
    if (!decodeToken.email_verified) {
      return res.status(403).json({ message: "Email not verified" });
    }
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE firebase_uid = $1",
      [decodeToken.uid]
    );

    if (rows.length > 0) {
      // UID not found in your DB, unauthorized
      return res.status(401).json({
        message: "User is already registered",
      });
    }

    const userRecord = await admin.auth().getUser(decodeToken.uid);

    const result = await pool.query(
      `
        INSERT INTO USERs (firebase_uid , username ,email, phone_number , user_photo)
        VALUES ($1,$2,$3,$4,$5) RETURNING *;
        `,
      [
        decodeToken.uid,
        userRecord.displayName,
        decodeToken.email,
        phone_number,
        userRecord.photoURL,
      ]
    );

    await pool.query(
      `INSERT INTO ACCOUNT (userId) VALUES ($1) ON CONFLICT (userId) DO NOTHING`,
      [result.rows[0].user_id]
    );

    res.status(200).json({
      message: "Token is valid and signup is successfull",
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Unauthorized", error: error.message });
  }
};

const getMe = async (req, res) => {
  const userId = req.user?.userId; // Assuming middleware sets req.user.userId

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: No userId found" });
  }

  try {
    const result = await pool.query(
      `SELECT user_id, username, email FROM USERS WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error getting user info:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { authController, signUpController, getMe };
