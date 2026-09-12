const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const marketingRoutes = require("./routes/marketingRoute");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({
        service: "marketing-service",
        status: "OK",
        message: "Marketing Service is running",
    });
});

app.use("/api/marketing", marketingRoutes);

const PORT = process.env.MARKETING_SERVICE_PORT || 4009;

app.listen(PORT, () => {
    console.log(
        `Marketing Service running on port ${PORT}`
    );
});