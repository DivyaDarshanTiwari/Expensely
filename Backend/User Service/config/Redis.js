"use strict";
require("dotenv").config();
const Redis = require("ioredis");

const url = process.env.REDIS_PUBLIC_URL
  ? process.env.REDIS_PUBLIC_URL
  : process.env.REDIS_URL;

const redis = new Redis(url);

module.exports = redis;
