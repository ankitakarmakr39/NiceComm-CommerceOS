const express = require("express");

const {
    getMyLogisticsProfile,
    updateLogisticsProfile,
    getMyAssignedOrders,
} = require("../controllers/logisticsController");

const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/health", (req, res) => {
    res.status(200).json({
        service: "logistics-service",
        status: "OK",
        message: "Logistics Service is running",
    });
});

router.get(
    "/me",
    verifyToken,
    getMyLogisticsProfile
);

router.patch(
    "/me",
    verifyToken,
    updateLogisticsProfile
);

router.get(
    "/assigned-orders",
    verifyToken,
    getMyAssignedOrders
);

module.exports = router;