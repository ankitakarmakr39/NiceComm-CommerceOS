const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const complianceRoutes = require("./routes/complianceRoute");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/compliance", complianceRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    service: "compliance-service",
    status: "OK",
    message: "Compliance Service is running",
  });
});

const PORT =
  process.env.COMPLIANCE_SERVICE_PORT || 4015;

app.listen(PORT, () => {
  console.log(
    `Compliance Service running on port ${PORT}`
  );
});