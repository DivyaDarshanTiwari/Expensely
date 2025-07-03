const { pool } = require("../config/db");

//createdBy needs to be the FOREIGN KEY to the User table
exports.groupsTable = () => {
  pool.query(
    `CREATE TABLE IF NOT EXISTS GROUPS (
        groupId SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        createdBy INT NOT NULL,
        groupBudget NUMERIC(10, 2) NOT NULL,
        description VARCHAR(1000),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    (err, res) => {
      if (err) {
        console.error("❌ Error creating groups table:", err);
      } else {
        console.log("✅ Groups table created or already exists");
      }
    }
  );
};

//userId needs to be the FOREIGN KEY later
exports.groupMembersTable = () => {
  pool.query(
    `CREATE TABLE IF NOT EXISTS GROUP_MEMBERS (
        groupId INT REFERENCES GROUPS(groupId),
        userId INT NOT NULL,
        PRIMARY KEY (groupId, userId)
    );`,
    (err, res) => {
      if (err) {
        console.error("❌ Error creating group_members table:", err);
      } else {
        console.log("✅ Group_Members table created or already exists");
      }
    }
  );
};

//paidBy needs to be the FOREIGN KEY referencing USERS
exports.groupExpensesTable = () => {
  pool.query(
    `CREATE TABLE IF NOT EXISTS GROUP_EXPENSES (
        id SERIAL PRIMARY KEY,
        groupId INT REFERENCES GROUPS(groupId),
        paidBy INT NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description VARCHAR(1000),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    (err, res) => {
      if (err) {
        console.error("❌ Error creating group_expenses table:", err);
      } else {
        console.log("✅ Group_Expenses table created or already exists");
      }
    }
  );
};

//userId needs to be the FOREIGN KEY
exports.expensesShareTable = () => {
  pool.query(
    `CREATE TABLE IF NOT EXISTS EXPENSES_SHARE (
        id SERIAL PRIMARY KEY,
        expenseId INT REFERENCES GROUP_EXPENSES(id),
        userId INT NOT NULL,
        amountOwned NUMERIC(10, 2) NOT NULL
    );`,
    (err, res) => {
      if (err) {
        console.error("❌ Error creating expenses_share table:", err);
      } else {
        console.log("✅ Expenses_share table created or already exists");
      }
    }
  );
};
