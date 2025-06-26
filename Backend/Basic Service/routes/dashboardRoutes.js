const express = require("express");

const dashboardControllers = require("../controllers/dashboardController");

const Router = express.Router();

Router.get("/getDashboard/:userId", dashboardControllers.getDashboardAmounts);

module.exports = Router;
