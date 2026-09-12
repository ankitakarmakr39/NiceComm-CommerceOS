const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
  console.log("Repair Service connected to PostgreSQL");
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL error:", error);
});

module.exports = pool;