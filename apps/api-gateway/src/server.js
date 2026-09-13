const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createProxyMiddleware } = require("http-proxy-middleware");

dotenv.config();

const app = express();

app.use(cors());

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/
app.get("/health", (req, res) => {
  res.status(200).json({
    service: "api-gateway",
    status: "OK",
    message: "NiceComm API Gateway is running",
  });
});

/*
|--------------------------------------------------------------------------
| Auth Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true,
  })
);

/*
|--------------------------------------------------------------------------
| Participant Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/participants",
  createProxyMiddleware({
    target: process.env.PARTICIPANT_SERVICE_URL,
    changeOrigin: true,
  })
);

/*
|--------------------------------------------------------------------------
| Commerce Service - Products
|--------------------------------------------------------------------------
*/
app.use(
  "/api/products",
  createProxyMiddleware({
    target: process.env.COMMERCE_SERVICE_URL,
    changeOrigin: true,
  })
);

/*
|--------------------------------------------------------------------------
| Commerce Service - Cart
|--------------------------------------------------------------------------
*/
app.use(
  "/api/cart",
  createProxyMiddleware({
    target: process.env.COMMERCE_SERVICE_URL,
    changeOrigin: true,
  })
);

/*
|--------------------------------------------------------------------------
| Commerce Service - Checkout
|--------------------------------------------------------------------------
*/
app.use(
  "/api/checkout",
  createProxyMiddleware({
    target: process.env.COMMERCE_SERVICE_URL,
    changeOrigin: true,
  })
);

/*
|--------------------------------------------------------------------------
| Order Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/orders",
  createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL,
    changeOrigin: true,
  })
);

/*
|--------------------------------------------------------------------------
| Warehouse Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/warehouse",
  createProxyMiddleware({
    target: process.env.WAREHOUSE_SERVICE_URL,
    changeOrigin: true,
  })
);

/*
|--------------------------------------------------------------------------
| Packaging Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/packaging",
  createProxyMiddleware({
    target: process.env.PACKAGING_SERVICE_URL,
    changeOrigin: true,
  })
);

/*
|--------------------------------------------------------------------------
| Logistics Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/logistics",
  createProxyMiddleware({
    target: process.env.LOGISTICS_SERVICE_URL,
    changeOrigin: true,
  })
);

/*
|--------------------------------------------------------------------------
| Marketing Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/marketing",
  createProxyMiddleware({
    target: process.env.MARKETING_SERVICE_URL,
    changeOrigin: true,
  })
);

/*
|--------------------------------------------------------------------------
| Affiliate Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/affiliate",
  createProxyMiddleware({
    target: process.env.AFFILIATE_SERVICE_URL,
    changeOrigin: true,
  })
);

/*
|--------------------------------------------------------------------------
| Inspection Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/inspection",
  createProxyMiddleware({
    target: process.env.INSPECTION_SERVICE_URL,
    changeOrigin: true,
  })
);

/*
|--------------------------------------------------------------------------
| Compliance Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/compliance",
  createProxyMiddleware({
    target: process.env.COMPLIANCE_SERVICE_URL,
    changeOrigin: true,
  })
);

/*
|--------------------------------------------------------------------------
| Installation Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/installation",
  createProxyMiddleware({
    target: process.env.INSTALLATION_SERVICE_URL,
    changeOrigin: true,
  })
);

/*
|--------------------------------------------------------------------------
| Repair Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/repair",
  createProxyMiddleware({
    target: process.env.REPAIR_SERVICE_URL,
    changeOrigin: true,
  })
);

/*
|--------------------------------------------------------------------------
| Support Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/support",
  createProxyMiddleware({
    target: process.env.SUPPORT_SERVICE_URL,
    changeOrigin: true,
  })
);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/
app.use((req, res) => {
  res.status(404).json({
    message: "API endpoint not found",
    path: req.originalUrl,
  });
});

/*
|--------------------------------------------------------------------------
| Server
|--------------------------------------------------------------------------
*/
const PORT = process.env.PORT || 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API Gateway running on port ${PORT}`);
});