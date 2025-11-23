"use strict";
require("dotenv").config();
const Express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const authProxyMiddleware = require("./middlewares/authProxyMiddleware");

const app = Express();

// Middleware
app.use(Express.json()); // To parse JSON
app.use(morgan("dev")); // Log HTTP requests
app.use(cors());
app.use(authProxyMiddleware);

module.exports = { app };
