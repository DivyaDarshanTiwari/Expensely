const express = require("express");

const incomeControllers = require("../controllers/incomeControllers");

const Router = express.Router();

Router.post("/add", incomeControllers.addIncome);
Router.post("/add2", incomeControllers.addIncome2);

Router.get("/getAll", incomeControllers.getAllIncome);

Router.delete("/delete/:incomeId", incomeControllers.deleteIncome);

module.exports = Router;
