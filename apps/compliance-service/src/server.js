const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const complianceRoutes = require("./routes/complianceRoute");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    service: "compliance-service",
    status: "OK",
    message: "Compliance Service is running",
  });
});

app.use("/api/compliance", complianceRoutes);

const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Compliance Service running on port ${PORT}`);
});