const express = require("express");

const Router = express.Router();

const expenseControllers = require("../controllers/expense");

Router.post("/add", expenseControllers.addGroupExpense);

Router.get("/getAll/:groupId", expenseControllers.getGroupExpenses);

Router.get("/getExpense/:expenseId", expenseControllers.getExpenseById);

Router.get("/getExpenseShare/:expenseId", expenseControllers.getExpenseShares);

Router.get("/getUserExpenses", expenseControllers.getExpensesByUser);

// Edit a group expense (only by creator)
Router.put("/edit/:groupId/:expenseId", expenseControllers.editGroupExpense);
// Delete a group expense by groupId and expenseId (only by creator)
Router.delete("/delete/:groupId/:expenseId", expenseControllers.deleteGroupExpense);

module.exports = Router;
