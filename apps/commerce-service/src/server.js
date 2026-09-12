const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");


const productRoutes = require("./routes/productRoute");
const cartRoutes = require("./routes/cartRoute");
const checkoutRoutes = require("./routes/checkoutRoute");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/*
  Health Check
*/
app.get("/health", (req, res) => {
  res.status(200).json({
    service: "commerce-service",
    status: "OK",
    message: "Commerce Service is running",
  });
});

/*
  Product Routes
*/
app.use("/api/products", productRoutes);
/*
  Cart Routes
*/
app.use("/api/cart", cartRoutes);
/*
  Checkout Routes
*/
app.use("/api/checkout", checkoutRoutes);

const PORT = process.env.COMMERCE_SERVICE_PORT || 4003;

app.listen(PORT, () => {
  console.log(`Commerce Service running on port ${PORT}`);
});