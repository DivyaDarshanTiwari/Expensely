const express = require("express");

const Router = express.Router();

const expenseControllers = require("../controllers/expense");
const { requireAdmin } = require("../middlewares/adminMiddleware");

Router.post("/add", expenseControllers.addGroupExpense);

Router.get("/getAll/:groupId", expenseControllers.getGroupExpenses);

Router.get("/getExpense/:expenseId", expenseControllers.getExpenseById);

Router.get("/getExpenseShare/:expenseId", expenseControllers.getExpenseShares);

Router.get("/getUserExpenses", expenseControllers.getExpensesByUser);

// Delete a group expense by groupId and expenseId
Router.delete("/delete/:groupId/:expenseId", requireAdmin, expenseControllers.deleteGroupExpense);

module.exports = Router;
