const pool = require("./src/db");

const testDatabase = async () => {
  try {
    const result = await pool.query("SELECT NOW()");

    console.log("Order Service DB connection successful");
    console.log("Database time:", result.rows[0].now);
  } catch (error) {
    console.error("Order Service DB connection failed:", error.message);
  } finally {
    await pool.end();
  }
};

testDatabase();