const bcrypt = require("bcrypt");
const pool = require("./src/db");

const createAdmin = async () => {
  const client = await pool.connect();

  try {
    const name = "Ankita";
    const email = "admin@nicecomm.com";
    const password = "Admin@123456";

    await client.query("BEGIN");

    const passwordHash = await bcrypt.hash(password, 12);

    const userResult = await client.query(
      `
      INSERT INTO users (
        full_name,
        email,
        password_hash,
        status
      )
      VALUES ($1, $2, $3, 'Active')
      RETURNING id, full_name, email, status
      `,
      [name, email, passwordHash]
    );

    const user = userResult.rows[0];

    const roleResult = await client.query(
      `
      SELECT id, name
      FROM roles
      WHERE name = 'Platform Admin'
      `
    );

    if (roleResult.rows.length === 0) {
      throw new Error("Platform Admin role not found");
    }

    const role = roleResult.rows[0];

    await client.query(
      `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      `,
      [user.id, role.id]
    );

    await client.query("COMMIT");

    console.log("Admin created successfully:");
    console.log(user);
    console.log("Role:", role.name);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Admin creation failed:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
};

createAdmin();