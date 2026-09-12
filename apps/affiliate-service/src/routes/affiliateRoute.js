const express = require("express");

const {
    getMyAffiliateProfile,
    updateMyAffiliateProfile,
    getMyAffiliateCommissions,
} = require("../controllers/affiliateController");

const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/health", (req, res) => {
    res.status(200).json({
        service: "affiliate-service",
        status: "OK",
        message: "Affiliate Service is running",
    });
});

router.get(
    "/me",
    verifyToken,
    getMyAffiliateProfile
);

router.patch(
    "/me",
    verifyToken,
    updateMyAffiliateProfile
);

router.get(
    "/commissions",
    verifyToken,
    getMyAffiliateCommissions
);

module.exports = router;