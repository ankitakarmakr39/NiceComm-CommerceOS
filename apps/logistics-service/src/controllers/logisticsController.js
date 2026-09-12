const pool = require("../db");

const getMyLogisticsProfile = async (req, res) => {
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

                lp.service_areas,
                lp.vehicle_types,
                lp.created_at AS profile_created_at,
                lp.updated_at AS profile_updated_at

            FROM participant_users pu

            INNER JOIN participants p
                ON p.id = pu.participant_id

            INNER JOIN participant_types pt
                ON pt.id = p.participant_type_id

            LEFT JOIN logistics_profiles lp
                ON lp.participant_id = p.id

            WHERE pu.user_id = $1
              AND pu.is_primary = true
              AND p.status = 'Active'
              AND pt.name = 'Logistics Provider'

            LIMIT 1
            `,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Logistics participant not found",
            });
        }

        return res.status(200).json({
            message: "Logistics profile fetched successfully",
            profile: result.rows[0],
        });

    } catch (error) {
        console.error(
            "Get Logistics Profile Error:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch logistics profile",
        });
    }
};

const updateLogisticsProfile = async (req, res) => {
    try {
        const userId = req.user?.sub;
        const { service_areas, vehicle_types } = req.body;

        if (!userId) {
            return res.status(401).json({
                message: "Invalid user identity",
            });
        }

        if (!Array.isArray(service_areas)) {
            return res.status(400).json({
                message: "service_areas must be an array",
            });
        }

        if (!Array.isArray(vehicle_types)) {
            return res.status(400).json({
                message: "vehicle_types must be an array",
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
              AND pt.name = 'Logistics Provider'

            LIMIT 1
            `,
            [userId]
        );

        if (participantResult.rows.length === 0) {
            return res.status(404).json({
                message: "Logistics participant not found",
            });
        }

        const participantId = participantResult.rows[0].id;

        const result = await pool.query(
            `
            INSERT INTO logistics_profiles (
                participant_id,
                service_areas,
                vehicle_types,
                created_at,
                updated_at
            )
            VALUES (
                $1,
                $2::jsonb,
                $3::jsonb,
                NOW(),
                NOW()
            )
            ON CONFLICT (participant_id)
            DO UPDATE SET
                service_areas = EXCLUDED.service_areas,
                vehicle_types = EXCLUDED.vehicle_types,
                updated_at = NOW()

            RETURNING
                participant_id,
                service_areas,
                vehicle_types,
                created_at,
                updated_at
            `,
            [
                participantId,
                JSON.stringify(service_areas),
                JSON.stringify(vehicle_types),
            ]
        );

        return res.status(200).json({
            message: "Logistics profile updated successfully",
            profile: result.rows[0],
        });

    } catch (error) {
        console.error(
            "Update Logistics Profile Error:",
            error
        );

        return res.status(500).json({
            message: "Failed to update logistics profile",
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
              AND pt.name = 'Logistics Provider'
              AND oa.participant_role = 'Logistics'

            ORDER BY oa.assigned_at DESC
            `,
            [userId]
        );

        return res.status(200).json({
            message: "Logistics assigned orders fetched successfully",
            count: result.rows.length,
            assignments: result.rows,
        });

    } catch (error) {
        console.error(
            "Get Logistics Assigned Orders Error:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch logistics assigned orders",
        });
    }
};

module.exports = {
    getMyLogisticsProfile,
    updateLogisticsProfile,
    getMyAssignedOrders,
};