const pool = require("../db");

const getMyInstallationProfile = async (req, res) => {
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
        ip.service_areas,
        ip.services
      FROM participant_users pu
      JOIN participants p
        ON p.id = pu.participant_id
      JOIN participant_types pt
        ON pt.id = p.participant_type_id
      LEFT JOIN installation_profiles ip
        ON ip.participant_id = p.id
      WHERE pu.user_id = $1
        AND pu.is_primary = TRUE
        AND p.status = 'Active'
        AND pt.name = 'Installation Partner'
      LIMIT 1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Installation Partner profile not found",
      });
    }

    return res.status(200).json({
      message: "Installation Partner profile fetched successfully",
      profile: result.rows[0],
    });
  } catch (error) {
    console.error("Get Installation Profile Error:", error);

    return res.status(500).json({
      message: "Failed to fetch Installation Partner profile",
    });
  }
};

const getMyAssignedInstallations = async (req, res) => {
  try {
    const userId = req.user.sub;

    const result = await pool.query(
      `
      SELECT
        ia.id AS assignment_id,
        ia.order_id,
        ia.participant_id,
        ia.status AS assignment_status,
        ia.installation_notes,
        ia.scheduled_at,
        ia.completed_at,

        o.order_number,
        o.total_amount,
        o.status AS order_status,

        p.company_name,
        pt.name AS participant_type

      FROM installation_assignments ia

      JOIN orders o
        ON o.id = ia.order_id

      JOIN participants p
        ON p.id = ia.participant_id

      JOIN participant_types pt
        ON pt.id = p.participant_type_id

      JOIN participant_users pu
        ON pu.participant_id = p.id

      WHERE pu.user_id = $1
        AND pu.is_primary = TRUE
        AND p.status = 'Active'
        AND pt.name = 'Installation Partner'

       ORDER BY ia.id DESC
      `,
      [userId]
    );

    return res.status(200).json({
      message: "Assigned installations fetched successfully",
      count: result.rows.length,
      assignments: result.rows,
    });
  } catch (error) {
    console.error(
      "Get Assigned Installations Error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch assigned installations",
    });
  }
};

module.exports = {
  getMyInstallationProfile,
  getMyAssignedInstallations,
};