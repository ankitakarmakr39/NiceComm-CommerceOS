const pool = require("../db");

const getMyComplianceStatus = async (req, res) => {
  try {
    const userId = Number(req.user.sub);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Invalid user identity",
      });
    }

    const result = await pool.query(
      `
      SELECT
        cp.participant_id,
        cp.verification_status,
        cp.verification_notes,
        cp.verified_at,
        p.company_name,
        pt.name AS participant_type
      FROM participant_users pu
      INNER JOIN participants p
        ON p.id = pu.participant_id
      INNER JOIN participant_types pt
        ON pt.id = p.participant_type_id
      LEFT JOIN compliance_profiles cp
        ON cp.participant_id = p.id
      WHERE pu.user_id = $1::bigint
        AND pu.is_primary = TRUE
        AND p.status = 'Active'
      LIMIT 1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Active participant profile not found",
      });
    }

    const row = result.rows[0];

    return res.status(200).json({
      message: "Compliance status fetched successfully",
      compliance: {
        participant_id: row.participant_id,
        company_name: row.company_name,
        participant_type: row.participant_type,
        verification_status:
          row.verification_status || "Pending",
        verification_notes:
          row.verification_notes || null,
        verified_at:
          row.verified_at || null,
      },
    });
  } catch (error) {
    console.error(
      "Get Compliance Status Error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch compliance status",
    });
  }
};

module.exports = {
  getMyComplianceStatus,
};