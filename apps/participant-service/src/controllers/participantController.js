const pool = require("../db");

const createParticipant = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      participant_type_id,
      company_name,
      contact_person,
      phone,
      email,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,

      // Warehouse Profile
      capacity_units,
      available_units,
      inventory_notes,

      // Seller Profile
      business_name,
      tax_identifier,
      retail_enabled,
      wholesale_enabled,

    } = req.body;



    // 1. Validate required fields
    if (!participant_type_id || !company_name?.trim()) {
      return res.status(400).json({
        message: "Participant type and company name are required",
      });
    }

    // 2. Check participant type
    const typeResult = await client.query(
      `
      SELECT
        id,
        name,
        capability_level
      FROM participant_types
      WHERE id = $1
      `,
      [Number(participant_type_id)]
    );

    if (typeResult.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid participant type",
      });
    }

    const participantType = typeResult.rows[0];

    // 3. Validate Warehouse Profile
    if (Number(participant_type_id) === 2) {
      const capacity = Number(capacity_units);
      const available = Number(available_units);

      if (!Number.isInteger(capacity) || capacity < 0) {
        return res.status(400).json({
          message: "Capacity units must be a valid non-negative number",
        });
      }

      if (!Number.isInteger(available) || available < 0) {
        return res.status(400).json({
          message: "Available units must be a valid non-negative number",
        });
      }

      if (available > capacity) {
        return res.status(400).json({
          message: "Available units cannot be greater than capacity units",
        });
      }
    }

    // 4. Start transaction
    await client.query("BEGIN");

    // 5. Create participant
    const participantResult = await client.query(
      `
      INSERT INTO participants (
        participant_type_id,
        company_name,
        contact_person,
        phone,
        email,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        status
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        'Active'
      )
      RETURNING
        id,
        participant_type_id,
        company_name,
        contact_person,
        phone,
        email,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        status,
        created_at
      `,
      [
        Number(participant_type_id),
        company_name.trim(),
        contact_person?.trim() || null,
        phone?.trim() || null,
        email?.toLowerCase().trim() || null,
        address_line1?.trim() || null,
        address_line2?.trim() || null,
        city?.trim() || null,
        state?.trim() || null,
        postal_code?.trim() || null,
        country?.trim() || "India",
      ]
    );

    const participant = participantResult.rows[0];

    // 6. Create Warehouse Profile
    if (Number(participant_type_id) === 2) {
      await client.query(
        `
        INSERT INTO warehouse_profiles (
          participant_id,
          capacity_units,
          available_units,
          inventory_notes
        )
        VALUES ($1, $2, $3, $4)
        `,
        [
          participant.id,
          Number(capacity_units),
          Number(available_units),
          inventory_notes?.trim() || null,
        ]
      );
    }



    // 7. Create Seller Profile
    if (Number(participant_type_id) === 1) {
      await client.query(
        `
        INSERT INTO seller_profiles (
            participant_id,
            business_name,
            tax_identifier,
            retail_enabled,
            wholesale_enabled
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          participant.id,
          business_name?.trim() || null,
          tax_identifier?.trim() || null,
          retail_enabled === true || retail_enabled === "true",
          wholesale_enabled === true || wholesale_enabled === "true",
        ]
      );
    }

    // 8. Commit transaction
    await client.query("COMMIT");

    return res.status(201).json({
      message: "Participant created successfully",
      participant,
      participant_type: {
        id: participantType.id,
        name: participantType.name,
        capability_level: participantType.capability_level,
      },
    });
  } catch (error) {
    // Rollback if anything failed
    await client.query("ROLLBACK");

    console.error("Create Participant Error:", error);

    return res.status(500).json({
      message: "Failed to create participant",
    });
  } finally {
    client.release();
  }
};

const getMyParticipant = async (req, res) => {
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

        pt.id AS participant_type_id,
        pt.name AS participant_type,
        pt.capability_level,

        sp.business_name,
        sp.tax_identifier,
        sp.retail_enabled,
        sp.wholesale_enabled

      FROM participant_users pu

      INNER JOIN participants p
        ON p.id = pu.participant_id

      INNER JOIN participant_types pt
        ON pt.id = p.participant_type_id

      LEFT JOIN seller_profiles sp
        ON sp.participant_id = p.id

      WHERE pu.user_id = $1
        AND pu.is_primary = TRUE
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Participant profile not found",
      });
    }

    return res.status(200).json({
      message: "Participant profile fetched successfully",
      participant: result.rows[0],
    });
  } catch (error) {
    console.error("Get Participant Error:", error);

    return res.status(500).json({
      message: "Failed to fetch participant profile",
    });
  }
};

const getAllParticipants = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        p.id,
        p.participant_type_id,
        p.company_name,
        p.contact_person,
        p.phone,
        p.email,
        p.address_line1,
        p.address_line2,
        p.city,
        p.state,
        p.postal_code,
        p.country,
        p.status,
        p.created_at,
        p.updated_at,

        pt.name AS participant_type_name,
        pt.capability_level,

        -- Warehouse Profile
        wp.capacity_units,
        wp.available_units,
        wp.inventory_notes,

        -- Seller Profile
        sp.business_name,
        sp.tax_identifier,
        sp.retail_enabled,
        sp.wholesale_enabled

      FROM participants p

      INNER JOIN participant_types pt
        ON pt.id = p.participant_type_id

      LEFT JOIN warehouse_profiles wp
        ON wp.participant_id = p.id

      LEFT JOIN seller_profiles sp
        ON sp.participant_id = p.id

      ORDER BY p.id ASC
      `
    );

    return res.status(200).json({
      message: "Participants fetched successfully",
      participants: result.rows,
    });
  } catch (error) {
    console.error(
      "Get All Participants Error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch participants",
    });
  }
};

const updateParticipant = async (req, res) => {
  const client = await pool.connect();

  try {
    const participantId = Number(req.params.id);

    if (!Number.isInteger(participantId) || participantId <= 0) {
      return res.status(400).json({
        message: "Invalid participant ID",
      });
    }

    const {
      participant_type_id,
      company_name,
      contact_person,
      phone,
      email,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      status,

      // Warehouse Profile
      capacity_units,
      available_units,
      inventory_notes,

      // Seller Profile
      business_name,
      tax_identifier,
      retail_enabled,
      wholesale_enabled,
    } = req.body;

    // 1. Required fields
    if (!participant_type_id || !company_name?.trim()) {
      return res.status(400).json({
        message: "Participant type and company name are required",
      });
    }

    // 2. Check participant type
    const typeCheck = await client.query(
      `
      SELECT
        id,
        name,
        capability_level
      FROM participant_types
      WHERE id = $1
      `,
      [Number(participant_type_id)]
    );

    if (typeCheck.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid participant type",
      });
    }

    const participantType = typeCheck.rows[0];

    // 3. Validate status
    const allowedStatuses = ["Active", "Inactive"];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid participant status",
      });
    }

    // 4. Validate Warehouse Profile
    if (Number(participant_type_id) === 2) {
      const capacity = Number(capacity_units);
      const available = Number(available_units);

      if (!Number.isInteger(capacity) || capacity < 0) {
        return res.status(400).json({
          message:
            "Capacity units must be a valid non-negative number",
        });
      }

      if (!Number.isInteger(available) || available < 0) {
        return res.status(400).json({
          message:
            "Available units must be a valid non-negative number",
        });
      }

      if (available > capacity) {
        return res.status(400).json({
          message:
            "Available units cannot be greater than capacity units",
        });
      }
    }

    // 5. Start transaction
    await client.query("BEGIN");

    // 6. Check participant exists
    const participantCheck = await client.query(
      `
      SELECT id
      FROM participants
      WHERE id = $1
      FOR UPDATE
      `,
      [participantId]
    );

    if (participantCheck.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Participant not found",
      });
    }

    // 7. Update participant
    const result = await client.query(
      `
      UPDATE participants
      SET
        participant_type_id = $1,
        company_name = $2,
        contact_person = $3,
        phone = $4,
        email = $5,
        address_line1 = $6,
        address_line2 = $7,
        city = $8,
        state = $9,
        postal_code = $10,
        country = $11,
        status = COALESCE($12, status),
        updated_at = NOW()
      WHERE id = $13
      RETURNING
        id,
        participant_type_id,
        company_name,
        contact_person,
        phone,
        email,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        status,
        created_at,
        updated_at
      `,
      [
        Number(participant_type_id),
        company_name.trim(),
        contact_person?.trim() || null,
        phone?.trim() || null,
        email?.toLowerCase().trim() || null,
        address_line1?.trim() || null,
        address_line2?.trim() || null,
        city?.trim() || null,
        state?.trim() || null,
        postal_code?.trim() || null,
        country?.trim() || "India",
        status || null,
        participantId,
      ]
    );

    // 8. Update / Create Warehouse Profile
    if (Number(participant_type_id) === 2) {
      const warehouseCheck = await client.query(
        `
        SELECT participant_id
        FROM warehouse_profiles
        WHERE participant_id = $1
        `,
        [participantId]
      );

      if (warehouseCheck.rows.length > 0) {
        await client.query(
          `
          UPDATE warehouse_profiles
          SET
            capacity_units = $1,
            available_units = $2,
            inventory_notes = $3,
            updated_at = NOW()
          WHERE participant_id = $4
          `,
          [
            Number(capacity_units),
            Number(available_units),
            inventory_notes?.trim() || null,
            participantId,
          ]
        );
      } else {
        await client.query(
          `
          INSERT INTO warehouse_profiles (
            participant_id,
            capacity_units,
            available_units,
            inventory_notes
          )
          VALUES ($1, $2, $3, $4)
          `,
          [
            participantId,
            Number(capacity_units),
            Number(available_units),
            inventory_notes?.trim() || null,
          ]
        );
      }
    }

    // 9. Update / Create Seller Profile
    if (Number(participant_type_id) === 1) {
      const sellerCheck = await client.query(
        `
        SELECT participant_id
        FROM seller_profiles
        WHERE participant_id = $1
        `,
        [participantId]
      );

      const retailEnabled =
        retail_enabled === true ||
        retail_enabled === "true";

      const wholesaleEnabled =
        wholesale_enabled === true ||
        wholesale_enabled === "true";

      if (sellerCheck.rows.length > 0) {
        await client.query(
          `
          UPDATE seller_profiles
          SET
            business_name = $1,
            tax_identifier = $2,
            retail_enabled = $3,
            wholesale_enabled = $4,
            updated_at = NOW()
          WHERE participant_id = $5
          `,
          [
            business_name?.trim() || null,
            tax_identifier?.trim() || null,
            retailEnabled,
            wholesaleEnabled,
            participantId,
          ]
        );
      } else {
        await client.query(
          `
          INSERT INTO seller_profiles (
            participant_id,
            business_name,
            tax_identifier,
            retail_enabled,
            wholesale_enabled
          )
          VALUES ($1, $2, $3, $4, $5)
          `,
          [
            participantId,
            business_name?.trim() || null,
            tax_identifier?.trim() || null,
            retailEnabled,
            wholesaleEnabled,
          ]
        );
      }
    }

    // 10. Commit transaction
    await client.query("COMMIT");

    return res.status(200).json({
      message: "Participant updated successfully",
      participant: {
        ...result.rows[0],
        participant_type_name: participantType.name,
        capability_level: participantType.capability_level,
      },
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
      "Update Participant Error:",
      error
    );

    return res.status(500).json({
      message: "Failed to update participant",
    });
  } finally {
    client.release();
  }
};

const toggleParticipantStatus = async (req, res) => {
  try {
    const participantId = Number(req.params.id);

    if (!Number.isInteger(participantId) || participantId <= 0) {
      return res.status(400).json({
        message: "Invalid participant ID",
      });
    }

    const participantCheck = await pool.query(
      `
            SELECT id, status
            FROM participants
            WHERE id = $1
            `,
      [participantId]
    );

    if (participantCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Participant not found",
      });
    }

    const currentStatus = participantCheck.rows[0].status;

    const newStatus =
      currentStatus === "Active"
        ? "Inactive"
        : "Active";

    const result = await pool.query(
      `
            UPDATE participants
            SET
                status = $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING
                id,
                company_name,
                status,
                updated_at
            `,
      [newStatus, participantId]
    );

    return res.status(200).json({
      message: `Participant ${newStatus.toLowerCase()} successfully`,
      participant: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Toggle Participant Status Error:",
      error
    );

    return res.status(500).json({
      message: "Failed to update participant status",
    });
  }
};

const linkUserToParticipant = async (req, res) => {
  try {
    const participantId = Number(req.params.id);
    const userId = Number(req.body.user_id);

    if (
      !Number.isInteger(participantId) ||
      participantId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid participant ID",
      });
    }

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      return res.status(400).json({
        message: "Valid user ID is required",
      });
    }

    // Check participant
    const participantCheck = await pool.query(
      `
            SELECT
                p.id,
                p.company_name,
                p.status,
                pt.name AS participant_type_name
            FROM participants p
            INNER JOIN participant_types pt
                ON pt.id = p.participant_type_id
            WHERE p.id = $1
            `,
      [participantId]
    );

    if (participantCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Participant not found",
      });
    }

    if (participantCheck.rows[0].status !== "Active") {
      return res.status(400).json({
        message: "Cannot link user to an inactive participant",
      });
    }

    // Check user
    const userCheck = await pool.query(
      `
            SELECT
                id,
                full_name,
                email,
                status
            FROM users
            WHERE id = $1
            `,
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (userCheck.rows[0].status !== "Active") {
      return res.status(400).json({
        message: "Cannot link an inactive user",
      });
    }

    // Check existing mapping
    const existingMapping = await pool.query(
      `
            SELECT
                participant_id,
                user_id,
                is_primary
            FROM participant_users
            WHERE participant_id = $1
              AND user_id = $2
            `,
      [participantId, userId]
    );

    if (existingMapping.rows.length > 0) {
      return res.status(409).json({
        message: "User is already linked to this participant",
      });
    }

    // Create mapping
    const result = await pool.query(
      `
            INSERT INTO participant_users (
                participant_id,
                user_id,
                is_primary
            )
            VALUES ($1, $2, true)
            RETURNING
                participant_id,
                user_id,
                is_primary,
                joined_at
            `,
      [participantId, userId]
    );

    return res.status(201).json({
      message: "User linked to participant successfully",
      participant: participantCheck.rows[0],
      user: userCheck.rows[0],
      mapping: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Link User To Participant Error:",
      error
    );

    return res.status(500).json({
      message: "Failed to link user to participant",
    });
  }
};

module.exports = {
  createParticipant,
  getMyParticipant,
  getAllParticipants,
  updateParticipant,
  toggleParticipantStatus,
  linkUserToParticipant,
};