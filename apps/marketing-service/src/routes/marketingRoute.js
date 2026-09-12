const express = require("express");

const {
    getMyMarketingProfile,
    updateMyMarketingProfile,
    getMyMarketingClients,
    createMarketingClient,
    getMyMarketingCampaigns,
    createMarketingCampaign,
} = require("../controllers/marketingController");

const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Marketing Service Health
|--------------------------------------------------------------------------
*/
router.get("/health", (req, res) => {
    res.status(200).json({
        service: "marketing-service",
        status: "OK",
        message: "Marketing Service is running",
    });
});

/*
|--------------------------------------------------------------------------
| Marketing Agency Profile
|--------------------------------------------------------------------------
*/
router.get(
    "/me",
    verifyToken,
    getMyMarketingProfile
);

router.patch(
    "/me",
    verifyToken,
    updateMyMarketingProfile
);

router.get(
    "/clients",
    verifyToken,
    getMyMarketingClients
);

router.post(
    "/clients",
    verifyToken,
    createMarketingClient
);

router.get(
    "/campaigns",
    verifyToken,
    getMyMarketingCampaigns
);

router.post(
    "/campaigns",
    verifyToken,
    createMarketingCampaign
);

module.exports = router;