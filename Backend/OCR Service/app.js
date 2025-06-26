"use strict";
require("dotenv").config();
const Express = require("express");
const { pool } = require("./config/db");
const morgan = require("morgan");
const cors = require("cors");
const ocrRouter = require("./routes/OcrRoute");

const app = Express();

// Middleware
app.use(Express.json()); // To parse JSON
app.use(morgan("dev")); // Log HTTP requests
app.use(cors());

// check everytime if there is a connetion establised with the database
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Database connection failed:", err.stack);
  } else {
    console.log("✅ Connected to the database at:", res.rows[0].now);
  }
});

app.use("/api/v1/ocr", ocrRouter);
module.exports = { app };
