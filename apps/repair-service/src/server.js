const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const repairRoutes = require("./routes/repairRoute");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    service: "repair-service",
    status: "OK",
    message: "Repair Service is running",
  });
});

app.use("/api/repair", repairRoutes);

const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Repair Service running on port ${PORT}`);
});