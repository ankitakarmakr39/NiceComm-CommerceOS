const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const inspectionRoutes = require("./routes/inspectionRoute");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/inspection", inspectionRoutes);

const PORT = process.env.INSPECTION_SERVICE_PORT || 4011;

app.listen(PORT, () => {
  console.log(
    `Inspection Service running on port ${PORT}`
  );
});