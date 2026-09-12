const pool = require("../db");


// =====================================================
// GET MY INSPECTION PROFILE
// =====================================================

const getMyInspectionProfile = async (req, res) => {
  try {
    const userId = req.user?.sub;

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
        ip.service_areas,
        ip.created_at AS profile_created_at,
        ip.updated_at AS profile_updated_at
      FROM participant_users pu
      JOIN participants p
        ON p.id = pu.participant_id
      JOIN participant_types pt
        ON pt.id = p.participant_type_id
      LEFT JOIN inspection_profiles ip
        ON ip.participant_id = p.id
      WHERE pu.user_id = $1
        AND pu.is_primary = true
        AND p.status = 'Active'
        AND pt.name = 'Inspection Partner'
      LIMIT 1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Inspection Partner profile not found",
      });
    }

    return res.status(200).json({
      message: "Inspection profile fetched successfully",
      profile: result.rows[0],
    });
  } catch (error) {
    console.error("Get Inspection Profile Error:", error);

    return res.status(500).json({
      message: "Failed to fetch inspection profile",
    });
  }
};


// =====================================================
// UPDATE MY INSPECTION PROFILE
// =====================================================

const updateMyInspectionProfile = async (req, res) => {
  try {
    const userId = req.user?.sub;

    const { service_areas } = req.body;

    // Validate service areas
    if (!Array.isArray(service_areas)) {
      return res.status(400).json({
        message: "service_areas must be an array",
      });
    }

    // Remove empty values and trim strings
    const cleanedServiceAreas = service_areas
      .map((area) => String(area).trim())
      .filter((area) => area.length > 0);

    // Find authenticated user's primary Inspection Partner
    const participantResult = await pool.query(
      `
      SELECT
        p.id AS participant_id
      FROM participant_users pu
      JOIN participants p
        ON p.id = pu.participant_id
      JOIN participant_types pt
        ON pt.id = p.participant_type_id
      WHERE pu.user_id = $1
        AND pu.is_primary = true
        AND p.status = 'Active'
        AND pt.name = 'Inspection Partner'
      LIMIT 1
      `,
      [userId]
    );

    if (participantResult.rows.length === 0) {
      return res.status(404).json({
        message: "Inspection Partner profile not found",
      });
    }

    const participantId =
      participantResult.rows[0].participant_id;

    // Upsert inspection profile
    const result = await pool.query(
      `
      INSERT INTO inspection_profiles (
        participant_id,
        service_areas
      )
      VALUES ($1, $2::jsonb)
      ON CONFLICT (participant_id)
      DO UPDATE SET
        service_areas = EXCLUDED.service_areas,
        updated_at = NOW()
      RETURNING
        participant_id,
        service_areas,
        created_at,
        updated_at
      `,
      [
        participantId,
        JSON.stringify(cleanedServiceAreas),
      ]
    );

    return res.status(200).json({
      message: "Inspection profile updated successfully",
      profile: result.rows[0],
    });
  } catch (error) {
    console.error("Update Inspection Profile Error:", error);

    return res.status(500).json({
      message: "Failed to update inspection profile",
    });
  }
};


// =====================================================
// GET MY ASSIGNED INSPECTIONS
// =====================================================

const getMyAssignedInspections = async (req, res) => {
  try {
    const userId = req.user?.sub;

    const result = await pool.query(
      `
      SELECT
        ia.id AS assignment_id,
        ia.order_id,
        ia.participant_id,
        ia.status AS inspection_status,
        ia.inspection_notes,
        ia.assigned_at,
        ia.completed_at,

        o.order_number,
        o.total_amount,
        o.status AS order_status,

        p.company_name,
        p.contact_person,

        pt.name AS participant_type

      FROM inspection_assignments ia

      JOIN orders o
        ON o.id = ia.order_id

      JOIN participants p
        ON p.id = ia.participant_id

      JOIN participant_types pt
        ON pt.id = p.participant_type_id

      JOIN participant_users pu
        ON pu.participant_id = p.id

      WHERE pu.user_id = $1
        AND pu.is_primary = true
        AND p.status = 'Active'
        AND pt.name = 'Inspection Partner'

      ORDER BY ia.assigned_at DESC
      `,
      [userId]
    );

    return res.status(200).json({
      message: "Assigned inspections fetched successfully",
      count: result.rows.length,
      inspections: result.rows,
    });
  } catch (error) {
    console.error("Get Assigned Inspections Error:", error);

    return res.status(500).json({
      message: "Failed to fetch assigned inspections",
    });
  }
};


module.exports = {
  getMyInspectionProfile,
  updateMyInspectionProfile,
  getMyAssignedInspections,
};