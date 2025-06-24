"use strict";

const express = require("express");
const {
  addExpense,
  getAllExpense,
  deleteExpense,
} = require("../controllers/expenseControllers");

const router = express.Router();

// add the expense to the database
router.post("/add", addExpense);

//get all the expense that are there
router.get("/getAll/:userId", getAllExpense);

//delete a particular expense form the database
router.delete("/delete/:id", deleteExpense);

module.exports = router;
