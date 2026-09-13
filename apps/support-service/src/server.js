const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const supportRoutes = require("./routes/supportRoute");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    service: "support-service",
    status: "OK",
    message: "Support Service is running",
  });
});

app.use("/api/support", supportRoutes);

const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Support Service running on port ${PORT}`);
});