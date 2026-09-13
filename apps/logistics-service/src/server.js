const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const logisticsRoutes = require("./routes/logisticsRoute");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({
        service: "logistics-service",
        status: "OK",
        message: "Logistics Service is running",
    });
});

app.use("/api/logistics", logisticsRoutes);

const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Logistics Service running on port ${PORT}`);
});