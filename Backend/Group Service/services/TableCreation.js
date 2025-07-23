const { pool } = require("../config/db");

//createdBy needs to be the FOREIGN KEY to the User table
exports.groupsTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS GROUPS (
        groupId SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        createdBy INT NOT NULL,
        groupBudget NUMERIC(10, 2) NOT NULL,
        description VARCHAR(1000),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (createdBy) REFERENCES users(user_id)
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
exports.groupMembersTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS GROUP_MEMBERS (
        groupId INT REFERENCES GROUPS(groupId),
        userId INT NOT NULL,
        isAdmin BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (groupId, userId),
        FOREIGN KEY (userId) REFERENCES users(user_id)
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
exports.groupExpensesTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS GROUP_EXPENSES (
        id SERIAL PRIMARY KEY,
        groupId INT REFERENCES GROUPS(groupId),
        paidBy INT NOT NULL,
        createdBy INT NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description VARCHAR(1000),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (paidBy) REFERENCES users(user_id),
        FOREIGN KEY (createdBy) REFERENCES users(user_id)
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
exports.expensesShareTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS EXPENSES_SHARE (
        id SERIAL PRIMARY KEY,
        expenseId INT REFERENCES GROUP_EXPENSES(id),
        userId INT NOT NULL,
        amountOwned NUMERIC(10, 2) NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(user_id)
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

exports.settlementTable = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS SETTLEMENTS (
        id SERIAL PRIMARY KEY,
        groupId INT REFERENCES GROUPS(groupId),
        fromUserId INT NOT NULL,
        toUserId INT NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        settledAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    (err, res) => {
      if (err) {
        console.error("❌ Error creating settlement table:", err);
      } else {
        console.log("✅ Settlement table created or already exists");
      }
    }
  );
};
