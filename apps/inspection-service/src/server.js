const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const inspectionRoutes = require("./routes/inspectionRoute");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    service: "inspection-service",
    status: "OK",
    message: "Inspection Service is running",
  });
});

app.use("/api/inspection", inspectionRoutes);

const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Inspection Service running on port ${PORT}`);
});