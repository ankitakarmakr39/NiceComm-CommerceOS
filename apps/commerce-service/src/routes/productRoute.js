const express = require("express");

const {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", verifyToken, getProducts);

router.post("/", verifyToken, createProduct);

router.put("/:id", verifyToken, updateProduct);

router.delete("/:id", verifyToken, deleteProduct);

module.exports = router;