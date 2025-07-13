"use strict";

require("dotenv").config();
const { pool } = require("./config/db");
// check everytime if there is a connetion establised with the database
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Database connection failed:", err.stack);
  } else {
    console.log("✅ Connected to the database at:", res.rows[0].now);
  }
});

const Express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const app = Express();
const { userTable, profileImagaeTable } = require("./services/TableCreation");

const table_creation = async () => {
  await userTable();
  await new Promise((resolve) => setTimeout(resolve, 500));
  await profileImagaeTable();
};

table_creation();

const authRouter = require("./routes/authRoutes");
const uploadRouter = require("./routes/uploadRoutes");

// Middleware
app.use(Express.json()); // To parse JSON
app.use(morgan("dev")); // Log HTTP requests
app.use(cors());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/upload", uploadRouter);

module.exports = { app };
