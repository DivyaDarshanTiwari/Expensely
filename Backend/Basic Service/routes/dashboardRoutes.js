const express = require("express");

const dashboardControllers = require("../controllers/dashboardController");

const Router = express.Router();

Router.get("/getDashboard/:userId", dashboardControllers.getDashboardAmounts);
Router.get(
  "/getFinancialOverview/:userId",
  dashboardControllers.getFinancialOverview
);

module.exports = Router;
