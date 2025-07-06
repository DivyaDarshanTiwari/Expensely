"use strict";
require("dotenv").config();
const axios = require("axios");

const authProxyMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log(authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const response = await axios.post(
      process.env.AUTH_SERVICE_API, // your Auth Microservice URL
      {},
      {
        headers: {
          Authorization: authHeader,
        },
      }
    );

    const user_id = response.data.user.user_id;
    req.body = req.body ?? {};
    req.body.userId = user_id;

    next();
  } catch (error) {
    console.error(
      "Auth Proxy Middleware Error:",
      error.response?.data || error.message
    );
    return res.status(401).json({
      message: "Unauthorized",
      error: error.response?.data?.message || error.message,
    });
  }
};

module.exports = authProxyMiddleware;
