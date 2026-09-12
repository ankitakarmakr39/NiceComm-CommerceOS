const pool = require("../db");

// ==========================================
// GET MY PACKAGING PROFILE
// ==========================================

const getMyPackagingProfile = async (req, res) => {
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
                p.status AS participant_status,

                pt.name AS participant_type,

                pp.packaging_types,
                pp.capacity_units,
                pp.created_at AS profile_created_at,
                pp.updated_at AS profile_updated_at

            FROM participant_users pu

            INNER JOIN participants p
                ON p.id = pu.participant_id

            INNER JOIN participant_types pt
                ON pt.id = p.participant_type_id

            LEFT JOIN packaging_profiles pp
                ON pp.participant_id = p.id

            WHERE pu.user_id = $1
              AND pu.is_primary = true
              AND p.status = 'Active'
              AND pt.name = 'Packaging Provider'

            LIMIT 1
            `,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Packaging participant profile not found",
            });
        }

        return res.status(200).json({
            message: "Packaging profile fetched successfully",
            profile: result.rows[0],
        });

    } catch (error) {
        console.error(
            "Get Packaging Profile Error:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch packaging profile",
        });
    }
};

// ==========================================
// UPDATE PACKAGING CAPACITY
// ==========================================

const updatePackagingCapacity = async (req, res) => {
    try {
        const userId = req.user?.sub;
        const { capacity } = req.body;

        if (!userId) {
            return res.status(401).json({
                message: "Invalid user identity",
            });
        }

        if (
            !Number.isInteger(Number(capacity)) ||
            Number(capacity) < 0
        ) {
            return res.status(400).json({
                message: "capacity must be a non-negative integer",
            });
        }

        const participantResult = await pool.query(
            `
            SELECT
                p.id
            FROM participant_users pu

            INNER JOIN participants p
                ON p.id = pu.participant_id

            INNER JOIN participant_types pt
                ON pt.id = p.participant_type_id

            WHERE pu.user_id = $1
              AND pu.is_primary = true
              AND p.status = 'Active'
              AND pt.name = 'Packaging Provider'

            LIMIT 1
            `,
            [userId]
        );

        if (participantResult.rows.length === 0) {
            return res.status(404).json({
                message: "Packaging participant not found",
            });
        }

        const participantId = participantResult.rows[0].id;

        const result = await pool.query(
            `
            INSERT INTO packaging_profiles (
                participant_id,
                packaging_types,
                capacity_units,
                created_at,
                updated_at
            )
            VALUES (
                $1,
                '[]'::jsonb,
                $2,
                NOW(),
                NOW()
            )
            ON CONFLICT (participant_id)
            DO UPDATE SET
                capacity_units = EXCLUDED.capacity_units,
                updated_at = NOW()

            RETURNING
                participant_id,
                packaging_types,
                capacity_units,
                created_at,
                updated_at
            `,
            [
                participantId,
                Number(capacity),
            ]
        );

        return res.status(200).json({
            message: "Packaging capacity updated successfully",
            profile: result.rows[0],
        });

    } catch (error) {
        console.error(
            "Update Packaging Capacity Error:",
            error
        );

        return res.status(500).json({
            message: "Failed to update packaging capacity",
        });
    }
};

// ==========================================
// UPDATE PACKAGING TYPES
// ==========================================

const updatePackagingTypes = async (req, res) => {
    try {
        const userId = req.user?.sub;
        const { packaging_types } = req.body;

        if (!userId) {
            return res.status(401).json({
                message: "Invalid user identity",
            });
        }

        if (!Array.isArray(packaging_types)) {
            return res.status(400).json({
                message: "packaging_types must be an array",
            });
        }

        const participantResult = await pool.query(
            `
            SELECT
                p.id
            FROM participant_users pu

            INNER JOIN participants p
                ON p.id = pu.participant_id

            INNER JOIN participant_types pt
                ON pt.id = p.participant_type_id

            WHERE pu.user_id = $1
              AND pu.is_primary = true
              AND p.status = 'Active'
              AND pt.name = 'Packaging Provider'

            LIMIT 1
            `,
            [userId]
        );

        if (participantResult.rows.length === 0) {
            return res.status(404).json({
                message: "Packaging participant not found",
            });
        }

        const participantId = participantResult.rows[0].id;

        const result = await pool.query(
            `
            INSERT INTO packaging_profiles (
                participant_id,
                packaging_types,
                capacity_units,
                created_at,
                updated_at
            )
            VALUES (
                $1,
                $2::jsonb,
                0,
                NOW(),
                NOW()
            )
            ON CONFLICT (participant_id)
            DO UPDATE SET
                packaging_types = EXCLUDED.packaging_types,
                updated_at = NOW()

            RETURNING
                participant_id,
                packaging_types,
                capacity_units,
                created_at,
                updated_at
            `,
            [
                participantId,
                JSON.stringify(packaging_types),
            ]
        );

        return res.status(200).json({
            message: "Packaging types updated successfully",
            profile: result.rows[0],
        });

    } catch (error) {
        console.error(
            "Update Packaging Types Error:",
            error
        );

        return res.status(500).json({
            message: "Failed to update packaging types",
        });
    }
};

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
              AND pt.name = 'Packaging Provider'
              AND oa.participant_role = 'Packaging'

            ORDER BY oa.assigned_at DESC
            `,
            [userId]
        );

        return res.status(200).json({
            message: "Packaging assigned orders fetched successfully",
            count: result.rows.length,
            assignments: result.rows,
        });

    } catch (error) {
        console.error(
            "Get Packaging Assigned Orders Error:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch packaging assigned orders",
        });
    }
};

module.exports = {
    getMyPackagingProfile,
    updatePackagingCapacity,
    updatePackagingTypes,
    getMyAssignedOrders,
};