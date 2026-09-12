const bcrypt = require("bcrypt");
const pool = require("../db");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // 2. Check existing email
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "User with this email already exists",
      });
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 4. Create user
    const userResult = await pool.query(
      `
      INSERT INTO users (full_name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, full_name, email, phone, status, created_at
      `,
      [
        name.trim(),
        email.toLowerCase().trim(),
        passwordHash,
      ]
    );

    const user = userResult.rows[0];

    // 5. Assign Customer role
    const roleResult = await pool.query(
      `SELECT id FROM roles WHERE name = 'Customer'`
    );

    if (roleResult.rows.length === 0) {
      return res.status(500).json({
        message: "Customer role not found",
      });
    }

    await pool.query(
      `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, role_id) DO NOTHING
      `,
      [user.id, roleResult.rows[0].id]
    );

    // 6. Safe response
    return res.status(201).json({
      message: "Registration successful",
      user,
      role: "Customer",
    });
  } catch (error) {
    console.error("Registration Error:", error);

    return res.status(500).json({
      message: "Registration failed",
    });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // 2. Find user
    const userResult = await pool.query(
      `
      SELECT
        id,
        full_name,
        email,
        password_hash,
        phone,
        status
      FROM users
      WHERE email = $1
      `,
      [email.toLowerCase().trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = userResult.rows[0];

    // 3. Check account status
    if (user.status !== "Active") {
      return res.status(403).json({
        message: "User account is not active",
      });
    }

    // 4. Compare password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 5. Get user roles
    const roleResult = await pool.query(
      `
      SELECT r.name
      FROM roles r
      INNER JOIN user_roles ur
        ON ur.role_id = r.id
      WHERE ur.user_id = $1
      ORDER BY r.id
      `,
      [user.id]
    );

    const roles = roleResult.rows.map((row) => row.name);

    // 6. Create JWT
    const jwt = require("jsonwebtoken");

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        roles,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      }
    );

    // 7. Safe response
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        roles,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      message: "Login failed",
    });
  }
};

const getMe = async (req, res) => {
  try {
    const userResult = await pool.query(
      `
      SELECT
        id,
        full_name,
        email,
        phone,
        status,
        created_at
      FROM users
      WHERE id = $1
      `,
      [req.user.sub]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    const roleResult = await pool.query(
      `
      SELECT r.name
      FROM roles r
      INNER JOIN user_roles ur
        ON ur.role_id = r.id
      WHERE ur.user_id = $1
      ORDER BY r.id
      `,
      [user.id]
    );

    const roles = roleResult.rows.map((row) => row.name);

    return res.status(200).json({
      message: "User fetched successfully",
      user: {
        ...user,
        roles,
      },
    });
  } catch (error) {
    console.error("Get Me Error:", error);

    return res.status(500).json({
      message: "Failed to fetch user",
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.status,
        u.created_at,

        COALESCE(
          ARRAY_AGG(r.name ORDER BY r.id)
          FILTER (WHERE r.name IS NOT NULL),
          '{}'
        ) AS roles

      FROM users u

      LEFT JOIN user_roles ur
        ON ur.user_id = u.id

      LEFT JOIN roles r
        ON r.id = ur.role_id

      GROUP BY
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.status,
        u.created_at

      ORDER BY u.id DESC
      `
    );

    return res.status(200).json({
      message: "All users fetched successfully",
      count: result.rows.length,
      users: result.rows,
    });
  } catch (error) {
    console.error("Get All Users Error:", error);

    return res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};

const createUser = async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      phone,
      role,
    } = req.body;

    // 1. Validate required fields
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({
        message:
          "Full name, email, password and role are required",
      });
    }

    // 2. Validate password
    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters long",
      });
    }

    // 3. Check email
    const existingUser = await pool.query(
      `
      SELECT id
      FROM users
      WHERE email = $1
      `,
      [email.toLowerCase().trim()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "User with this email already exists",
      });
    }

    // 4. Check role
    const roleResult = await pool.query(
      `
      SELECT id, name
      FROM roles
      WHERE name = $1
      `,
      [role]
    );

    if (roleResult.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    // 5. Hash password
    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    // 6. Create user
    const userResult = await pool.query(
      `
      INSERT INTO users (
        full_name,
        email,
        password_hash,
        phone,
        status
      )
      VALUES ($1, $2, $3, $4, 'Active')
      RETURNING
        id,
        full_name,
        email,
        phone,
        status,
        created_at
      `,
      [
        full_name.trim(),
        email.toLowerCase().trim(),
        passwordHash,
        phone || null,
      ]
    );

    const user = userResult.rows[0];

    // 7. Assign role
    await pool.query(
      `
      INSERT INTO user_roles (
        user_id,
        role_id
      )
      VALUES ($1, $2)
      ON CONFLICT (user_id, role_id)
      DO NOTHING
      `,
      [
        user.id,
        roleResult.rows[0].id,
      ]
    );

    // 8. Safe response
    return res.status(201).json({
      message: "User created successfully",
      user: {
        ...user,
        roles: [roleResult.rows[0].name],
      },
    });
  } catch (error) {
    console.error(
      "Create User Error:",
      error
    );

    return res.status(500).json({
      message: "Failed to create user",
    });
  }
};



const updateUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const {
      full_name,
      email,
      phone,
      password,
      role,
      status,
    } = req.body;

    // 1. Check user exists
    const existingUser = await pool.query(
      `
      SELECT id
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // 2. Validate required fields
    if (!full_name || !email || !role || !status) {
      return res.status(400).json({
        message:
          "Full name, email, role and status are required",
      });
    }

    // 3. Validate status
    const allowedStatuses = [
      "Active",
      "Inactive",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    // 4. Check email belongs to another user
    const emailCheck = await pool.query(
      `
      SELECT id
      FROM users
      WHERE email = $1
        AND id <> $2
      `,
      [
        email.toLowerCase().trim(),
        userId,
      ]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(409).json({
        message:
          "Another user already uses this email",
      });
    }

    // 5. Check role
    const roleResult = await pool.query(
      `
      SELECT id, name
      FROM roles
      WHERE name = $1
      `,
      [role]
    );

    if (roleResult.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    // 6. Update basic user information
    let userResult;

    if (password && password.trim() !== "") {
      if (password.length < 6) {
        return res.status(400).json({
          message:
            "Password must be at least 6 characters long",
        });
      }

      const passwordHash = await bcrypt.hash(
        password,
        12
      );

      userResult = await pool.query(
        `
        UPDATE users
        SET
          full_name = $1,
          email = $2,
          phone = $3,
          password_hash = $4,
          status = $5,
          updated_at = NOW()
        WHERE id = $6
        RETURNING
          id,
          full_name,
          email,
          phone,
          status,
          created_at,
          updated_at
        `,
        [
          full_name.trim(),
          email.toLowerCase().trim(),
          phone || null,
          passwordHash,
          status,
          userId,
        ]
      );
    } else {
      userResult = await pool.query(
        `
        UPDATE users
        SET
          full_name = $1,
          email = $2,
          phone = $3,
          status = $4,
          updated_at = NOW()
        WHERE id = $5
        RETURNING
          id,
          full_name,
          email,
          phone,
          status,
          created_at,
          updated_at
        `,
        [
          full_name.trim(),
          email.toLowerCase().trim(),
          phone || null,
          status,
          userId,
        ]
      );
    }

    // 7. Update role
    await pool.query(
      `
      DELETE FROM user_roles
      WHERE user_id = $1
      `,
      [userId]
    );

    await pool.query(
      `
      INSERT INTO user_roles (
        user_id,
        role_id
      )
      VALUES ($1, $2)
      `,
      [
        userId,
        roleResult.rows[0].id,
      ]
    );

    // 8. Safe response
    return res.status(200).json({
      message: "User updated successfully",
      user: {
        ...userResult.rows[0],
        roles: [roleResult.rows[0].name],
      },
    });
  } catch (error) {
    console.error(
      "Update User Error:",
      error
    );

    return res.status(500).json({
      message: "Failed to update user",
    });
  }
};

const deleteUser = async (req, res) => {
try {
const userId = Number(req.params.id);

if (!Number.isInteger(userId) || userId <= 0) {
  return res.status(400).json({
    message: "Invalid user ID",
  });
}

// Prevent admin from deleting their own account
if (Number(req.user.sub) === userId) {
  return res.status(400).json({
    message: "You cannot deactivate your own account",
  });
}

// Check user exists
const existingUser = await pool.query(
  `
  SELECT
    id,
    full_name,
    email,
    status
  FROM users
  WHERE id = $1
  `,
  [userId]
);

if (existingUser.rows.length === 0) {
  return res.status(404).json({
    message: "User not found",
  });
}

// Already inactive
if (existingUser.rows[0].status === "Inactive") {
  return res.status(400).json({
    message: "User is already inactive",
  });
}

// Soft delete
const result = await pool.query(
  `
  UPDATE users
  SET
    status = 'Inactive',
    updated_at = NOW()
  WHERE id = $1
  RETURNING
    id,
    full_name,
    email,
    phone,
    status,
    created_at,
    updated_at
  `,
  [userId]
);

return res.status(200).json({
  message: "User deactivated successfully",
  user: result.rows[0],
});


} catch (error) {
console.error(
"Delete User Error:",
error
);


return res.status(500).json({
  message: "Failed to deactivate user",
});


}
};


module.exports = {
  register,
  login,
  getMe,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
};