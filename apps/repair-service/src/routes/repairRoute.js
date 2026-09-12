const express = require("express");

const {
  getMyRepairProfile,
  getMyAssignedRepairs,
} = require("../controllers/repairController");

const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    service: "repair-service",
    status: "OK",
    message: "Repair Service is running",
  });
});

router.get(
  "/me",
  verifyToken,
  getMyRepairProfile
);

router.get(
  "/assigned-repairs",
  verifyToken,
  getMyAssignedRepairs
);

module.exports = router;