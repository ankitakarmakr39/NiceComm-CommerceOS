const express = require("express");

const {
  getMyInstallationProfile,
  getMyAssignedInstallations,
} = require("../controllers/installationController");

const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// Health Check
router.get("/health", (req, res) => {
  res.status(200).json({
    service: "installation-service",
    status: "OK",
    message: "Installation Service is running",
  });
});

// My Installation Partner Profile
router.get(
  "/me",
  verifyToken,
  getMyInstallationProfile
);

// My Assigned Installations
router.get(
  "/assigned-installations",
  verifyToken,
  getMyAssignedInstallations
);

module.exports = router;