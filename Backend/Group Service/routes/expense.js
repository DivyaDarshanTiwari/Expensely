const express = require("express");

const Router = express.Router();

const expenseControllers = require("../controllers/expense");

Router.post("/add", expenseControllers.addGroupExpense);

Router.get("/getAll/:groupId", expenseControllers.getGroupExpenses);

Router.get("/getExpense/:expenseId", expenseControllers.getExpenseById);

Router.get("/getExpenseShare/:expenseId", expenseControllers.getExpenseShares);

Router.get("/getUserExpenses", expenseControllers.getExpensesByUser);

module.exports = Router;
