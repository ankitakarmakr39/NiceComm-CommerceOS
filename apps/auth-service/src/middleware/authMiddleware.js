const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    // 1. Authorization header নেওয়া
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authorization token is required",
      });
    }

    // 2. Bearer token check
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        message: "Invalid authorization format",
      });
    }

    const token = parts[1];

    // 3. Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // 4. User information request-এর মধ্যে রাখা
    req.user = decoded;

    // 5. Next middleware/controller
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = verifyToken;