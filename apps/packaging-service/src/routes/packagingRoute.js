const express = require("express");

const {
    getMyPackagingProfile,
    updatePackagingCapacity,
    updatePackagingTypes,
    getMyAssignedOrders,
} = require("../controllers/packagingController");

const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// GET MY PACKAGING PROFILE
// ==========================================

router.get(
    "/me",
    verifyToken,
    getMyPackagingProfile
);

// ==========================================
// UPDATE PACKAGING CAPACITY
// ==========================================

router.patch(
    "/me/capacity",
    verifyToken,
    updatePackagingCapacity
);

// ==========================================
// UPDATE PACKAGING TYPES
// ==========================================

router.patch(
    "/me/types",
    verifyToken,
    updatePackagingTypes
);

router.get(
    "/assigned-orders",
    verifyToken,
    getMyAssignedOrders
);

module.exports = router;