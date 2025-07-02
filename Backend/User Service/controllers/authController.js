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
    console.log(decodeToken);
    const userRecord = await admin.auth().getUser(decodeToken.uid);
    console.log(userRecord);
    res.status(200).json({
      message: "Token is valid",
      user: {
        firebase_uid: decodeToken.uid,
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
  const { phone_number } = req.body || null;

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodeToken = await admin.auth().verifyIdToken(idToken);
    console.log(decodeToken);

    const userRecord = await admin.auth().getUser(decodeToken.uid);

    console.log(userRecord);

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

    res.status(200).json({
      message: "Token is valid and signup is successfull",
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Unauthorized", error: error.message });
  }
};

module.exports = { authController, signUpController };
