"use strict";
require("dotenv").config();
const Express = require("express");
const { pool } = require("./config/db");
const expenseRoutes = require("./routes/expenseRoutes");
const morgan = require("morgan");
const cors = require("cors");

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

//used to register the expense route(any route starting with this will enter the expneseRoutes)
app.use("/api/v1/expense", expenseRoutes);

module.exports = { app };
