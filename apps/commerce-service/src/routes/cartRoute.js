const express = require("express");

const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cartController");

const verifyToken = require("../middleware/authMiddleware");
const requirePermission = require("../middleware/permissionMiddleware");

const router = express.Router();

router.get(
  "/",
  verifyToken,
  requirePermission("cart.view"),
  getCart
);

router.post(
  "/items",
  verifyToken,
  requirePermission("cart.create"),
  addToCart
);

router.put(
  "/items/:id",
  verifyToken,
  requirePermission("cart.update"),
  updateCartItem
);

router.delete(
  "/items/:id",
  verifyToken,
  requirePermission("cart.delete"),
  removeCartItem
);

router.delete(
  "/clear",
  verifyToken,
  requirePermission("cart.delete"),
  clearCart
);

module.exports = router;