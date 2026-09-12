const pool = require("../db");

const getMyAffiliateProfile = async (req, res) => {
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
                p.status AS participant_status,

                pt.name AS participant_type,

                ap.referral_code,
                ap.commission_rate,
                ap.created_at AS profile_created_at,
                ap.updated_at AS profile_updated_at

            FROM participant_users pu

            JOIN participants p
                ON p.id = pu.participant_id

            JOIN participant_types pt
                ON pt.id = p.participant_type_id

            LEFT JOIN affiliate_profiles ap
                ON ap.participant_id = p.id

            WHERE pu.user_id = $1
              AND pu.is_primary = true
              AND p.status = 'Active'
              AND pt.name = 'Affiliate Partner'

            LIMIT 1
            `,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Affiliate profile not found",
            });
        }

        return res.status(200).json({
            message: "Affiliate profile fetched successfully",
            profile: result.rows[0],
        });

    } catch (error) {
        console.error(
            "Get Affiliate Profile Error:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch affiliate profile",
        });
    }
};


const updateMyAffiliateProfile = async (req, res) => {
    try {
        const userId = req.user.sub;

        const {
            referral_code,
            commission_rate,
        } = req.body;

        if (!referral_code) {
            return res.status(400).json({
                message: "Referral code is required",
            });
        }

        if (
            commission_rate === undefined ||
            commission_rate === null ||
            commission_rate === ""
        ) {
            return res.status(400).json({
                message: "Commission rate is required",
            });
        }

        const rate = Number(commission_rate);

        if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
            return res.status(400).json({
                message:
                    "Commission rate must be between 0 and 100",
            });
        }

        const participantResult = await pool.query(
            `
            SELECT
                p.id
            FROM participant_users pu

            JOIN participants p
                ON p.id = pu.participant_id

            JOIN participant_types pt
                ON pt.id = p.participant_type_id

            WHERE pu.user_id = $1
              AND pu.is_primary = true
              AND p.status = 'Active'
              AND pt.name = 'Affiliate Partner'

            LIMIT 1
            `,
            [userId]
        );

        if (participantResult.rows.length === 0) {
            return res.status(404).json({
                message: "Affiliate participant not found",
            });
        }

        const participantId =
            participantResult.rows[0].id;

        const existingCode = await pool.query(
            `
            SELECT participant_id
            FROM affiliate_profiles
            WHERE referral_code = $1
              AND participant_id <> $2
            LIMIT 1
            `,
            [referral_code.trim(), participantId]
        );

        if (existingCode.rows.length > 0) {
            return res.status(409).json({
                message: "Referral code already exists",
            });
        }

        const result = await pool.query(
            `
            INSERT INTO affiliate_profiles (
                participant_id,
                referral_code,
                commission_rate
            )
            VALUES ($1, $2, $3)
            ON CONFLICT (participant_id)
            DO UPDATE SET
                referral_code = EXCLUDED.referral_code,
                commission_rate = EXCLUDED.commission_rate,
                updated_at = CURRENT_TIMESTAMP

            RETURNING
                participant_id,
                referral_code,
                commission_rate,
                created_at,
                updated_at
            `,
            [
                participantId,
                referral_code.trim(),
                rate,
            ]
        );

        return res.status(200).json({
            message:
                "Affiliate profile updated successfully",
            profile: result.rows[0],
        });

    } catch (error) {
        console.error(
            "Update Affiliate Profile Error:",
            error
        );

        return res.status(500).json({
            message: "Failed to update affiliate profile",
        });
    }
};


const getMyAffiliateCommissions = async (req, res) => {
    try {
        const userId = req.user.sub;

        const result = await pool.query(
            `
            SELECT
                ac.id,
                ac.participant_id,
                ac.order_id,
                ac.amount,
                ac.status,
                ac.created_at

            FROM affiliate_commissions ac

            JOIN participant_users pu
                ON pu.participant_id = ac.participant_id

            JOIN participants p
                ON p.id = ac.participant_id

            JOIN participant_types pt
                ON pt.id = p.participant_type_id

            WHERE pu.user_id = $1
              AND pu.is_primary = true
              AND p.status = 'Active'
              AND pt.name = 'Affiliate Partner'

            ORDER BY ac.created_at DESC
            `,
            [userId]
        );

        return res.status(200).json({
            message:
                "Affiliate commissions fetched successfully",
            count: result.rows.length,
            commissions: result.rows,
        });

    } catch (error) {
        console.error(
            "Get Affiliate Commissions Error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch affiliate commissions",
        });
    }
};


module.exports = {
    getMyAffiliateProfile,
    updateMyAffiliateProfile,
    getMyAffiliateCommissions,
};