const pool = require("../db");

// ==========================================
// GET MY ORDERS
// ==========================================
const getMyOrders = async (req, res) => {
    try {
        const customerUserId = req.user.sub;

        const ordersResult = await pool.query(
            `
      SELECT
        o.id,
        o.order_number,
        o.customer_user_id,
        o.total_amount,
        o.status,
        o.shipping_address_line1,
        o.shipping_address_line2,
        o.shipping_city,
        o.shipping_state,
        o.shipping_postal_code,
        o.shipping_country,
        o.created_at,
        o.updated_at
      FROM orders o
      WHERE o.customer_user_id = $1
      ORDER BY o.created_at DESC
      `,
            [customerUserId]
        );

        return res.status(200).json({
            message: "Orders fetched successfully",
            count: ordersResult.rows.length,
            orders: ordersResult.rows,
        });
    } catch (error) {
        console.error("Get My Orders Error:", error);

        return res.status(500).json({
            message: "Failed to fetch orders",
        });
    }
};

// ==========================================
// CREATE ORDER ASSIGNMENT - ADMIN ONLY
// ==========================================
const createAssignment = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            order_id,
            participant_id,
            participant_role,
            notes,
        } = req.body;

        // ==========================================
        // VALIDATION
        // ==========================================
        if (!order_id || !participant_id || !participant_role) {
            return res.status(400).json({
                message:
                    "order_id, participant_id and participant_role are required",
            });
        }

        const allowedRoles = [
            "Seller",
            "Warehouse",
            "Packaging",
            "Logistics",
            "Marketing",
            "Affiliate",
            "Inspection",
            "Repair",
            "Installation",
        ];

        if (!allowedRoles.includes(participant_role)) {
            return res.status(400).json({
                message: "Invalid participant role",
                allowed_roles: allowedRoles,
            });
        }

        if (
            !Number.isInteger(Number(order_id)) ||
            Number(order_id) <= 0
        ) {
            return res.status(400).json({
                message: "order_id must be a positive integer",
            });
        }

        if (
            !Number.isInteger(Number(participant_id)) ||
            Number(participant_id) <= 0
        ) {
            return res.status(400).json({
                message: "participant_id must be a positive integer",
            });
        }

        await client.query("BEGIN");

        // ==========================================
        // VERIFY ORDER
        // ==========================================
        const orderResult = await client.query(
            `
            SELECT
                id,
                order_number,
                status
            FROM orders
            WHERE id = $1
            FOR UPDATE
            `,
            [Number(order_id)]
        );

        if (orderResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Order not found",
            });
        }

        const order = orderResult.rows[0];

        // ==========================================
        // PREVENT ASSIGNMENT ON CLOSED ORDERS
        // ==========================================
        if (
            ["Completed", "Cancelled"].includes(order.status)
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "Cannot create assignment for a completed or cancelled order",
                order_status: order.status,
            });
        }

        // ==========================================
        // VERIFY PARTICIPANT
        // ==========================================
        const participantResult = await client.query(
            `
            SELECT
                p.id,
                p.company_name,
                p.status,
                pt.name AS participant_type
            FROM participants p
            INNER JOIN participant_types pt
                ON pt.id = p.participant_type_id
            WHERE p.id = $1
            LIMIT 1
            `,
            [Number(participant_id)]
        );

        if (participantResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Participant not found",
            });
        }

        const participant = participantResult.rows[0];

        // ==========================================
        // VERIFY PARTICIPANT STATUS
        // ==========================================
        if (participant.status !== "Active") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Participant is not active",
            });
        }

        // ==========================================
        // VERIFY PARTICIPANT TYPE ↔ ROLE
        // ==========================================
        const expectedParticipantTypes = {
            Seller: "Seller",
            Warehouse: "Warehouse Provider",
            Packaging: "Packaging Provider",
            Logistics: "Logistics Provider",
            Marketing: "Marketing Agency",
            Affiliate: "Affiliate Partner",
            Inspection: "Inspection Partner",
            Repair: "Repair Partner",
            Installation: "Installation Partner",
        };

        if (
            expectedParticipantTypes[participant_role] !==
            participant.participant_type
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "Participant type does not match participant role",
                participant_type: participant.participant_type,
                participant_role,
            });
        }

        // ==========================================
        // PREVENT DUPLICATE ACTIVE ASSIGNMENT
        // ==========================================
        const duplicateResult = await client.query(
            `
            SELECT
                id,
                status
            FROM order_assignments
            WHERE order_id = $1
              AND participant_id = $2
              AND participant_role = $3
              AND status NOT IN (
                  'Completed',
                  'Rejected',
                  'Cancelled'
              )
            LIMIT 1
            `,
            [
                Number(order_id),
                Number(participant_id),
                participant_role,
            ]
        );

        if (duplicateResult.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message: "Active assignment already exists",
                assignment: duplicateResult.rows[0],
            });
        }

        // ==========================================
        // CREATE ASSIGNMENT
        // ==========================================
        const assignmentResult = await client.query(
            `
            INSERT INTO order_assignments (
                order_id,
                participant_id,
                participant_role,
                status,
                notes,
                assigned_at,
                updated_at
            )
            VALUES (
                $1,
                $2,
                $3,
                'Assigned',
                $4,
                NOW(),
                NOW()
            )
            RETURNING
                id,
                order_id,
                participant_id,
                participant_role,
                status,
                notes,
                assigned_at,
                accepted_at,
                completed_at,
                updated_at
            `,
            [
                Number(order_id),
                Number(participant_id),
                participant_role,
                notes || null,
            ]
        );

        await client.query("COMMIT");

        // ==========================================
        // SUCCESS RESPONSE
        // ==========================================
        return res.status(201).json({
            message: "Order assignment created successfully",

            order: {
                id: order.id,
                order_number: order.order_number,
                status: order.status,
            },

            participant: {
                id: participant.id,
                company_name: participant.company_name,
                participant_type: participant.participant_type,
            },

            assignment: assignmentResult.rows[0],
        });

    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error(
                "Rollback Error:",
                rollbackError
            );
        }

        console.error(
            "Create Order Assignment Error:",
            error
        );

        return res.status(500).json({
            message: "Failed to create order assignment",
        });

    } finally {
        client.release();
    }
};

// ==========================================
// GET MY ORDER BY ID
// =====================AVA=====================
const getMyOrderById = async (req, res) => {
    try {
        const customerUserId = req.user.sub;
        const orderId = req.params.id;

        const orderResult = await pool.query(
            `
      SELECT
        o.id,
        o.order_number,
        o.customer_user_id,
        o.total_amount,
        o.status,
        o.shipping_address_line1,
        o.shipping_address_line2,
        o.shipping_city,
        o.shipping_state,
        o.shipping_postal_code,
        o.shipping_country,
        o.created_at,
        o.updated_at
      FROM orders o
      WHERE o.id = $1
        AND o.customer_user_id = $2
      LIMIT 1
      `,
            [orderId, customerUserId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                message: "Order not found or access denied",
            });
        }

        const order = orderResult.rows[0];

        const itemsResult = await pool.query(
            `
      SELECT
        oi.id,
        oi.product_id,
        oi.seller_participant_id,
        oi.product_name,
        oi.sku,
        oi.quantity,
        oi.unit_price,
        oi.line_total
      FROM order_items oi
      WHERE oi.order_id = $1
      ORDER BY oi.id ASC
      `,
            [orderId]
        );

        const assignmentsResult = await pool.query(
            `
      SELECT
    oa.id,
    oa.participant_id,
    oa.participant_role,
    oa.status,
    oa.notes,
    oa.assigned_at,
    oa.accepted_at,
    oa.completed_at,
    oa.updated_at,
    p.company_name
FROM order_assignments oa
JOIN participants p
    ON p.id = oa.participant_id
WHERE oa.order_id = $1
ORDER BY oa.id ASC
      `,
            [orderId]
        );

        return res.status(200).json({
            message: "Order fetched successfully",
            order,
            order_items: itemsResult.rows,
            assignments: assignmentsResult.rows,
        });
    } catch (error) {
        console.error("Get Order By ID Error:", error);

        return res.status(500).json({
            message: "Failed to fetch order",
        });
    }
};

// ==========================================
// GET ORDER BY ID - ADMIN ONLY
// ==========================================
const getAdminOrderById = async (req, res) => {
    try {
        const orderId = Number(req.params.id);

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                message: "Invalid order ID",
            });
        }

        // ==========================================
        // GET ORDER
        // ==========================================
        const orderResult = await pool.query(
            `
            SELECT
                o.id,
                o.order_number,
                o.customer_user_id,
                u.full_name AS customer_name,
                u.email AS customer_email,
                o.total_amount,
                o.status,
                o.shipping_address_line1,
                o.shipping_address_line2,
                o.shipping_city,
                o.shipping_state,
                o.shipping_postal_code,
                o.shipping_country,
                o.created_at,
                o.updated_at
            FROM orders o
            INNER JOIN users u
                ON u.id = o.customer_user_id
            WHERE o.id = $1
            LIMIT 1
            `,
            [orderId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        const order = orderResult.rows[0];

        // ==========================================
        // GET ORDER ITEMS
        // ==========================================
        const itemsResult = await pool.query(
            `
            SELECT
                oi.id,
                oi.product_id,
                oi.seller_participant_id,
                oi.product_name,
                oi.sku,
                oi.quantity,
                oi.unit_price,
                oi.line_total
            FROM order_items oi
            WHERE oi.order_id = $1
            ORDER BY oi.id ASC
            `,
            [orderId]
        );

        // ==========================================
        // GET ORDER ASSIGNMENTS
        // ==========================================
        const assignmentsResult = await pool.query(
            `
            SELECT
                oa.id,
                oa.participant_id,
                oa.participant_role,
                oa.status,
                oa.notes,
                oa.assigned_at,
                oa.accepted_at,
                oa.completed_at,
                oa.updated_at,
                p.company_name,
                p.contact_person,
                pt.name AS participant_type
            FROM order_assignments oa
            INNER JOIN participants p
                ON p.id = oa.participant_id
            INNER JOIN participant_types pt
                ON pt.id = p.participant_type_id
            WHERE oa.order_id = $1
            ORDER BY oa.id ASC
            `,
            [orderId]
        );

        return res.status(200).json({
            message: "Admin order fetched successfully",
            order,
            order_items: itemsResult.rows,
            assignments: assignmentsResult.rows,
        });

    } catch (error) {
        console.error(
            "Get Admin Order By ID Error:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch order",
        });
    }
};

const getMyAssignedOrders = async (req, res) => {
    try {
        const userId = req.user.sub;

        const result = await pool.query(
            `
      SELECT
        oa.id AS assignment_id,
        oa.order_id,
        oa.participant_id,
        oa.participant_role,
        oa.status AS assignment_status,
        oa.notes,
        oa.assigned_at,
        oa.accepted_at,
        oa.completed_at,

        o.order_number,
        o.customer_user_id,
        o.total_amount,
        o.status AS order_status,
        o.shipping_address_line1,
        o.shipping_address_line2,
        o.shipping_city,
        o.shipping_state,
        o.shipping_postal_code,
        o.shipping_country,
        o.created_at,
        o.updated_at,

        p.company_name,
        pt.name AS participant_type

      FROM order_assignments oa

      INNER JOIN orders o
        ON o.id = oa.order_id

      INNER JOIN participants p
        ON p.id = oa.participant_id

      INNER JOIN participant_types pt
        ON pt.id = p.participant_type_id

      INNER JOIN participant_users pu
        ON pu.participant_id = oa.participant_id
       AND pu.user_id = $1
       AND pu.is_primary = true

      ORDER BY oa.assigned_at DESC
      `,
            [userId]
        );

        return res.status(200).json({
            message: "Assigned orders fetched successfully",
            count: result.rows.length,
            orders: result.rows,
        });
    } catch (error) {
        console.error("Get My Assigned Orders Error:", error);

        return res.status(500).json({
            message: "Failed to fetch assigned orders",
        });
    }
};

const updateMyAssignmentStatus = async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = Number(req.user.sub);
        const assignmentId = Number(req.params.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({
                message: "Invalid user identity",
            });
        }

        if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
            return res.status(400).json({
                message: "Invalid assignment ID",
            });
        }

        const { status, notes } = req.body;

        const allowedStatuses = [
            "Accepted",
            "In Progress",
            "Completed",
            "Rejected",
            "Cancelled",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid assignment status",
                allowed_statuses: allowedStatuses,
            });
        }

        await client.query("BEGIN");

        // --------------------------------------------------
        // 1. Find assignment and verify ownership
        // --------------------------------------------------
        const assignmentResult = await client.query(
            `
            SELECT
                oa.id,
                oa.order_id,
                oa.participant_id,
                oa.participant_role,
                oa.status,
                oa.notes,
                oa.assigned_at,
                oa.accepted_at,
                oa.completed_at,

                o.status AS order_status

            FROM order_assignments oa

            INNER JOIN orders o
                ON o.id = oa.order_id

            INNER JOIN participant_users pu
                ON pu.participant_id = oa.participant_id
               AND pu.user_id = $1

            WHERE oa.id = $2

            FOR UPDATE OF oa, o
            `,
            [userId, assignmentId]
        );

        if (assignmentResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message:
                    "Assignment not found or you are not authorized to update it",
            });
        }

        const assignment = assignmentResult.rows[0];

        // --------------------------------------------------
        // 2. Do not modify closed orders
        // --------------------------------------------------
        if (
            ["Completed", "Cancelled"].includes(
                assignment.order_status
            )
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "Cannot update assignment for a completed or cancelled order",
                order_status: assignment.order_status,
            });
        }

        // --------------------------------------------------
        // 3. Validate assignment status transition
        // --------------------------------------------------
        const currentStatus = assignment.status;

        const allowedTransitions = {
            Assigned: [
                "Accepted",
                "Rejected",
                "Cancelled",
            ],

            Accepted: [
                "In Progress",
                "Cancelled",
            ],

            "In Progress": [
                "Completed",
                "Cancelled",
            ],

            Completed: [],
            Rejected: [],
            Cancelled: [],
        };

        if (
            !allowedTransitions[currentStatus] ||
            !allowedTransitions[currentStatus].includes(status)
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Invalid assignment status transition",
                current_status: currentStatus,
                requested_status: status,
                allowed_next_statuses:
                    allowedTransitions[currentStatus] || [],
            });
        }

        // --------------------------------------------------
        // 4. Prepare timestamps
        // --------------------------------------------------
        let acceptedAt = null;
        let completedAt = null;

        if (status === "Accepted") {
            acceptedAt = new Date();
        }

        if (status === "Completed") {
            completedAt = new Date();
        }

        // --------------------------------------------------
        // 5. Update assignment
        // --------------------------------------------------
        const updateResult = await client.query(
            `
            UPDATE order_assignments
            SET
                status = $1,
                notes = $2,
                accepted_at =
    CASE
        WHEN $1::varchar = 'Accepted'
            THEN COALESCE(accepted_at, NOW())
        ELSE accepted_at
    END,
                completed_at =
    CASE
        WHEN $1::varchar = 'Completed'
            THEN NOW()
        ELSE completed_at
    END,
                updated_at = NOW()

            WHERE id = $3

            RETURNING
                id,
                order_id,
                participant_id,
                participant_role,
                status,
                notes,
                assigned_at,
                accepted_at,
                completed_at,
                updated_at
            `,
            [
                status,
                notes !== undefined
                    ? notes
                    : assignment.notes,
                assignmentId,
            ]
        );

        // --------------------------------------------------
        // 6. Determine order status
        // --------------------------------------------------

        let newOrderStatus = assignment.order_status;

        if (
            status === "Accepted" ||
            status === "In Progress"
        ) {
            newOrderStatus = "Processing";
        }

        /*
         * IMPORTANT:
         *
         * Completing ONE assignment does NOT automatically
         * complete the whole order.
         *
         * The order becomes Completed only when all current
         * assignments for that order are Completed.
         */

        if (status === "Completed") {
            const assignmentStatusResult =
                await client.query(
                    `
                    SELECT
                        COUNT(*) AS total_assignments,
                        COUNT(*) FILTER (
                            WHERE status = 'Completed'
                        ) AS completed_assignments,
                        COUNT(*) FILTER (
                            WHERE status NOT IN (
                                'Completed',
                                'Cancelled',
                                'Rejected'
                            )
                        ) AS pending_assignments

                    FROM order_assignments

                    WHERE order_id = $1
                    `,
                    [assignment.order_id]
                );

            const assignmentSummary =
                assignmentStatusResult.rows[0];

            const totalAssignments = Number(
                assignmentSummary.total_assignments
            );

            const completedAssignments = Number(
                assignmentSummary.completed_assignments
            );

            const pendingAssignments = Number(
                assignmentSummary.pending_assignments
            );

            if (
                totalAssignments > 0 &&
                completedAssignments === totalAssignments
            ) {
                newOrderStatus = "Completed";
            } else {
                newOrderStatus = "Processing";
            }

            /*
             * If there are still pending assignments, keep the
             * order Processing so the next participant can work.
             */
            if (pendingAssignments > 0) {
                newOrderStatus = "Processing";
            }
        }

        // --------------------------------------------------
        // 7. Rejected / Cancelled assignment
        // --------------------------------------------------
        if (
            status === "Rejected" ||
            status === "Cancelled"
        ) {
            newOrderStatus = "Processing";
        }

        // --------------------------------------------------
        // 8. Update order status
        // --------------------------------------------------
        await client.query(
            `
            UPDATE orders
            SET
                status = $1,
                updated_at = NOW()

            WHERE id = $2
            `,
            [
                newOrderStatus,
                assignment.order_id,
            ]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message:
                "Assignment status updated successfully",

            assignment: updateResult.rows[0],

            order_status: newOrderStatus,
        });

    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error(
                "Rollback Error:",
                rollbackError
            );
        }

        console.error(
            "Update Assignment Status Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to update assignment status",
        });
    } finally {
        client.release();
    }
};

const getAllOrders = async (req, res) => {
    try {
        const result = await pool.query(
            `
      SELECT
        o.id,
        o.order_number,
        o.customer_user_id,
        u.full_name AS customer_name,
        u.email AS customer_email,
        o.total_amount,
        o.status,
        o.shipping_address_line1,
        o.shipping_address_line2,
        o.shipping_city,
        o.shipping_state,
        o.shipping_postal_code,
        o.shipping_country,
        o.created_at,
        o.updated_at
      FROM orders o
      INNER JOIN users u
        ON u.id = o.customer_user_id
      ORDER BY o.created_at DESC
      `
        );

        return res.status(200).json({
            message: "All orders fetched successfully",
            count: result.rows.length,
            orders: result.rows,
        });
    } catch (error) {
        console.error("Get All Orders Error:", error);

        return res.status(500).json({
            message: "Failed to fetch orders",
        });
    }
};


const createRepairAssignment = async (req, res) => {
    try {
        const {
            order_id,
            participant_id,
            repair_notes,
        } = req.body;

        // ==========================================
        // VALIDATION
        // ==========================================
        if (!order_id || !participant_id) {
            return res.status(400).json({
                message: "order_id and participant_id are required",
            });
        }

        // ==========================================
        // VALIDATE ORDER
        // ==========================================
        const orderResult = await pool.query(
            `
            SELECT
                id,
                order_number,
                status
            FROM orders
            WHERE id = $1
            `,
            [order_id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        // ==========================================
        // VALIDATE REPAIR PARTICIPANT
        // ==========================================
        const participantResult = await pool.query(
            `
            SELECT
                p.id,
                p.company_name,
                p.contact_person,
                p.status,
                pt.id AS participant_type_id,
                pt.name AS participant_type
            FROM participants p
            INNER JOIN participant_types pt
                ON pt.id = p.participant_type_id
            WHERE p.id = $1
              AND p.status = 'Active'
              AND pt.name = 'Repair Partner'
            `,
            [participant_id]
        );

        if (participantResult.rows.length === 0) {
            return res.status(404).json({
                message: "Active Repair Partner participant not found",
            });
        }

        // ==========================================
        // PREVENT DUPLICATE ACTIVE ASSIGNMENT
        // ==========================================
        const duplicateResult = await pool.query(
            `
            SELECT
                id,
                order_id,
                participant_id,
                status
            FROM repair_assignments
            WHERE order_id = $1
              AND participant_id = $2
              AND status NOT IN ('Completed', 'Cancelled')
            LIMIT 1
            `,
            [order_id, participant_id]
        );

        if (duplicateResult.rows.length > 0) {
            return res.status(409).json({
                message: "Active repair assignment already exists",
                assignment: duplicateResult.rows[0],
            });
        }

        // ==========================================
        // CREATE REPAIR ASSIGNMENT
        // ==========================================
        const assignmentResult = await pool.query(
            `
            INSERT INTO repair_assignments (
                order_id,
                participant_id,
                status,
                repair_notes,
                assigned_at
            )
            VALUES (
                $1,
                $2,
                'Assigned',
                $3,
                NOW()
            )
            RETURNING
                id,
                order_id,
                participant_id,
                status,
                repair_notes,
                assigned_at,
                completed_at
            `,
            [
                order_id,
                participant_id,
                repair_notes || null,
            ]
        );

        return res.status(201).json({
            message: "Repair assignment created successfully",
            assignment: assignmentResult.rows[0],
            order: orderResult.rows[0],
            participant: participantResult.rows[0],
        });

    } catch (error) {
        console.error(
            "Create Repair Assignment Error:",
            error
        );

        return res.status(500).json({
            message: "Failed to create repair assignment",
        });
    }
};

// ==========================================
// CREATE INSTALLATION ASSIGNMENT - ADMIN ONLY
// ==========================================
const createInstallationAssignment = async (req, res) => {
    try {
        const {
            order_id,
            participant_id,
            installation_notes,
            scheduled_at,
        } = req.body;

        // ==========================================
        // VALIDATION
        // ==========================================
        if (!order_id || !participant_id) {
            return res.status(400).json({
                message: "order_id and participant_id are required",
            });
        }

        if (
            !Number.isInteger(Number(order_id)) ||
            Number(order_id) <= 0
        ) {
            return res.status(400).json({
                message: "order_id must be a positive integer",
            });
        }

        if (
            !Number.isInteger(Number(participant_id)) ||
            Number(participant_id) <= 0
        ) {
            return res.status(400).json({
                message: "participant_id must be a positive integer",
            });
        }

        // ==========================================
        // VALIDATE ORDER
        // ==========================================
        const orderResult = await pool.query(
            `
            SELECT
                id,
                order_number,
                status
            FROM orders
            WHERE id = $1
            `,
            [Number(order_id)]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        // ==========================================
        // VALIDATE INSTALLATION PARTICIPANT
        // ==========================================
        const participantResult = await pool.query(
            `
            SELECT
                p.id,
                p.company_name,
                p.contact_person,
                p.status,
                pt.id AS participant_type_id,
                pt.name AS participant_type
            FROM participants p
            INNER JOIN participant_types pt
                ON pt.id = p.participant_type_id
            WHERE p.id = $1
              AND p.status = 'Active'
              AND pt.name = 'Installation Partner'
            `,
            [Number(participant_id)]
        );

        if (participantResult.rows.length === 0) {
            return res.status(404).json({
                message:
                    "Active Installation Partner participant not found",
            });
        }

        // ==========================================
        // PREVENT DUPLICATE ACTIVE ASSIGNMENT
        // ==========================================
        const duplicateResult = await pool.query(
            `
            SELECT
                id,
                order_id,
                participant_id,
                status
            FROM installation_assignments
            WHERE order_id = $1
              AND participant_id = $2
              AND status NOT IN ('Completed', 'Cancelled')
            LIMIT 1
            `,
            [
                Number(order_id),
                Number(participant_id),
            ]
        );

        if (duplicateResult.rows.length > 0) {
            return res.status(409).json({
                message:
                    "Active installation assignment already exists",
                assignment: duplicateResult.rows[0],
            });
        }

        // ==========================================
        // CREATE INSTALLATION ASSIGNMENT
        // ==========================================
        const assignmentResult = await pool.query(
            `
            INSERT INTO installation_assignments (
                order_id,
                participant_id,
                status,
                installation_notes,
                scheduled_at
            )
            VALUES (
                $1,
                $2,
                'Assigned',
                $3,
                $4
            )
            RETURNING
                id,
                order_id,
                participant_id,
                status,
                installation_notes,
                scheduled_at,
                completed_at
            `,
            [
                Number(order_id),
                Number(participant_id),
                installation_notes || null,
                scheduled_at || null,
            ]
        );

        return res.status(201).json({
            message:
                "Installation assignment created successfully",
            assignment: assignmentResult.rows[0],
            order: orderResult.rows[0],
            participant: participantResult.rows[0],
        });

    } catch (error) {
        console.error(
            "Create Installation Assignment Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to create installation assignment",
        });
    }
};

module.exports = {
    getMyOrders,
    getMyOrderById,
    getAdminOrderById,
    getMyAssignedOrders,
    updateMyAssignmentStatus,
    getAllOrders,
    createAssignment,
    createRepairAssignment,
    createInstallationAssignment,
};