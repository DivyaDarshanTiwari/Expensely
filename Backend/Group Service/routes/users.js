const express = require("express");

const Router = express.Router();

const userController = require("../controllers/users");

Router.get("/search", userController.searchUser);

module.exports = Router;
