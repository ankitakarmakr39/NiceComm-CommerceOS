const pool = require("../db");

const getMyRepairProfile = async (req, res) => {
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
          rp.service_areas,
          rp.services
      FROM participant_users pu
      JOIN participants p
          ON p.id = pu.participant_id
      JOIN participant_types pt
          ON pt.id = p.participant_type_id
      LEFT JOIN repair_profiles rp
          ON rp.participant_id = p.id
      WHERE pu.user_id = $1
        AND pu.is_primary = TRUE
        AND p.status = 'Active'
        AND pt.name = 'Repair Partner'
      LIMIT 1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Repair Partner profile not found",
      });
    }

    return res.status(200).json({
      message: "Repair Partner profile fetched successfully",
      profile: result.rows[0],
    });
  } catch (error) {
    console.error("Get Repair Profile Error:", error);

    return res.status(500).json({
      message: "Failed to fetch Repair Partner profile",
    });
  }
};


const getMyAssignedRepairs = async (req, res) => {
  try {
    const userId = req.user.sub;

    const result = await pool.query(
      `
      SELECT
          ra.id AS assignment_id,
          ra.order_id,
          ra.participant_id,
          ra.status,
          ra.repair_notes,
          ra.assigned_at,
          ra.completed_at,

          o.order_number,
          o.total_amount,
          o.status AS order_status,

          p.company_name,
          pt.name AS participant_type

      FROM repair_assignments ra

      JOIN orders o
          ON o.id = ra.order_id

      JOIN participants p
          ON p.id = ra.participant_id

      JOIN participant_types pt
          ON pt.id = p.participant_type_id

      JOIN participant_users pu
          ON pu.participant_id = p.id

      WHERE pu.user_id = $1
        AND pu.is_primary = TRUE
        AND p.status = 'Active'
        AND pt.name = 'Repair Partner'

      ORDER BY ra.assigned_at DESC
      `,
      [userId]
    );

    return res.status(200).json({
      message: "Assigned repairs fetched successfully",
      count: result.rows.length,
      assignments: result.rows,
    });
  } catch (error) {
    console.error("Get Assigned Repairs Error:", error);

    return res.status(500).json({
      message: "Failed to fetch assigned repairs",
    });
  }
};


module.exports = {
  getMyRepairProfile,
  getMyAssignedRepairs,
};