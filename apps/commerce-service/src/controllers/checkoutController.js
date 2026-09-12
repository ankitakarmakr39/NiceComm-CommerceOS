const pool = require("../db");

// ==========================================
// CHECKOUT
// ==========================================
const checkout = async (req, res) => {
  const client = await pool.connect();

  try {
    const customerUserId = req.user.sub;

    const {
      shipping_address_line1,
      shipping_address_line2,
      shipping_city,
      shipping_state,
      shipping_postal_code,
      shipping_country,
    } = req.body;

    // ------------------------------------------
    // Validate shipping address
    // ------------------------------------------
    if (
      !shipping_address_line1 ||
      !shipping_city ||
      !shipping_state ||
      !shipping_postal_code ||
      !shipping_country
    ) {
      return res.status(400).json({
        message:
          "Shipping address line1, city, state, postal code and country are required",
      });
    }

    await client.query("BEGIN");

    // ------------------------------------------
    // Get customer's active cart
    // ------------------------------------------
    const cartResult = await client.query(
      `
      SELECT
        id,
        customer_user_id,
        status
      FROM carts
      WHERE customer_user_id = $1
        AND status = 'Active'
      FOR UPDATE
      `,
      [customerUserId]
    );

    if (cartResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Active cart not found",
      });
    }

    const cart = cartResult.rows[0];

    // ------------------------------------------
    // Get cart items + lock products
    // ------------------------------------------
    const cartItemsResult = await client.query(
      `
      SELECT
        ci.id AS cart_item_id,
        ci.product_id,
        ci.quantity,

        p.name,
        p.sku,
        p.retail_price,
        p.stock_quantity,
        p.status,

        p.seller_participant_id,

        s.company_name AS seller_company_name

      FROM cart_items ci

      INNER JOIN products p
        ON p.id = ci.product_id

      INNER JOIN participants s
        ON s.id = p.seller_participant_id

      INNER JOIN participant_types pt
        ON pt.id = s.participant_type_id

      WHERE ci.cart_id = $1
        AND p.status = 'Active'
        AND s.status = 'Active'
        AND pt.name = 'Seller'

      FOR UPDATE OF p
      `,
      [cart.id]
    );

    if (cartItemsResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Cart is empty or contains no active products",
      });
    }

    // ------------------------------------------
    // Validate stock + calculate total
    // ------------------------------------------
    let totalAmount = 0;

    for (const item of cartItemsResult.rows) {
      if (item.quantity <= 0) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: `Invalid quantity for product ${item.product_id}`,
        });
      }

      if (item.quantity > item.stock_quantity) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: `Insufficient stock for product ${item.name}`,
          available_stock: item.stock_quantity,
          requested_quantity: item.quantity,
        });
      }

      const lineTotal =
        Number(item.retail_price) * Number(item.quantity);

      totalAmount += lineTotal;
    }

    totalAmount = Number(totalAmount.toFixed(2));

    // ------------------------------------------
    // Generate order number
    // ------------------------------------------
    const orderNumber =
      `NC-${Date.now()}-${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`;

    // ------------------------------------------
    // Create order
    // ------------------------------------------
    const orderResult = await client.query(
      `
      INSERT INTO orders (
        order_number,
        customer_user_id,
        total_amount,
        status,
        shipping_address_line1,
        shipping_address_line2,
        shipping_city,
        shipping_state,
        shipping_postal_code,
        shipping_country
      )
      VALUES (
        $1,
        $2,
        $3,
        'Pending',
        $4,
        $5,
        $6,
        $7,
        $8,
        $9
      )
      RETURNING
        id,
        order_number,
        customer_user_id,
        total_amount,
        status,
        shipping_address_line1,
        shipping_address_line2,
        shipping_city,
        shipping_state,
        shipping_postal_code,
        shipping_country,
        created_at,
        updated_at
      `,
      [
        orderNumber,
        customerUserId,
        totalAmount,
        shipping_address_line1.trim(),
        shipping_address_line2?.trim() || null,
        shipping_city.trim(),
        shipping_state.trim(),
        shipping_postal_code.trim(),
        shipping_country.trim(),
      ]
    );

    const order = orderResult.rows[0];

    const orderItems = [];
    const assignments = [];

    // ------------------------------------------
    // Create Order Items
    // ------------------------------------------
    for (const item of cartItemsResult.rows) {
      const unitPrice = Number(item.retail_price);
      const lineTotal = Number(
        (unitPrice * Number(item.quantity)).toFixed(2)
      );

      const orderItemResult = await client.query(
        `
        INSERT INTO order_items (
          order_id,
          product_id,
          seller_participant_id,
          product_name,
          sku,
          quantity,
          unit_price,
          line_total
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING
          id,
          order_id,
          product_id,
          seller_participant_id,
          product_name,
          sku,
          quantity,
          unit_price,
          line_total,
          created_at
        `,
        [
          order.id,
          item.product_id,
          item.seller_participant_id,
          item.name,
          item.sku,
          item.quantity,
          unitPrice,
          lineTotal,
        ]
      );

      orderItems.push(orderItemResult.rows[0]);

      // ------------------------------------------
      // Create Seller Assignment
      // ------------------------------------------
      const assignmentResult = await client.query(
        `
        INSERT INTO order_assignments (
          order_id,
          participant_id,
          participant_role,
          status,
          assigned_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          'Seller',
          'Assigned',
          NOW(),
          NOW()
        )
        RETURNING
          id,
          order_id,
          participant_id,
          participant_role,
          status,
          assigned_at,
          updated_at
        `,
        [
          order.id,
          item.seller_participant_id,
        ]
      );

      assignments.push(assignmentResult.rows[0]);

      // ------------------------------------------
      // Reduce stock
      // ------------------------------------------
      await client.query(
        `
        UPDATE products
        SET
          stock_quantity = stock_quantity - $1,
          updated_at = NOW()
        WHERE id = $2
        `,
        [
          item.quantity,
          item.product_id,
        ]
      );
    }

    // ------------------------------------------
    // Clear Cart
    // ------------------------------------------
    await client.query(
      `
      DELETE FROM cart_items
      WHERE cart_id = $1
      `,
      [cart.id]
    );

    // ------------------------------------------
    // Commit Transaction
    // ------------------------------------------
    await client.query("COMMIT");

    return res.status(201).json({
      message: "Checkout completed successfully",
      order,
      order_items: orderItems,
      assignments,
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Checkout Error:", error);

    return res.status(500).json({
      message: "Checkout failed",
    });
  } finally {
    client.release();
  }
};

module.exports = {
  checkout,
};