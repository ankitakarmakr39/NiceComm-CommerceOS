const express = require("express");

const {
  checkout,
} = require("../controllers/checkoutController");

const verifyToken = require("../middleware/authMiddleware");
const requirePermission = require("../middleware/permissionMiddleware");

const router = express.Router();

// ==========================================
// CUSTOMER CHECKOUT
// ==========================================

router.post(
  "/",
  verifyToken,
  requirePermission("checkout.create"),
  checkout
);

module.exports = router;