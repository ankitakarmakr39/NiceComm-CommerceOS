const pool = require("../db");

// ==========================================
// GET MY WAREHOUSE PROFILE
// ==========================================
const getMyWarehouseProfile = async (req, res) => {
    try {
        const userId = req.user.sub;

        const result = await pool.query(
            `
            SELECT
                p.id AS participant_id,
                p.company_name,
                p.contact_person,
                p.email,
                p.phone,
                p.address_line1,
                p.address_line2,
                p.city,
                p.state,
                p.postal_code,
                p.country,
                p.status,

                pt.name AS participant_type,

                wp.capacity_units,
                wp.available_units,
                wp.inventory_notes,
                wp.created_at AS profile_created_at,
                wp.updated_at AS profile_updated_at

            FROM participant_users pu

            INNER JOIN participants p
                ON p.id = pu.participant_id

            INNER JOIN participant_types pt
                ON pt.id = p.participant_type_id

            LEFT JOIN warehouse_profiles wp
                ON wp.participant_id = p.id

            WHERE pu.user_id = $1
              AND pu.is_primary = true
              AND pt.name = 'Warehouse Provider'

            LIMIT 1
            `,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Warehouse profile not found",
            });
        }

        return res.status(200).json({
            message: "Warehouse profile fetched successfully",
            profile: result.rows[0],
        });

    } catch (error) {
        console.error(
            "Get Warehouse Profile Error:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch warehouse profile",
        });
    }
};


// ==========================================
// GET MY ASSIGNED ORDERS
// ==========================================

const getMyAssignedOrders = async (req, res) => {
    try {
        const userId = req.user?.sub;

        if (!userId) {
            return res.status(401).json({
                message: "Invalid user identity",
            });
        }

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
                oa.updated_at,

                o.order_number,
                o.status AS order_status,
                o.total_amount,
                o.created_at AS order_created_at,

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
                ON pu.participant_id = p.id

            WHERE pu.user_id = $1
              AND pu.is_primary = true
              AND p.status = 'Active'
              AND pt.name = 'Warehouse Provider'
              AND oa.participant_role = 'Warehouse'

            ORDER BY oa.assigned_at DESC
            `,
            [userId]
        );

        return res.status(200).json({
            message: "Warehouse assigned orders fetched successfully",
            count: result.rows.length,
            assignments: result.rows,
        });

    } catch (error) {
        console.error(
            "Get Warehouse Assigned Orders Error:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch warehouse assigned orders",
        });
    }
};

// ==========================================
// UPDATE MY WAREHOUSE CAPACITY
// ==========================================
// ==========================================
// UPDATE MY WAREHOUSE CAPACITY
// ==========================================
const updateWarehouseCapacity = async (req, res) => {
    try {
        const userId = req.user.sub;

        const {
            capacity,
            available_units,
        } = req.body;

        const capacityNumber = Number(capacity);
        const availableUnitsNumber = Number(available_units);

        // Validate capacity
        if (
            !Number.isInteger(capacityNumber) ||
            capacityNumber < 0
        ) {
            return res.status(400).json({
                message:
                    "Capacity must be a non-negative integer",
            });
        }

        // Validate available units
        if (
            !Number.isInteger(availableUnitsNumber) ||
            availableUnitsNumber < 0
        ) {
            return res.status(400).json({
                message:
                    "Available units must be a non-negative integer",
            });
        }

        // Available units cannot exceed total capacity
        if (availableUnitsNumber > capacityNumber) {
            return res.status(400).json({
                message:
                    "Available units cannot exceed capacity units",
            });
        }

        // Find primary active warehouse participant
        const participantResult = await pool.query(
            `
            SELECT
                p.id AS participant_id

            FROM participant_users pu

            INNER JOIN participants p
                ON p.id = pu.participant_id

            INNER JOIN participant_types pt
                ON pt.id = p.participant_type_id

            WHERE pu.user_id = $1
              AND pu.is_primary = true
              AND pt.name = 'Warehouse Provider'
              AND p.status = 'Active'

            LIMIT 1
            `,
            [userId]
        );

        if (participantResult.rows.length === 0) {
            return res.status(404).json({
                message:
                    "Active warehouse participant not found",
            });
        }

        const participantId =
            participantResult.rows[0].participant_id;

        // Update both capacity and available units
        const result = await pool.query(
            `
            UPDATE warehouse_profiles
            SET
                capacity_units = $1,
                available_units = $2,
                updated_at = NOW()
            WHERE participant_id = $3

            RETURNING
                participant_id,
                capacity_units,
                available_units,
                inventory_notes,
                created_at,
                updated_at
            `,
            [
                capacityNumber,
                availableUnitsNumber,
                participantId,
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message:
                    "Warehouse profile not found",
            });
        }

        return res.status(200).json({
            message:
                "Warehouse capacity updated successfully",
            profile: result.rows[0],
        });

    } catch (error) {
        console.error(
            "Update Warehouse Capacity Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to update warehouse capacity",
        });
    }
};


module.exports = {
    getMyWarehouseProfile,
    updateWarehouseCapacity,
    getMyAssignedOrders,
};