const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const packagingRoutes = require("./routes/packagingRoute");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({
        service: "packaging-service",
        status: "OK",
        message: "Packaging Service is running",
    });
});

app.use("/api/packaging", packagingRoutes);

const PORT = process.env.PACKAGING_SERVICE_PORT || 4007;

app.listen(PORT, () => {
    console.log(`Packaging Service running on port ${PORT}`);
});