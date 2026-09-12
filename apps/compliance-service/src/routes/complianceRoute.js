const express = require("express");

const verifyToken = require("../middleware/authMiddleware");

const {
  getMyComplianceStatus,
} = require("../controllers/complianceController");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    service: "compliance-service",
    status: "OK",
    message: "Compliance Service is running",
  });
});

router.get(
  "/me",
  verifyToken,
  getMyComplianceStatus
);

module.exports = router;