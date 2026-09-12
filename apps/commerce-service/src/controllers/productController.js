const pool = require("../db");

/*
  Get the primary participant linked to the logged-in user.
  Product ownership is always based on participant_id,
  never directly on users.id.
*/
const getPrimaryParticipant = async (userId) => {
  const result = await pool.query(
    `
    SELECT
      p.id AS participant_id,
      p.participant_type_id,
      pt.name AS participant_type,
      p.company_name,
      p.status
    FROM participant_users pu

    INNER JOIN participants p
      ON p.id = pu.participant_id

    INNER JOIN participant_types pt
      ON pt.id = p.participant_type_id

    WHERE pu.user_id = $1
      AND pu.is_primary = TRUE
      AND p.status = 'Active'
    LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
};


/*
  Create Product
  - Seller can create products for their own seller participant.
  - Admin can create a product only when a valid seller_participant_id
    is explicitly supplied.
*/
const createProduct = async (req, res) => {
  try {
    const {
      seller_participant_id,
      name,
      sku,
      description,
      category,
      retail_price,
      wholesale_price,
      stock_quantity,
    } = req.body;

    const userId = req.user.sub;
    const roles = req.user.roles || [];

    // Basic validation
    if (!name || !sku || retail_price === undefined) {
      return res.status(400).json({
        message: "Name, SKU and retail price are required",
      });
    }

    if (
      retail_price !== undefined &&
      Number(retail_price) < 0
    ) {
      return res.status(400).json({
        message: "Retail price cannot be negative",
      });
    }

    if (
      wholesale_price !== undefined &&
      wholesale_price !== null &&
      Number(wholesale_price) < 0
    ) {
      return res.status(400).json({
        message: "Wholesale price cannot be negative",
      });
    }

    if (
      stock_quantity !== undefined &&
      Number(stock_quantity) < 0
    ) {
      return res.status(400).json({
        message: "Stock quantity cannot be negative",
      });
    }

    let sellerParticipantId = null;

    /*
      PLATFORM ADMIN
      Admin must explicitly select the Seller Participant.
    */
    if (roles.includes("Platform Admin")) {
      if (!seller_participant_id) {
        return res.status(400).json({
          message:
            "seller_participant_id is required for Platform Admin",
        });
      }

      sellerParticipantId = seller_participant_id;
    }

    /*
      SELLER
      Seller automatically uses their own primary participant.
      We DO NOT trust a seller-provided participant ID.
    */
    else if (roles.includes("Seller")) {
      const participant = await getPrimaryParticipant(userId);

      if (!participant) {
        return res.status(404).json({
          message: "Active participant profile not found",
        });
      }

      if (participant.participant_type !== "Seller") {
        return res.status(403).json({
          message: "User is not linked to a Seller participant",
        });
      }

      sellerParticipantId = participant.participant_id;
    }

    /*
      Other users are not allowed to create products.
    */
    else {
      return res.status(403).json({
        message: "Only Seller or Platform Admin can create products",
      });
    }

    /*
      Verify that the selected participant is actually
      an active Seller participant.
    */
    const sellerResult = await pool.query(
      `
      SELECT
        p.id AS participant_id,
        p.company_name,
        p.status,
        pt.name AS participant_type
      FROM participants p

      INNER JOIN participant_types pt
        ON pt.id = p.participant_type_id

      WHERE p.id = $1
        AND p.status = 'Active'
        AND pt.name = 'Seller'
      `,
      [sellerParticipantId]
    );

    if (sellerResult.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid or inactive Seller participant",
      });
    }

    /*
      Check duplicate SKU.
    */
    const existingSku = await pool.query(
      `
      SELECT id
      FROM products
      WHERE sku = $1
      `,
      [sku.trim()]
    );

    if (existingSku.rows.length > 0) {
      return res.status(409).json({
        message: "Product with this SKU already exists",
      });
    }

    /*
      Create product.
    */
    const productResult = await pool.query(
      `
      INSERT INTO products (
        seller_participant_id,
        name,
        sku,
        description,
        category,
        retail_price,
        wholesale_price,
        stock_quantity,
        status
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        'Active'
      )
      RETURNING
        id,
        seller_participant_id,
        name,
        sku,
        description,
        category,
        retail_price,
        wholesale_price,
        stock_quantity,
        status,
        created_at,
        updated_at
      `,
      [
        sellerParticipantId,
        name.trim(),
        sku.trim(),
        description?.trim() || null,
        category?.trim() || null,
        Number(retail_price),
        wholesale_price !== undefined &&
        wholesale_price !== null &&
        wholesale_price !== ""
          ? Number(wholesale_price)
          : null,
        stock_quantity !== undefined &&
        stock_quantity !== null &&
        stock_quantity !== ""
          ? Number(stock_quantity)
          : 0,
      ]
    );

    return res.status(201).json({
      message: "Product created successfully",
      product: productResult.rows[0],
      seller: sellerResult.rows[0],
    });
  } catch (error) {
    console.error("Create Product Error:", error);

    return res.status(500).json({
      message: "Failed to create product",
    });
  }
};


/*
  Get Products

  Platform Admin:
    - Can see all products.

  Seller:
    - Can see only their own products.

  Customer / other roles:
    - Can see active products.
*/
const getProducts = async (req, res) => {
  try {
    const userId = Number(req.user.sub);
    const roles = req.user.roles || [];

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Invalid user identity",
      });
    }

    let result;

    // ==========================================
    // PLATFORM ADMIN → ALL SELLER PRODUCTS
    // ==========================================
    if (roles.includes("Platform Admin")) {
      result = await pool.query(
        `
        SELECT
          p.id,
          p.seller_participant_id,
          p.name,
          p.sku,
          p.description,
          p.category,
          p.retail_price,
          p.wholesale_price,
          p.stock_quantity,
          p.status,
          p.created_at,
          p.updated_at,
          s.company_name AS seller_company_name
        FROM products p
        INNER JOIN participants s
          ON s.id = p.seller_participant_id
        INNER JOIN participant_types pt
          ON pt.id = s.participant_type_id
        WHERE pt.name = 'Seller'
        ORDER BY p.id DESC
        `
      );
    }

    // ==========================================
    // SELLER → ONLY OWN ACTIVE PRODUCTS
    // ==========================================
    else if (roles.includes("Seller")) {
      const participant = await getPrimaryParticipant(userId);

      if (!participant) {
        return res.status(404).json({
          message: "Active participant profile not found",
        });
      }

      if (participant.participant_type !== "Seller") {
        return res.status(403).json({
          message: "User is not linked to a Seller participant",
        });
      }

      result = await pool.query(
        `
        SELECT
          p.id,
          p.seller_participant_id,
          p.name,
          p.sku,
          p.description,
          p.category,
          p.retail_price,
          p.wholesale_price,
          p.stock_quantity,
          p.status,
          p.created_at,
          p.updated_at,
          s.company_name AS seller_company_name
        FROM products p
        INNER JOIN participants s
          ON s.id = p.seller_participant_id
        WHERE p.seller_participant_id = $1
          AND p.status = 'Active'
          AND s.status = 'Active'
        ORDER BY p.id DESC
        `,
        [participant.participant_id]
      );
    }

    // ==========================================
    // CUSTOMER / OTHER USERS → ACTIVE ONLY
    // ==========================================
    else {
      result = await pool.query(
        `
        SELECT
          p.id,
          p.seller_participant_id,
          p.name,
          p.sku,
          p.description,
          p.category,
          p.retail_price,
          p.wholesale_price,
          p.stock_quantity,
          p.status,
          p.created_at,
          p.updated_at,
          s.company_name AS seller_company_name
        FROM products p
        INNER JOIN participants s
          ON s.id = p.seller_participant_id
        INNER JOIN participant_types pt
          ON pt.id = s.participant_type_id
        WHERE p.status = 'Active'
          AND s.status = 'Active'
          AND pt.name = 'Seller'
        ORDER BY p.id DESC
        `
      );
    }

    return res.status(200).json({
      message: "Products fetched successfully",
      count: result.rows.length,
      products: result.rows,
    });

  } catch (error) {
    console.error("Get Products Error:", error);

    return res.status(500).json({
      message: "Failed to fetch products",
    });
  }
};


const updateProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const userId = Number(req.user.sub);
    const roles = req.user.roles || [];

    // ==========================================
    // BASIC ID VALIDATION
    // ==========================================
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Invalid user identity",
      });
    }

    const {
      name,
      sku,
      description,
      category,
      retail_price,
      wholesale_price,
      stock_quantity,
      status,
    } = req.body;

    // ==========================================
    // GET EXISTING PRODUCT + ACCESS CHECK
    // ==========================================
    let productResult;

    // ------------------------------------------
    // PLATFORM ADMIN
    // ------------------------------------------
    if (roles.includes("Platform Admin")) {
      productResult = await pool.query(
        `
        SELECT
          id,
          seller_participant_id,
          name,
          sku,
          description,
          category,
          retail_price,
          wholesale_price,
          stock_quantity,
          status
        FROM products
        WHERE id = $1
        `,
        [productId]
      );
    }

    // ------------------------------------------
    // SELLER
    // ------------------------------------------
    else if (roles.includes("Seller")) {
      const participant = await getPrimaryParticipant(userId);

      if (!participant) {
        return res.status(404).json({
          message: "Active participant profile not found",
        });
      }

      if (participant.participant_type !== "Seller") {
        return res.status(403).json({
          message: "User is not linked to a Seller participant",
        });
      }

      productResult = await pool.query(
        `
        SELECT
          id,
          seller_participant_id,
          name,
          sku,
          description,
          category,
          retail_price,
          wholesale_price,
          stock_quantity,
          status
        FROM products
        WHERE id = $1
          AND seller_participant_id = $2
        `,
        [
          productId,
          participant.participant_id,
        ]
      );
    }

    // ------------------------------------------
    // OTHER USERS
    // ------------------------------------------
    else {
      return res.status(403).json({
        message: "You do not have permission to update products",
      });
    }

    // ==========================================
    // PRODUCT NOT FOUND
    // ==========================================
    if (productResult.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found or access denied",
      });
    }

    const existingProduct = productResult.rows[0];

    // ==========================================
    // NAME VALIDATION
    // ==========================================
    let finalName = existingProduct.name;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          message: "Product name cannot be empty",
        });
      }

      finalName = name.trim();
    }

    // ==========================================
    // SKU VALIDATION
    // ==========================================
    let finalSku = existingProduct.sku;

    if (sku !== undefined) {
      if (typeof sku !== "string" || !sku.trim()) {
        return res.status(400).json({
          message: "SKU cannot be empty",
        });
      }

      finalSku = sku.trim();
    }

    // ==========================================
    // DUPLICATE SKU CHECK
    // ==========================================
    const duplicateSku = await pool.query(
      `
      SELECT id
      FROM products
      WHERE sku = $1
        AND id <> $2
      LIMIT 1
      `,
      [
        finalSku,
        productId,
      ]
    );

    if (duplicateSku.rows.length > 0) {
      return res.status(409).json({
        message: "Product with this SKU already exists",
      });
    }

    // ==========================================
    // RETAIL PRICE VALIDATION
    // ==========================================
    let finalRetailPrice = existingProduct.retail_price;

    if (retail_price !== undefined) {
      const numericRetailPrice = Number(retail_price);

      if (
        !Number.isFinite(numericRetailPrice) ||
        numericRetailPrice < 0
      ) {
        return res.status(400).json({
          message: "Retail price must be a valid non-negative number",
        });
      }

      finalRetailPrice = numericRetailPrice;
    }

    // ==========================================
    // WHOLESALE PRICE
    // ==========================================
    let finalWholesalePrice = existingProduct.wholesale_price;

    if (wholesale_price !== undefined) {
      // Allow null to clear wholesale price
      if (
        wholesale_price === null ||
        wholesale_price === ""
      ) {
        finalWholesalePrice = null;
      } else {
        const numericWholesalePrice =
          Number(wholesale_price);

        if (
          !Number.isFinite(numericWholesalePrice) ||
          numericWholesalePrice < 0
        ) {
          return res.status(400).json({
            message:
              "Wholesale price must be a valid non-negative number or null",
          });
        }

        finalWholesalePrice = numericWholesalePrice;
      }
    }

    // ==========================================
    // STOCK VALIDATION
    // ==========================================
    let finalStockQuantity =
      existingProduct.stock_quantity;

    if (stock_quantity !== undefined) {
      const numericStockQuantity =
        Number(stock_quantity);

      if (
        !Number.isInteger(numericStockQuantity) ||
        numericStockQuantity < 0
      ) {
        return res.status(400).json({
          message:
            "Stock quantity must be a valid non-negative integer",
        });
      }

      finalStockQuantity = numericStockQuantity;
    }

    // ==========================================
    // STATUS VALIDATION
    // ==========================================
    let finalStatus = existingProduct.status;

    if (status !== undefined) {
      if (
        status !== "Active" &&
        status !== "Inactive"
      ) {
        return res.status(400).json({
          message:
            "Status must be either Active or Inactive",
        });
      }

      finalStatus = status;
    }

    // ==========================================
    // OPTIONAL TEXT FIELDS
    // ==========================================
    let finalDescription =
      existingProduct.description;

    if (description !== undefined) {
      finalDescription =
        description === null ||
        description === ""
          ? null
          : String(description).trim();
    }

    let finalCategory =
      existingProduct.category;

    if (category !== undefined) {
      finalCategory =
        category === null ||
        category === ""
          ? null
          : String(category).trim();
    }

    // ==========================================
    // UPDATE PRODUCT
    // ==========================================
    const updatedProduct = await pool.query(
      `
      UPDATE products
      SET
        name = $1,
        sku = $2,
        description = $3,
        category = $4,
        retail_price = $5,
        wholesale_price = $6,
        stock_quantity = $7,
        status = $8,
        updated_at = NOW()
      WHERE id = $9
      RETURNING
        id,
        seller_participant_id,
        name,
        sku,
        description,
        category,
        retail_price,
        wholesale_price,
        stock_quantity,
        status,
        created_at,
        updated_at
      `,
      [
        finalName,
        finalSku,
        finalDescription,
        finalCategory,
        finalRetailPrice,
        finalWholesalePrice,
        finalStockQuantity,
        finalStatus,
        productId,
      ]
    );

    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================
    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct.rows[0],
    });

  } catch (error) {
    console.error("Update Product Error:", error);

    return res.status(500).json({
      message: "Failed to update product",
    });
  }
};


const deleteProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const userId = Number(req.user.sub);
    const roles = req.user.roles || [];

    // ==========================================
    // BASIC ID VALIDATION
    // ==========================================
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Invalid user identity",
      });
    }

    let productResult;

    // ==========================================
    // PLATFORM ADMIN
    // ==========================================
    if (roles.includes("Platform Admin")) {
      productResult = await pool.query(
        `
        SELECT
          id,
          seller_participant_id,
          name,
          sku,
          status
        FROM products
        WHERE id = $1
        `,
        [productId]
      );
    }

    // ==========================================
    // SELLER
    // ==========================================
    else if (roles.includes("Seller")) {
      const participant = await getPrimaryParticipant(userId);

      if (!participant) {
        return res.status(404).json({
          message: "Active participant profile not found",
        });
      }

      if (participant.participant_type !== "Seller") {
        return res.status(403).json({
          message: "User is not linked to a Seller participant",
        });
      }

      productResult = await pool.query(
        `
        SELECT
          id,
          seller_participant_id,
          name,
          sku,
          status
        FROM products
        WHERE id = $1
          AND seller_participant_id = $2
        `,
        [
          productId,
          participant.participant_id,
        ]
      );
    }

    // ==========================================
    // OTHER USERS
    // ==========================================
    else {
      return res.status(403).json({
        message: "You do not have permission to delete products",
      });
    }

    // ==========================================
    // PRODUCT NOT FOUND / ACCESS DENIED
    // ==========================================
    if (productResult.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found or access denied",
      });
    }

    const existingProduct = productResult.rows[0];

    // ==========================================
    // ALREADY INACTIVE
    // ==========================================
    if (existingProduct.status === "Inactive") {
      return res.status(400).json({
        message: "Product is already inactive",
      });
    }

    // ==========================================
    // SOFT DELETE
    // ==========================================
    const deletedProduct = await pool.query(
      `
      UPDATE products
      SET
        status = 'Inactive',
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        seller_participant_id,
        name,
        sku,
        status,
        updated_at
      `,
      [productId]
    );

    // ==========================================
    // SUCCESS
    // ==========================================
    return res.status(200).json({
      message: "Product deleted successfully",
      product: deletedProduct.rows[0],
    });

  } catch (error) {
    console.error("Delete Product Error:", error);

    return res.status(500).json({
      message: "Failed to delete product",
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
};