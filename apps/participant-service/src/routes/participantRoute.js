const express = require("express");

const {
    createParticipant,
    getMyParticipant,
    getAllParticipants,
    updateParticipant,
    toggleParticipantStatus,
    linkUserToParticipant,
} = require("../controllers/participantController");

const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", verifyToken, (req, res, next) => {
  if (!req.user.roles?.includes("Platform Admin")) {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
}, createParticipant);

router.get("/", verifyToken, (req, res, next) => {
  if (!req.user.roles?.includes("Platform Admin")) {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
}, getAllParticipants);

router.put("/:id", verifyToken, (req, res, next) => {
    if (!req.user.roles?.includes("Platform Admin")) {
        return res.status(403).json({
            message: "Admin access required",
        });
    }

    next();
}, updateParticipant);

router.patch("/:id/status", verifyToken, (req, res, next) => {
    if (!req.user.roles?.includes("Platform Admin")) {
        return res.status(403).json({
            message: "Admin access required",
        });
    }

    next();
}, toggleParticipantStatus);

router.post("/:id/link-user", verifyToken, (req, res, next) => {
    if (!req.user.roles?.includes("Platform Admin")) {
        return res.status(403).json({
            message: "Admin access required",
        });
    }

    next();
}, linkUserToParticipant);

router.get("/me", verifyToken, getMyParticipant);

module.exports = router;