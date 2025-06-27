const { pool } = require("../config/db");

// userId has to be done as a FOREIGN KEY when USER Table is implemented for all other relations

exports.expenseTable = () => {
  pool.query(
    `
  CREATE TABLE IF NOT EXISTS EXPENSE (
    expenseId SERIAL PRIMARY KEY,
    userId INTEGER NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description VARCHAR(1000)
  );
`,
    (err, res) => {
      if (err) {
        console.error("❌ Error creating expense table:", err);
      } else {
        console.log("✅ Expense table created or already exists");
      }
    }
  );
};

exports.incomeTable = () => {
  pool.query(
    `
    CREATE TABLE IF NOT EXISTS INCOME (
        incomeId SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        description VARCHAR(1000)
    );
    `,
    (err, res) => {
      if (err) {
        console.error("Error creating INCOME Table!");
      } else {
        console.log("✅ INCOME Table created or already existed!");
      }
    }
  );
};

exports.accountTable = () => {
  pool.query(
    `
        CREATE TABLE IF NOT EXISTS ACCOUNT (
            accountId SERIAL,
            userId INTEGER NOT NULL UNIQUE,
            totalExpense NUMERIC(10, 2) DEFAULT 0.00,
            totalIncome NUMERIC(10, 2) DEFAULT 0.00,
            PRIMARY KEY (userId, accountId)
        );
    `,
    (err, res) => {
      if (err) {
        console.error("Error creating ACCOUNT Table! ", err);
      } else {
        console.log("✅ ACCOUNT Table created or already existed!");
      }
    }
  );
};
