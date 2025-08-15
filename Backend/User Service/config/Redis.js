"use strict";
require("dotenv").config();
const Redis = require("ioredis");

const redis = new Redis(process.env.Redis_URL);
module.exports = redis;
