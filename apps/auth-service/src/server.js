require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoute");

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

const PORT = process.env.PORT || 4001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Auth Service running on port ${PORT}`);
});