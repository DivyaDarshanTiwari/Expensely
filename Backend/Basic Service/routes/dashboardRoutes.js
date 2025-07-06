const express = require("express");

const dashboardControllers = require("../controllers/dashboardController");

const Router = express.Router();

Router.get("/getDashboard", dashboardControllers.getDashboardAmounts);
Router.get("/getFinancialOverview", dashboardControllers.getFinancialOverview);
Router.get(
  "/getMergedTransactions",
  dashboardControllers.getMergedTransactions
);

module.exports = Router;
