const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const warehouseRoutes = require("./routes/warehouseRoute");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({
        service: "warehouse-service",
        status: "OK",
        message: "Warehouse Service is running",
    });
});

app.use("/api/warehouse", warehouseRoutes);

const PORT = process.env.WAREHOUSE_SERVICE_PORT || 4006;

app.listen(PORT, () => {
    console.log(`Warehouse Service running on port ${PORT}`);
});