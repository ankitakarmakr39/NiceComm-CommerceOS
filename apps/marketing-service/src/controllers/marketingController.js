const pool = require("../db");

const getMyMarketingProfile = async (req, res) => {
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

                mp.services,

                mp.created_at AS profile_created_at,
                mp.updated_at AS profile_updated_at

            FROM participant_users pu

            INNER JOIN participants p
                ON p.id = pu.participant_id

            INNER JOIN participant_types pt
                ON pt.id = p.participant_type_id

            LEFT JOIN marketing_profiles mp
                ON mp.participant_id = p.id

            WHERE pu.user_id = $1
              AND pu.is_primary = true
              AND p.status = 'Active'
              AND pt.name = 'Marketing Agency'

            LIMIT 1
            `,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Marketing Agency participant not found",
            });
        }

        return res.status(200).json({
            message: "Marketing profile fetched successfully",
            profile: result.rows[0],
        });

    } catch (error) {
        console.error(
            "Get Marketing Profile Error:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch marketing profile",
        });
    }
};

const updateMyMarketingProfile = async (req, res) => {
    try {
        const userId = req.user?.sub;

        if (!userId) {
            return res.status(401).json({
                message: "Invalid user identity",
            });
        }

        const { services } = req.body;

        if (!Array.isArray(services)) {
            return res.status(400).json({
                message: "services must be an array",
            });
        }

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
              AND p.status = 'Active'
              AND pt.name = 'Marketing Agency'
            LIMIT 1
            `,
            [userId]
        );

        if (participantResult.rows.length === 0) {
            return res.status(404).json({
                message: "Marketing Agency participant not found",
            });
        }

        const participantId =
            participantResult.rows[0].participant_id;

        const result = await pool.query(
            `
            INSERT INTO marketing_profiles (
                participant_id,
                services
            )
            VALUES ($1, $2::jsonb)
            ON CONFLICT (participant_id)
            DO UPDATE SET
                services = EXCLUDED.services,
                updated_at = NOW()
            RETURNING
                participant_id,
                services,
                created_at,
                updated_at
            `,
            [
                participantId,
                JSON.stringify(services),
            ]
        );

        return res.status(200).json({
            message: "Marketing profile updated successfully",
            profile: result.rows[0],
        });

    } catch (error) {
        console.error(
            "Update Marketing Profile Error:",
            error
        );

        return res.status(500).json({
            message: "Failed to update marketing profile",
        });
    }
};

const getMyMarketingClients = async (req, res) => {
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
                mc.id,
                mc.participant_id,
                mc.client_name,
                mc.client_email,
                mc.status,
                mc.created_at
            FROM marketing_clients mc
            INNER JOIN participant_users pu
                ON pu.participant_id = mc.participant_id
            INNER JOIN participants p
                ON p.id = mc.participant_id
            INNER JOIN participant_types pt
                ON pt.id = p.participant_type_id
            WHERE pu.user_id = $1
              AND pu.is_primary = true
              AND p.status = 'Active'
              AND pt.name = 'Marketing Agency'
            ORDER BY mc.created_at DESC
            `,
            [userId]
        );

        return res.status(200).json({
            message: "Marketing clients fetched successfully",
            count: result.rows.length,
            clients: result.rows,
        });

    } catch (error) {
        console.error(
            "Get Marketing Clients Error:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch marketing clients",
        });
    }
};


const createMarketingClient = async (req, res) => {
    try {
        const userId = req.user?.sub;

        if (!userId) {
            return res.status(401).json({
                message: "Invalid user identity",
            });
        }

        const { client_name, client_email } = req.body;

        if (!client_name || !client_name.trim()) {
            return res.status(400).json({
                message: "client_name is required",
            });
        }

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
              AND p.status = 'Active'
              AND pt.name = 'Marketing Agency'
            LIMIT 1
            `,
            [userId]
        );

        if (participantResult.rows.length === 0) {
            return res.status(404).json({
                message: "Marketing Agency participant not found",
            });
        }

        const participantId =
            participantResult.rows[0].participant_id;

        const result = await pool.query(
            `
            INSERT INTO marketing_clients (
                participant_id,
                client_name,
                client_email,
                status
            )
            VALUES ($1, $2, $3, 'Active')
            RETURNING
                id,
                participant_id,
                client_name,
                client_email,
                status,
                created_at
            `,
            [
                participantId,
                client_name.trim(),
                client_email || null,
            ]
        );

        return res.status(201).json({
            message: "Marketing client created successfully",
            client: result.rows[0],
        });

    } catch (error) {
        console.error(
            "Create Marketing Client Error:",
            error
        );

        return res.status(500).json({
            message: "Failed to create marketing client",
        });
    }
};

const getMyMarketingCampaigns = async (req, res) => {
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
                mc.id,
                mc.participant_id,
                mc.campaign_name,
                mc.status,
                mc.start_date,
                mc.end_date,
                mc.created_at
            FROM marketing_campaigns mc
            INNER JOIN participant_users pu
                ON pu.participant_id = mc.participant_id
            INNER JOIN participants p
                ON p.id = mc.participant_id
            INNER JOIN participant_types pt
                ON pt.id = p.participant_type_id
            WHERE pu.user_id = $1
              AND pu.is_primary = true
              AND p.status = 'Active'
              AND pt.name = 'Marketing Agency'
            ORDER BY mc.created_at DESC
            `,
            [userId]
        );

        return res.status(200).json({
            message: "Marketing campaigns fetched successfully",
            count: result.rows.length,
            campaigns: result.rows,
        });

    } catch (error) {
        console.error(
            "Get Marketing Campaigns Error:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch marketing campaigns",
        });
    }
};


const createMarketingCampaign = async (req, res) => {
    try {
        const userId = req.user?.sub;

        if (!userId) {
            return res.status(401).json({
                message: "Invalid user identity",
            });
        }

        const {
            campaign_name,
            status,
            start_date,
            end_date,
        } = req.body;

        if (!campaign_name || !campaign_name.trim()) {
            return res.status(400).json({
                message: "campaign_name is required",
            });
        }

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
              AND p.status = 'Active'
              AND pt.name = 'Marketing Agency'
            LIMIT 1
            `,
            [userId]
        );

        if (participantResult.rows.length === 0) {
            return res.status(404).json({
                message: "Marketing Agency participant not found",
            });
        }

        const participantId =
            participantResult.rows[0].participant_id;

        const result = await pool.query(
            `
            INSERT INTO marketing_campaigns (
                participant_id,
                campaign_name,
                status,
                start_date,
                end_date
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5
            )
            RETURNING
                id,
                participant_id,
                campaign_name,
                status,
                start_date,
                end_date,
                created_at
            `,
            [
                participantId,
                campaign_name.trim(),
                status || "Planned",
                start_date || null,
                end_date || null,
            ]
        );

        return res.status(201).json({
            message: "Marketing campaign created successfully",
            campaign: result.rows[0],
        });

    } catch (error) {
        console.error(
            "Create Marketing Campaign Error:",
            error
        );

        return res.status(500).json({
            message: "Failed to create marketing campaign",
        });
    }
};

module.exports = {
    getMyMarketingProfile,
    updateMyMarketingProfile,
    getMyMarketingClients,
    createMarketingClient,
    getMyMarketingCampaigns,
    createMarketingCampaign,
};