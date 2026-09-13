const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const installationRoutes = require("./routes/installationRoute");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    service: "installation-service",
    status: "OK",
    message: "Installation Service is running",
  });
});

app.use("/api/installation", installationRoutes);

const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Installation Service running on port ${PORT}`);
});