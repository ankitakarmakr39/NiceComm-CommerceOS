const pool = require("../db");

/*
|--------------------------------------------------------------------------
| Create Support Ticket
|--------------------------------------------------------------------------
*/
const createTicket = async (req, res) => {
  try {
    const userId = req.user.sub;

    const {
      subject,
      description,
      priority,
      related_order_id,
    } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        message: "subject and description are required",
      });
    }

    const allowedPriorities = [
      "Low",
      "Medium",
      "High",
      "Urgent",
    ];

    const ticketPriority = priority || "Medium";

    if (!allowedPriorities.includes(ticketPriority)) {
      return res.status(400).json({
        message:
          "priority must be Low, Medium, High, or Urgent",
      });
    }

    if (
      related_order_id !== undefined &&
      related_order_id !== null &&
      (
        !Number.isInteger(Number(related_order_id)) ||
        Number(related_order_id) <= 0
      )
    ) {
      return res.status(400).json({
        message:
          "related_order_id must be a positive integer",
      });
    }

    const ticketNumber =
      `NC-SUP-${Date.now()}-${Math.floor(
        100 + Math.random() * 900
      )}`;

    const result = await pool.query(
      `
      INSERT INTO support_tickets (
        ticket_number,
        created_by_user_id,
        subject,
        description,
        priority,
        status,
        related_order_id
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        'Open',
        $6
      )
      RETURNING
        id,
        ticket_number,
        created_by_user_id,
        subject,
        description,
        priority,
        status,
        related_order_id,
        created_at,
        updated_at
      `,
      [
        ticketNumber,
        userId,
        subject.trim(),
        description.trim(),
        ticketPriority,
        related_order_id
          ? Number(related_order_id)
          : null,
      ]
    );

    return res.status(201).json({
      message: "Support ticket created successfully",
      ticket: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Create Support Ticket Error:",
      error
    );

    return res.status(500).json({
      message: "Failed to create support ticket",
    });
  }
};


/*
|--------------------------------------------------------------------------
| Get My Support Tickets
|--------------------------------------------------------------------------
*/
const getMyTickets = async (req, res) => {
  try {
    const userId = req.user.sub;

    const result = await pool.query(
      `
      SELECT
        st.id,
        st.ticket_number,
        st.created_by_user_id,
        st.subject,
        st.description,
        st.priority,
        st.status,
        st.related_order_id,
        st.created_at,
        st.updated_at
      FROM support_tickets st
      WHERE st.created_by_user_id = $1
      ORDER BY st.id DESC
      `,
      [userId]
    );

    return res.status(200).json({
      message: "Support tickets fetched successfully",
      count: result.rows.length,
      tickets: result.rows,
    });
  } catch (error) {
    console.error(
      "Get My Support Tickets Error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch support tickets",
    });
  }
};


/*
|--------------------------------------------------------------------------
| Get My Ticket By ID
|--------------------------------------------------------------------------
*/
const getTicketById = async (req, res) => {
  try {
    const userId = req.user.sub;
    const ticketId = req.params.id;

    if (
      !Number.isInteger(Number(ticketId)) ||
      Number(ticketId) <= 0
    ) {
      return res.status(400).json({
        message: "Ticket ID must be a positive integer",
      });
    }

    const result = await pool.query(
      `
      SELECT
        st.id,
        st.ticket_number,
        st.created_by_user_id,
        st.subject,
        st.description,
        st.priority,
        st.status,
        st.related_order_id,
        st.created_at,
        st.updated_at
      FROM support_tickets st
      WHERE st.id = $1
        AND st.created_by_user_id = $2
      LIMIT 1
      `,
      [
        Number(ticketId),
        userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Support ticket not found",
      });
    }

    return res.status(200).json({
      message: "Support ticket fetched successfully",
      ticket: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Get Ticket By ID Error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch support ticket",
    });
  }
};


/*
|--------------------------------------------------------------------------
| Update My Support Ticket
|--------------------------------------------------------------------------
*/
const updateTicket = async (req, res) => {
  try {
    const userId = req.user.sub;
    const ticketId = req.params.id;

    if (
      !Number.isInteger(Number(ticketId)) ||
      Number(ticketId) <= 0
    ) {
      return res.status(400).json({
        message: "Ticket ID must be a positive integer",
      });
    }

    const {
      subject,
      description,
      priority,
    } = req.body;

    const allowedPriorities = [
      "Low",
      "Medium",
      "High",
      "Urgent",
    ];

    if (
      priority !== undefined &&
      !allowedPriorities.includes(priority)
    ) {
      return res.status(400).json({
        message:
          "priority must be Low, Medium, High, or Urgent",
      });
    }

    if (
      subject !== undefined &&
      (
        typeof subject !== "string" ||
        subject.trim().length === 0
      )
    ) {
      return res.status(400).json({
        message: "subject must be a non-empty string",
      });
    }

    if (
      description !== undefined &&
      (
        typeof description !== "string" ||
        description.trim().length === 0
      )
    ) {
      return res.status(400).json({
        message:
          "description must be a non-empty string",
      });
    }

    if (
      subject === undefined &&
      description === undefined &&
      priority === undefined
    ) {
      return res.status(400).json({
        message:
          "At least one of subject, description, or priority is required",
      });
    }

    const existingResult = await pool.query(
      `
      SELECT
        id,
        ticket_number,
        subject,
        description,
        priority,
        status,
        related_order_id
      FROM support_tickets
      WHERE id = $1
        AND created_by_user_id = $2
      LIMIT 1
      `,
      [
        Number(ticketId),
        userId,
      ]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        message: "Support ticket not found",
      });
    }

    const existingTicket = existingResult.rows[0];

    if (
      existingTicket.status === "Closed" ||
      existingTicket.status === "Cancelled"
    ) {
      return res.status(409).json({
        message:
          "Closed or cancelled tickets cannot be updated",
      });
    }

    const result = await pool.query(
      `
      UPDATE support_tickets
      SET
        subject = COALESCE($1, subject),
        description = COALESCE($2, description),
        priority = COALESCE($3, priority),
        updated_at = NOW()
      WHERE id = $4
        AND created_by_user_id = $5
      RETURNING
        id,
        ticket_number,
        created_by_user_id,
        subject,
        description,
        priority,
        status,
        related_order_id,
        created_at,
        updated_at
      `,
      [
        subject !== undefined
          ? subject.trim()
          : null,
        description !== undefined
          ? description.trim()
          : null,
        priority !== undefined
          ? priority
          : null,
        Number(ticketId),
        userId,
      ]
    );

    return res.status(200).json({
      message: "Support ticket updated successfully",
      ticket: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Update Support Ticket Error:",
      error
    );

    return res.status(500).json({
      message: "Failed to update support ticket",
    });
  }
};


/*
|--------------------------------------------------------------------------
| Assign Support Ticket
|--------------------------------------------------------------------------
*/
const assignTicket = async (req, res) => {
  try {
    const ticketId = Number(req.params.id);
    const { assigned_user_id } = req.body;

    if (
      !Number.isInteger(ticketId) ||
      ticketId <= 0
    ) {
      return res.status(400).json({
        message:
          "Ticket id must be a positive integer",
      });
    }

    if (
      !Number.isInteger(Number(assigned_user_id)) ||
      Number(assigned_user_id) <= 0
    ) {
      return res.status(400).json({
        message:
          "assigned_user_id must be a positive integer",
      });
    }

    const ticketResult = await pool.query(
      `
      SELECT
        id,
        ticket_number,
        status,
        created_by_user_id
      FROM support_tickets
      WHERE id = $1
      `,
      [ticketId]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        message: "Support ticket not found",
      });
    }

    const ticket = ticketResult.rows[0];

    if (
      ticket.status === "Closed" ||
      ticket.status === "Cancelled"
    ) {
      return res.status(400).json({
        message:
          "Closed or cancelled ticket cannot be assigned",
      });
    }

    const userResult = await pool.query(
      `
      SELECT
        id,
        full_name,
        email,
        status
      FROM users
      WHERE id = $1
        AND status = 'Active'
      `,
      [Number(assigned_user_id)]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message:
          "Active assigned user not found",
      });
    }

    const existingAssignment = await pool.query(
      `
      SELECT
        id,
        ticket_id,
        assigned_user_id,
        status
      FROM support_assignments
      WHERE ticket_id = $1
        AND status NOT IN (
          'Completed',
          'Cancelled'
        )
      LIMIT 1
      `,
      [ticketId]
    );

    if (existingAssignment.rows.length > 0) {
      return res.status(409).json({
        message:
          "Active assignment already exists",
        assignment:
          existingAssignment.rows[0],
      });
    }

    const assignmentResult = await pool.query(
      `
      INSERT INTO support_assignments (
        ticket_id,
        assigned_user_id,
        status,
        assigned_at
      )
      VALUES (
        $1,
        $2,
        'Assigned',
        NOW()
      )
      RETURNING
        id,
        ticket_id,
        participant_id,
        assigned_user_id,
        status,
        assigned_at,
        completed_at
      `,
      [
        ticketId,
        Number(assigned_user_id),
      ]
    );

    return res.status(201).json({
      message:
        "Support ticket assigned successfully",
      assignment:
        assignmentResult.rows[0],
      ticket,
      assigned_user:
        userResult.rows[0],
    });

  } catch (error) {
    console.error(
      "Assign Support Ticket Error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to assign support ticket",
    });
  }
};


/*
|--------------------------------------------------------------------------
| Get Assigned Support Tickets
|--------------------------------------------------------------------------
*/
const getAssignedTickets = async (req, res) => {
  try {
    const userId = req.user.sub;

    const result = await pool.query(
      `
      SELECT
        sa.id AS assignment_id,
        sa.ticket_id,
        sa.assigned_user_id,
        sa.status AS assignment_status,
        sa.assigned_at,
        sa.completed_at,

        st.ticket_number,
        st.created_by_user_id,
        st.subject,
        st.description,
        st.priority,
        st.status AS ticket_status,
        st.related_order_id,
        st.created_at,
        st.updated_at

      FROM support_assignments sa

      INNER JOIN support_tickets st
        ON st.id = sa.ticket_id

      WHERE sa.assigned_user_id = $1

      ORDER BY sa.id DESC
      `,
      [userId]
    );

    return res.status(200).json({
      message:
        "Assigned support tickets fetched successfully",
      count: result.rows.length,
      tickets: result.rows,
    });

  } catch (error) {
    console.error(
      "Get Assigned Support Tickets Error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch assigned support tickets",
    });
  }
};


const getAllTickets = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        st.id,
        st.ticket_number,
        st.created_by_user_id,
        st.subject,
        st.description,
        st.priority,
        st.status,
        st.related_order_id,
        st.created_at,
        st.updated_at,

        u.full_name AS created_by_name,
        u.email AS created_by_email,

        sa.id AS assignment_id,
        sa.assigned_user_id,
        sa.status AS assignment_status,
        sa.assigned_at,
        sa.completed_at,

        au.full_name AS assigned_user_name,
        au.email AS assigned_user_email

      FROM support_tickets st

      INNER JOIN users u
        ON u.id = st.created_by_user_id

      LEFT JOIN support_assignments sa
        ON sa.ticket_id = st.id

      LEFT JOIN users au
        ON au.id = sa.assigned_user_id

      ORDER BY st.id DESC
      `
    );

    return res.status(200).json({
      message: "All support tickets fetched successfully",
      count: result.rows.length,
      tickets: result.rows,
    });

  } catch (error) {
    console.error(
      "Get All Support Tickets Error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch support tickets",
    });
  }
};


/*
|--------------------------------------------------------------------------
| Update Support Ticket Status
|--------------------------------------------------------------------------
*/
const updateTicketStatus = async (req, res) => {
  try {
    const ticketId = Number(req.params.id);
    const { status } = req.body;
    const userId = Number(req.user.sub);

    if (
      !Number.isInteger(ticketId) ||
      ticketId <= 0
    ) {
      return res.status(400).json({
        message:
          "Ticket id must be a positive integer",
      });
    }

    const allowedStatuses = [
      "Open",
      "In Progress",
      "Resolved",
      "Closed",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "status must be Open, In Progress, Resolved, Closed, or Cancelled",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Find Existing Assignment
    |--------------------------------------------------------------------------
    |
    | We intentionally do NOT filter out Completed/Cancelled assignments.
    | This allows:
    |
    | Resolved -> Closed
    |
    | without returning:
    |
    | "You are not assigned to this support ticket"
    |
    */
    const assignmentResult = await pool.query(
      `
      SELECT
        id,
        ticket_id,
        assigned_user_id,
        status
      FROM support_assignments
      WHERE ticket_id = $1::bigint
        AND assigned_user_id = $2::bigint
      ORDER BY id DESC
      LIMIT 1
      `,
      [
        ticketId,
        userId,
      ]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(403).json({
        message:
          "You are not assigned to this support ticket",
      });
    }

    const assignment =
      assignmentResult.rows[0];

    /*
    |--------------------------------------------------------------------------
    | Check Ticket
    |--------------------------------------------------------------------------
    */
    const ticketResult = await pool.query(
      `
      SELECT
        id,
        ticket_number,
        status,
        created_by_user_id
      FROM support_tickets
      WHERE id = $1::bigint
      LIMIT 1
      `,
      [ticketId]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        message:
          "Support ticket not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Transaction
    |--------------------------------------------------------------------------
    */
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      /*
      |--------------------------------------------------------------------------
      | Update Ticket Status
      |--------------------------------------------------------------------------
      */
      const ticketUpdate =
        await client.query(
          `
          UPDATE support_tickets
          SET
            status = $1::varchar,
            updated_at = NOW()
          WHERE id = $2::bigint
          RETURNING
            id,
            ticket_number,
            created_by_user_id,
            subject,
            description,
            priority,
            status,
            related_order_id,
            created_at,
            updated_at
          `,
          [
            status,
            ticketId,
          ]
        );

      /*
      |--------------------------------------------------------------------------
      | Determine Assignment Status
      |--------------------------------------------------------------------------
      */
      let assignmentStatus =
        assignment.status;

      if (status === "Open") {
        assignmentStatus = "Assigned";
      } else if (status === "In Progress") {
        assignmentStatus = "In Progress";
      } else if (
        status === "Resolved" ||
        status === "Closed"
      ) {
        assignmentStatus = "Completed";
      } else if (status === "Cancelled") {
        assignmentStatus = "Cancelled";
      }

      /*
      |--------------------------------------------------------------------------
      | Update Assignment
      |--------------------------------------------------------------------------
      */
      const assignmentUpdate =
        await client.query(
          `
          UPDATE support_assignments
          SET
            status = $1::varchar,
            completed_at = CASE
              WHEN $1::varchar IN (
                'Completed',
                'Cancelled'
              )
              THEN COALESCE(
                completed_at,
                NOW()
              )
              ELSE NULL
            END
          WHERE id = $2::bigint
          RETURNING
            id,
            ticket_id,
            participant_id,
            assigned_user_id,
            status,
            assigned_at,
            completed_at
          `,
          [
            assignmentStatus,
            Number(assignment.id),
          ]
        );

      await client.query("COMMIT");

      return res.status(200).json({
        message:
          "Support ticket status updated successfully",
        ticket:
          ticketUpdate.rows[0],
        assignment:
          assignmentUpdate.rows[0],
      });

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error(
      "Update Support Ticket Status Error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to update support ticket status",
    });
  }
};


/*
|--------------------------------------------------------------------------
| Module Exports
|--------------------------------------------------------------------------
*/
module.exports = {
  createTicket,
  getMyTickets,
  getTicketById,
  updateTicket,
  assignTicket,
  getAssignedTickets,
  getAllTickets,
  updateTicketStatus,
};