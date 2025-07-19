const express = require("express");

const Router = express.Router();

const {
  rollOverMonthlyAccountByAdmin,
} = require("../controllers/accountSnapshotTable");

Router.post("/admin/rollover", rollOverMonthlyAccountByAdmin);

module.exports = Router;
