const { pool } = require("../config/db");

const userTable = async () => {
  pool.query(
    `
    CREATE TABLE IF NOT EXISTS USERS (
      user_id SERIAL PRIMARY KEY,
      firebase_uid VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(100),
      email VARCHAR(255) UNIQUE NOT NULL,
      user_photo VARCHAR(255),
      phone_number VARCHAR(20),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `,
    (err, res) => {
      if (err) {
        console.error("❌ Error creating user table:", err);
      } else {
        console.log("✅ user table created or already exists");
      }
    }
  );
};

const profileImagaeTable = async () => {
  pool.query(
    `
    CREATE TABLE IF NOT EXISTS PROFILEIMAGE (
    userid INT PRIMARY KEY,
    public_id VARCHAR(100) UNIQUE NOT NULL,
    FOREIGN KEY (userid) REFERENCES users(user_id)
    )
    `,
    (err, res) => {
      if (err) {
        console.error("❌ Error creating profileimage table:", err);
      } else {
        console.log("✅ profileimage table created or already exists");
      }
    }
  );
};
module.exports = { userTable, profileImagaeTable };
