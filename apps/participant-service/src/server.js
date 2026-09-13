const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const participantRoutes = require("./routes/participantRoute");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    service: "participant-service",
    status: "OK",
    message: "Participant Service is running",
  });
});

app.use("/api/participants", participantRoutes);

const PORT = process.env.PORT || 4002;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Participant Service running on port ${PORT}`);
});