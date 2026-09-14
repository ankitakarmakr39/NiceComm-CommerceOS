const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createProxyMiddleware } = require("http-proxy-middleware");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

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
| Proxy Helper
|--------------------------------------------------------------------------
*/
const createServiceProxy = (target) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    xfwd: true,
    pathRewrite: (path) => path,
    on: {
      error: (error, req, res) => {
        console.error("Gateway Proxy Error:", {
          target,
          path: req.originalUrl,
          message: error.message,
        });

        if (!res.headersSent) {
          res.status(502).json({
            message: "Bad Gateway",
            service: target,
            error: error.message,
          });
        }
      },
    },
  });
};

/*
|--------------------------------------------------------------------------
| Auth Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/auth",
  createServiceProxy(process.env.AUTH_SERVICE_URL)
);

/*
|--------------------------------------------------------------------------
| Participant Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/participants",
  createServiceProxy(process.env.PARTICIPANT_SERVICE_URL)
);

/*
|--------------------------------------------------------------------------
| Commerce Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/products",
  createServiceProxy(process.env.COMMERCE_SERVICE_URL)
);

app.use(
  "/api/cart",
  createServiceProxy(process.env.COMMERCE_SERVICE_URL)
);

app.use(
  "/api/checkout",
  createServiceProxy(process.env.COMMERCE_SERVICE_URL)
);

/*
|--------------------------------------------------------------------------
| Order Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/orders",
  createServiceProxy(process.env.ORDER_SERVICE_URL)
);

/*
|--------------------------------------------------------------------------
| Warehouse Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/warehouse",
  createServiceProxy(process.env.WAREHOUSE_SERVICE_URL)
);

/*
|--------------------------------------------------------------------------
| Packaging Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/packaging",
  createServiceProxy(process.env.PACKAGING_SERVICE_URL)
);

/*
|--------------------------------------------------------------------------
| Logistics Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/logistics",
  createServiceProxy(process.env.LOGISTICS_SERVICE_URL)
);

/*
|--------------------------------------------------------------------------
| Marketing Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/marketing",
  createServiceProxy(process.env.MARKETING_SERVICE_URL)
);

/*
|--------------------------------------------------------------------------
| Affiliate Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/affiliate",
  createServiceProxy(process.env.AFFILIATE_SERVICE_URL)
);

/*
|--------------------------------------------------------------------------
| Inspection Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/inspection",
  createServiceProxy(process.env.INSPECTION_SERVICE_URL)
);

/*
|--------------------------------------------------------------------------
| Compliance Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/compliance",
  createServiceProxy(process.env.COMPLIANCE_SERVICE_URL)
);

/*
|--------------------------------------------------------------------------
| Installation Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/installation",
  createServiceProxy(process.env.INSTALLATION_SERVICE_URL)
);

/*
|--------------------------------------------------------------------------
| Repair Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/repair",
  createServiceProxy(process.env.REPAIR_SERVICE_URL)
);

/*
|--------------------------------------------------------------------------
| Support Service
|--------------------------------------------------------------------------
*/
app.use(
  "/api/support",
  createServiceProxy(process.env.SUPPORT_SERVICE_URL)
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