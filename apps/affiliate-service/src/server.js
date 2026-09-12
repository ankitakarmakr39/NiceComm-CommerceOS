const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const affiliateRoutes = require("./routes/affiliateRoute");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({
        service: "affiliate-service",
        status: "OK",
        message: "Affiliate Service is running",
    });
});

app.use("/api/affiliate", affiliateRoutes);

const PORT =
    process.env.AFFILIATE_SERVICE_PORT || 4010;

app.listen(PORT, () => {
    console.log(
        `Affiliate Service running on port ${PORT}`
    );
});