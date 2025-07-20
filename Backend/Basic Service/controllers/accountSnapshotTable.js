"use strict";

// Import PostgreSQL connection pool
const { pool } = require("../config/db");

// Function to perform monthly rollover automatically (for cron job)
const rollOverMonthlyAccount = async () => {
  const client = await pool.connect(); // Get a database client from the pool
  try {
    await client.query("BEGIN"); // Start transaction

    // Get today's date in YYYY-MM-DD format
    const date = new Date();
    const yearMonth = `${date.getFullYear()}-${String(
      date.getMonth() + 1 // getMonth is 0-indexed, so +1 for correct month
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    // Fetch all accounts from the ACCOUNT table
    const accountsRes = await client.query(`
            SELECT accountId, userId, totalIncome, totalExpense
            FROM ACCOUNT
        `);

    // For each account, take snapshot and reset expenses while retaining balance
    for (const row of accountsRes.rows) {
      const { userid, totalincome, totalexpense } = row;
      const balance = Number(totalincome) - Number(totalexpense);

      // Insert a snapshot record into account_snapshots
      await client.query(
        `
                INSERT INTO account_snapshots (userId, snapshot_date, totalIncome, totalExpense, balance)
                VALUES ($1, $2, $3, $4, $5)
            `,
        [userid, yearMonth, totalincome, totalexpense, balance]
      );

      // Update ACCOUNT: reset totalExpense, set totalIncome to current balance
      await client.query(
        `
                UPDATE ACCOUNT
                SET totalExpense = 0,
                    totalIncome = $1
                WHERE userId = $2
            `,
        [balance, userid]
      );
    }
    await client.query("COMMIT"); // Commit transaction
  } catch (err) {
    await client.query("ROLLBACK"); // Rollback if error occurs
    console.error("Error during monthly rollover:", err);
  } finally {
    client.release(); // Release the database client back to the pool
  }
};

// Function to perform monthly rollover triggered by an admin API call
const rollOverMonthlyAccountByAdmin = async (req, res) => {
  const client = await pool.connect(); // Get a database client from the pool
  try {
    await client.query("BEGIN"); // Start transaction

    // Get today's date in YYYY-MM-DD format
    const date = new Date();
    const yearMonth = `${date.getFullYear()}-${String(
      date.getMonth() + 1 // getMonth is 0-indexed, so +1 for correct month
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    // Fetch all accounts from the ACCOUNT table
    const accountsRes = await client.query(`
            SELECT accountId, userId, totalIncome, totalExpense
            FROM ACCOUNT
        `);

    // For each account, take snapshot and reset expenses while retaining balance
    for (const row of accountsRes.rows) {
      const { userid, totalincome, totalexpense } = row;
      const balance = Number(totalincome) - Number(totalexpense);

      // Insert a snapshot record into account_snapshots
      await client.query(
        `
                INSERT INTO account_snapshots (userId, snapshot_date, totalIncome, totalExpense, balance)
                VALUES ($1, $2, $3, $4, $5)
            `,
        [userid, yearMonth, totalincome, totalexpense, balance]
      );

      // Update ACCOUNT: reset totalExpense, set totalIncome to current balance
      await client.query(
        `
                UPDATE ACCOUNT
                SET totalExpense = 0,
                    totalIncome = $1
                WHERE userId = $2
            `,
        [balance, userid]
      );
    }
    await client.query("COMMIT"); // Commit transaction

    // Send success response to admin
    res.status(200).json({
      message: "RollOver Completed",
    });
  } catch (err) {
    await client.query("ROLLBACK"); // Rollback if error occurs
    console.error("Error during monthly rollover:", err);

    // Send error response to admin
    res.status(500).json({
      message: "Error in the backend",
    });
  } finally {
    client.release(); // Release the database client back to the pool
  }
};

// Export functions for use in cron scheduler and routes
module.exports = { rollOverMonthlyAccount, rollOverMonthlyAccountByAdmin };
