const pool = require("../db");

// ==========================================
// GET MY CART
// ==========================================
const getCart = async (req, res) => {
  try {
    const customerUserId = req.user.sub;

    const cartResult = await pool.query(
      `
      SELECT
        c.id,
        c.customer_user_id,
        c.status,
        c.created_at,
        c.updated_at
      FROM carts c
      WHERE c.customer_user_id = $1
        AND c.status = 'Active'
      LIMIT 1
      `,
      [customerUserId]
    );

    if (cartResult.rows.length === 0) {
      return res.status(200).json({
        message: "Cart fetched successfully",
        cart: null,
        items: [],
      });
    }

    const cart = cartResult.rows[0];

    const itemsResult = await pool.query(
      `
      SELECT
        ci.id,
        ci.cart_id,
        ci.product_id,
        ci.quantity,
        p.name,
        p.sku,
        p.description,
        p.category,
        p.retail_price,
        p.wholesale_price,
        p.stock_quantity,
        p.status,
        s.company_name AS seller_company_name
      FROM cart_items ci
      INNER JOIN products p
        ON p.id = ci.product_id
      INNER JOIN participants s
        ON s.id = p.seller_participant_id
      WHERE ci.cart_id = $1
      ORDER BY ci.id ASC
      `,
      [cart.id]
    );

    return res.status(200).json({
      message: "Cart fetched successfully",
      cart,
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error("Get Cart Error:", error);

    return res.status(500).json({
      message: "Failed to fetch cart",
    });
  }
};

// ==========================================
// ADD PRODUCT TO CART
// ==========================================
const addToCart = async (req, res) => {
  try {
    const customerUserId = req.user.sub;
    const { product_id, quantity } = req.body;

    if (!product_id || quantity === undefined) {
      return res.status(400).json({
        message: "Product ID and quantity are required",
      });
    }

    const requestedQuantity = Number(quantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be a positive integer",
      });
    }

    // ------------------------------------------
    // Check product
    // ------------------------------------------
    const productResult = await pool.query(
      `
      SELECT
        id,
        name,
        sku,
        retail_price,
        stock_quantity,
        status
      FROM products
      WHERE id = $1
        AND status = 'Active'
      `,
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        message: "Active product not found",
      });
    }

    const product = productResult.rows[0];

    if (requestedQuantity > product.stock_quantity) {
      return res.status(400).json({
        message: "Requested quantity exceeds available stock",
      });
    }

    // ------------------------------------------
    // Find or create active cart
    // ------------------------------------------
    let cartResult = await pool.query(
      `
      SELECT
        id,
        customer_user_id,
        status
      FROM carts
      WHERE customer_user_id = $1
        AND status = 'Active'
      LIMIT 1
      `,
      [customerUserId]
    );

    let cart;

    if (cartResult.rows.length === 0) {
      const newCartResult = await pool.query(
        `
        INSERT INTO carts (
          customer_user_id,
          status
        )
        VALUES ($1, 'Active')
        RETURNING
          id,
          customer_user_id,
          status,
          created_at,
          updated_at
        `,
        [customerUserId]
      );

      cart = newCartResult.rows[0];
    } else {
      cart = cartResult.rows[0];
    }

    // ------------------------------------------
    // Check existing cart item
    // ------------------------------------------
    const existingItemResult = await pool.query(
      `
      SELECT
        id,
        quantity
      FROM cart_items
      WHERE cart_id = $1
        AND product_id = $2
      LIMIT 1
      `,
      [cart.id, product_id]
    );

    if (existingItemResult.rows.length > 0) {
      const existingItem = existingItemResult.rows[0];

      const newQuantity =
        Number(existingItem.quantity) + requestedQuantity;

      if (newQuantity > product.stock_quantity) {
        return res.status(400).json({
          message: "Total cart quantity exceeds available stock",
        });
      }

      const updatedItemResult = await pool.query(
        `
        UPDATE cart_items
        SET
          quantity = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING
          id,
          cart_id,
          product_id,
          quantity,
          created_at,
          updated_at
        `,
        [newQuantity, existingItem.id]
      );

      return res.status(200).json({
        message: "Product quantity updated in cart",
        cart,
        item: updatedItemResult.rows[0],
        product,
      });
    }

    // ------------------------------------------
    // Add new item
    // ------------------------------------------
    const newItemResult = await pool.query(
      `
      INSERT INTO cart_items (
        cart_id,
        product_id,
        quantity
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        cart_id,
        product_id,
        quantity,
        created_at,
        updated_at
      `,
      [
        cart.id,
        product_id,
        requestedQuantity,
      ]
    );

    return res.status(201).json({
      message: "Product added to cart successfully",
      cart,
      item: newItemResult.rows[0],
      product,
    });
  } catch (error) {
    console.error("Add To Cart Error:", error);

    return res.status(500).json({
      message: "Failed to add product to cart",
    });
  }
};

// ==========================================
// UPDATE CART ITEM
// ==========================================
const updateCartItem = async (req, res) => {
  try {
    const customerUserId = req.user.sub;
    const cartItemId = req.params.id;
    const { quantity } = req.body;

    const requestedQuantity = Number(quantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be a positive integer",
      });
    }

    const itemResult = await pool.query(
      `
      SELECT
        ci.id,
        ci.cart_id,
        ci.product_id,
        c.customer_user_id,
        p.stock_quantity,
        p.status
      FROM cart_items ci
      INNER JOIN carts c
        ON c.id = ci.cart_id
      INNER JOIN products p
        ON p.id = ci.product_id
      WHERE ci.id = $1
        AND c.customer_user_id = $2
        AND c.status = 'Active'
      `,
      [cartItemId, customerUserId]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        message: "Cart item not found",
      });
    }

    const item = itemResult.rows[0];

    if (item.status !== "Active") {
      return res.status(400).json({
        message: "Product is no longer active",
      });
    }

    if (requestedQuantity > item.stock_quantity) {
      return res.status(400).json({
        message: "Requested quantity exceeds available stock",
      });
    }

    const updatedResult = await pool.query(
      `
      UPDATE cart_items
      SET
        quantity = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING
        id,
        cart_id,
        product_id,
        quantity,
        created_at,
        updated_at
      `,
      [requestedQuantity, cartItemId]
    );

    return res.status(200).json({
      message: "Cart item updated successfully",
      item: updatedResult.rows[0],
    });
  } catch (error) {
    console.error("Update Cart Item Error:", error);

    return res.status(500).json({
      message: "Failed to update cart item",
    });
  }
};

// ==========================================
// REMOVE CART ITEM
// ==========================================
const removeCartItem = async (req, res) => {
  try {
    const customerUserId = req.user.sub;
    const cartItemId = req.params.id;

    const itemResult = await pool.query(
      `
      SELECT
        ci.id
      FROM cart_items ci
      INNER JOIN carts c
        ON c.id = ci.cart_id
      WHERE ci.id = $1
        AND c.customer_user_id = $2
        AND c.status = 'Active'
      `,
      [cartItemId, customerUserId]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        message: "Cart item not found",
      });
    }

    await pool.query(
      `
      DELETE FROM cart_items
      WHERE id = $1
      `,
      [cartItemId]
    );

    return res.status(200).json({
      message: "Cart item removed successfully",
    });
  } catch (error) {
    console.error("Remove Cart Item Error:", error);

    return res.status(500).json({
      message: "Failed to remove cart item",
    });
  }
};

// ==========================================
// CLEAR CART
// ==========================================
const clearCart = async (req, res) => {
  try {
    const customerUserId = req.user.sub;

    const cartResult = await pool.query(
      `
      SELECT id
      FROM carts
      WHERE customer_user_id = $1
        AND status = 'Active'
      LIMIT 1
      `,
      [customerUserId]
    );

    if (cartResult.rows.length === 0) {
      return res.status(404).json({
        message: "Active cart not found",
      });
    }

    await pool.query(
      `
      DELETE FROM cart_items
      WHERE cart_id = $1
      `,
      [cartResult.rows[0].id]
    );

    return res.status(200).json({
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.error("Clear Cart Error:", error);

    return res.status(500).json({
      message: "Failed to clear cart",
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};