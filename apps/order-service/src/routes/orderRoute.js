const express = require("express");

const {
    getMyOrders,
    getMyOrderById,
    getAdminOrderById,
    getMyAssignedOrders,
    updateMyAssignmentStatus,
    getAllOrders,
    createAssignment,
    createRepairAssignment,
    createInstallationAssignment,
} = require("../controllers/orderController");

const verifyToken = require("../middleware/authMiddleware");
const requirePermission = require("../middleware/permissionMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

const router = express.Router();

// ==========================================
// GET MY ORDERS
// ==========================================

router.get(
    "/",
    verifyToken,
    requirePermission("orders.view"),
    getMyOrders
);

// ==========================================
// GET ALL ORDERS - ADMIN ONLY
// ==========================================

router.get(
    "/admin/all",
    verifyToken,
    requireAdmin,
    requirePermission("orders.view"),
    getAllOrders
);

// ==========================================
// GET ORDER BY ID - ADMIN ONLY
// ==========================================

router.get(
    "/admin/:id",
    verifyToken,
    requireAdmin,
    requirePermission("orders.view"),
    getAdminOrderById
);

// ==========================================
// CREATE ORDER ASSIGNMENT - ADMIN ONLY
// ==========================================

router.post(
    "/assignments",
    verifyToken,
    requireAdmin,
    requirePermission("assignments.create"),
    createAssignment
);

// ==========================================
// CREATE REPAIR ASSIGNMENT - ADMIN ONLY
// ==========================================

router.post(
    "/repair-assignments",
    verifyToken,
    requireAdmin,
    requirePermission("assignments.create"),
    createRepairAssignment
);

// ==========================================
// CREATE INSTALLATION ASSIGNMENT - ADMIN ONLY
// ==========================================

router.post(
    "/installation-assignments",
    verifyToken,
    requireAdmin,
    requirePermission("assignments.create"),
    createInstallationAssignment
);

// ==========================================
// GET MY ASSIGNED ORDERS
// ==========================================

router.get(
    "/assigned",
    verifyToken,
    requirePermission("assignments.view"),
    getMyAssignedOrders
);

// ==========================================
// UPDATE MY ASSIGNMENT STATUS
// ==========================================

router.patch(
    "/assignments/:id",
    verifyToken,
    requirePermission("assignments.update"),
    updateMyAssignmentStatus
);

// ==========================================
// GET MY ORDER BY ID
// ==========================================

router.get(
    "/:id",
    verifyToken,
    requirePermission("orders.view"),
    getMyOrderById
);

module.exports = router;