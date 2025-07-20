"use strict";

// Load environment variables from .env file
require("dotenv").config();

// Import database connection pool
const { pool } = require("./config/db");

// Check every time if there is a connection established with the database
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Database connection failed:", err.stack);
  } else {
    console.log("✅ Connected to the database at:", res.rows[0].now);
  }
});

// Import dependencies
const Express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cron = require("node-cron");

const app = Express();

// Import route handlers
const incomeRoutes = require("./routes/incomeRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const rollBackMonthyRoutes = require("./routes/accountSnapshotRoute");

// Import monthly rollover function
const {
  rollOverMonthlyAccount,
} = require("./controllers/accountSnapshotTable");

// Import middleware to handle authentication proxy
const authProxyMiddleware = require("./middlewares/authProxyMiddleware");

// Import table creation service functions
const {
  accountTable,
  expenseTable,
  incomeTable,
  account_snapshotsTable,
} = require("./services/TableCreation");

// Middleware to parse incoming JSON requests
app.use(Express.json());

// Middleware to log HTTP requests in the console
app.use(morgan("dev"));

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Custom middleware to verify tokens via authentication proxy
app.use(authProxyMiddleware);

// Table creation on server start if tables do not exist
accountTable();
expenseTable();
incomeTable();
account_snapshotsTable();

// Register routes: routes starting with these prefixes will enter respective route handlers
app.use("/api/v1/expense", expenseRoutes);
app.use("/api/v1/income", incomeRoutes);
app.use("/api/v1/account", dashboardRoutes);
app.use("/api/v1", rollBackMonthyRoutes);

// Schedule cron job to run at 00:00 on the 1st of every month
try {
  cron.schedule("0 0 1 * *", async () => {
    console.log("Cron triggered at", new Date().toISOString());
    try {
      // Execute the monthly account rollover logic
      await rollOverMonthlyAccount();
      console.log("rollOverMonthlyAccount executed successfully.");
    } catch (error) {
      // Log errors from rollover execution
      console.error("Error in rollOverMonthlyAccount:", error);
    }
  });
  console.log("Cron job scheduled.");
} catch (error) {
  console.error("Failed to schedule cron job:", error);
}

// Export the Express app for server startup
module.exports = { app };
