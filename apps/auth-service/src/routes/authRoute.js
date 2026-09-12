const express = require("express");

const {
  register,
  login,
  getMe,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/authController");

const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get("/me", verifyToken, getMe);

// Admin: Get all users
router.get(
  "/users",
  verifyToken,
  (req, res, next) => {
    if (!req.user.roles?.includes("Platform Admin")) {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    next();
  },
  getAllUsers
);

// Admin: Create user
router.post(
  "/users",
  verifyToken,
  (req, res, next) => {
    if (!req.user.roles?.includes("Platform Admin")) {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    next();
  },
  createUser
);

router.put(
  "/users/:id",
  verifyToken,
  (req, res, next) => {
    if (!req.user.roles?.includes("Platform Admin")) {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    next();
  },
  updateUser
);

router.delete(
  "/users/:id",
  verifyToken,
  (req, res, next) => {
    if (!req.user.roles?.includes("Platform Admin")) {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    next();
  },
  deleteUser
);

module.exports = router;