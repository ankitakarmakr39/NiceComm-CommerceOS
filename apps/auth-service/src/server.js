const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const authRoutes = require("./routes/authRoute");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    service: "auth-service",
    status: "OK",
    message: "Auth Service is running",
  });
});

app.use("/api/auth", authRoutes);

const PORT = process.env.AUTH_SERVICE_PORT || 4001;

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});