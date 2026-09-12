const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const repairRoutes = require("./routes/repairRoute");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/repair", repairRoutes);

const PORT =
  process.env.REPAIR_SERVICE_PORT || 4012;

app.listen(PORT, () => {
  console.log(
    `Repair Service running on port ${PORT}`
  );
});