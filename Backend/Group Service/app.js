"use strict";

require("dotenv").config();

const { pool } = require("./config/db");
pool.query(`SELECT NOW()`, (err, res) => {
  if (err) {
    console.error("Database connection failed : ", err.stack);
  } else {
    console.log("Connected to database at : ", res.rows[0].now);
  }
});

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const app = express();

const {
  groupsTable,
  groupMembersTable,
  groupExpensesTable,
  expensesShareTable,
  settlementTable,
} = require("./services/TableCreation");

const groupRoutes = require("./routes/group");
const expenseRoutes = require("./routes/expense");
const userRoutes = require("./routes/users");
const authProxyMiddleware = require("./middlewares/authProxyMiddleware");

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());
app.use(authProxyMiddleware);

async function initTables() {
  await groupsTable();
  await groupMembersTable();
  await groupExpensesTable();
  await expensesShareTable();
  await settlementTable();
}

initTables();

app.use("/api/v1/group", groupRoutes);
app.use("/api/v1/groupExpense", expenseRoutes);
app.use("/api/v1/users", userRoutes);

module.exports = { app };
