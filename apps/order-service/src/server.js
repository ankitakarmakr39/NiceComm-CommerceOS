const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const orderRoutes = require("./routes/orderRoute");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// HEALTH CHECK
// ==========================================
app.get("/health", (req, res) => {
  res.status(200).json({
    service: "order-service",
    status: "OK",
    message: "Order Service is running",
  });
});

// ==========================================
// ORDER ROUTES
// ==========================================
app.use("/api/orders", orderRoutes);

// ==========================================
// SERVER
// ==========================================
const PORT = process.env.PORT || 4004;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Order Service running on port ${PORT}`);
});