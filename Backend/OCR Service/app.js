"use strict";
require("dotenv").config();
const Express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const ocrRouter = require("./routes/OcrRoute");
const authProxyMiddleware = require("./middlewares/authProxyMiddleware");

const app = Express();

// Middleware
app.use(Express.json()); // To parse JSON
app.use(morgan("dev")); // Log HTTP requests
app.use(cors());
app.use(authProxyMiddleware);

app.use("/api/v1/ocr", ocrRouter);

module.exports = { app };
