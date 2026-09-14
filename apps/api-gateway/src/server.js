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
| Service Proxy
|--------------------------------------------------------------------------
*/
const serviceRoutes = [
  {
    path: "/api/auth",
    target: process.env.AUTH_SERVICE_URL,
  },
  {
    path: "/api/participants",
    target: process.env.PARTICIPANT_SERVICE_URL,
  },
  {
    path: "/api/products",
    target: process.env.COMMERCE_SERVICE_URL,
  },
  {
    path: "/api/cart",
    target: process.env.COMMERCE_SERVICE_URL,
  },
  {
    path: "/api/checkout",
    target: process.env.COMMERCE_SERVICE_URL,
  },
  {
    path: "/api/orders",
    target: process.env.ORDER_SERVICE_URL,
  },
  {
    path: "/api/warehouse",
    target: process.env.WAREHOUSE_SERVICE_URL,
  },
  {
    path: "/api/packaging",
    target: process.env.PACKAGING_SERVICE_URL,
  },
  {
    path: "/api/logistics",
    target: process.env.LOGISTICS_SERVICE_URL,
  },
  {
    path: "/api/marketing",
    target: process.env.MARKETING_SERVICE_URL,
  },
  {
    path: "/api/affiliate",
    target: process.env.AFFILIATE_SERVICE_URL,
  },
  {
    path: "/api/inspection",
    target: process.env.INSPECTION_SERVICE_URL,
  },
  {
    path: "/api/compliance",
    target: process.env.COMPLIANCE_SERVICE_URL,
  },
  {
    path: "/api/installation",
    target: process.env.INSTALLATION_SERVICE_URL,
  },
  {
    path: "/api/repair",
    target: process.env.REPAIR_SERVICE_URL,
  },
  {
    path: "/api/support",
    target: process.env.SUPPORT_SERVICE_URL,
  },
];

serviceRoutes.forEach(({ path, target }) => {
  app.use(
    path,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      xfwd: true,

      /*
       * Express removes the mounted path before
       * handing the request to the middleware.
       * Restore the original API path.
       */
      pathRewrite: (path, req) => {
        return req.originalUrl;
      },

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
              error: error.message,
            });
          }
        },
      },
    })
  );
});

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