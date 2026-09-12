const express = require("express");

const {
  getMyInspectionProfile,
  updateMyInspectionProfile,
  getMyAssignedInspections,
} = require("../controllers/inspectionController");

const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// HEALTH
// =====================================================

router.get("/health", (req, res) => {
  res.status(200).json({
    service: "inspection-service",
    status: "OK",
    message: "Inspection Service is running",
  });
});


// =====================================================
// MY PROFILE
// =====================================================

router.get(
  "/me",
  verifyToken,
  getMyInspectionProfile
);


// =====================================================
// UPDATE MY PROFILE
// =====================================================

router.patch(
  "/me",
  verifyToken,
  updateMyInspectionProfile
);


// =====================================================
// MY ASSIGNED INSPECTIONS
// =====================================================

router.get(
  "/assigned-inspections",
  verifyToken,
  getMyAssignedInspections
);


module.exports = router;