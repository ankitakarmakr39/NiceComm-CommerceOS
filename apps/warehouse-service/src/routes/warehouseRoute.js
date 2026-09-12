const express = require("express");

const {
    getMyWarehouseProfile,
    updateWarehouseCapacity,
    getMyAssignedOrders,
} = require("../controllers/warehouseController");

const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// GET MY WAREHOUSE PROFILE
// ==========================================
router.get(
    "/me",
    verifyToken,
    getMyWarehouseProfile
);

// ==========================================
// UPDATE MY WAREHOUSE CAPACITY
// ==========================================
router.patch(
    "/me/capacity",
    verifyToken,
    updateWarehouseCapacity
);

// ==========================================
// GET MY ASSIGNED ORDERS
// ==========================================

router.get(
    "/assigned-orders",
    verifyToken,
    getMyAssignedOrders
);

module.exports = router;