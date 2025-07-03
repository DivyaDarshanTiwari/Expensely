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
} = require("./services/TableCreation");

const groupRoutes = require("./routes/group");
const expenseRoutes = require("./routes/expense");

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

groupsTable();
groupMembersTable();
groupExpensesTable();
expensesShareTable();

app.use("/api/v1/group", groupRoutes);
app.use("/api/v1/groupExpense", expenseRoutes);

module.exports = { app };
