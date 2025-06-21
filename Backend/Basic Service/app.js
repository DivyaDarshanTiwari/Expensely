"use strict";
require("dotenv").config();
const Express = require("express");
const { pool } = require("./config/db");

const app = Express();

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Database connection failed:", err.stack);
  } else {
    console.log("✅ Connected to the database at:", res.rows[0].now);
  }
});

module.exports = { app };
