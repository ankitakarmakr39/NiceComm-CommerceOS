const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const supportRoutes = require("./routes/supportRoute");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/support", supportRoutes);

const PORT =
  process.env.SUPPORT_SERVICE_PORT || 4014;

app.listen(PORT, () => {
  console.log(
    `Support Service running on port ${PORT}`
  );
});