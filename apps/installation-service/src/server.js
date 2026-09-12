const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const installationRoutes = require("./routes/installationRoute");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/installation", installationRoutes);

const PORT =
  process.env.INSTALLATION_SERVICE_PORT || 4013;

app.listen(PORT, () => {
  console.log(
    `Installation Service running on port ${PORT}`
  );
});