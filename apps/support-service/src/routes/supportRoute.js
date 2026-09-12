const express = require("express");

const verifyToken = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

const {
    createTicket,
    getMyTickets,
    getTicketById,
    updateTicket,
    assignTicket,
    getAssignedTickets,
    getAllTickets,
    updateTicketStatus,
} = require("../controllers/supportController");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/
router.get("/health", (req, res) => {
  res.status(200).json({
    service: "support-service",
    status: "OK",
    message: "Support Service is running",
  });
});

/*
|--------------------------------------------------------------------------
| Create Support Ticket
|--------------------------------------------------------------------------
*/
router.post(
  "/tickets",
  verifyToken,
  createTicket
);

/*
|--------------------------------------------------------------------------
| Get All Support Tickets - Admin
|--------------------------------------------------------------------------
*/
router.get(
  "/tickets/all",
  verifyToken,
  requireAdmin,
  getAllTickets
);

/*
|--------------------------------------------------------------------------
| Get My Support Tickets
|--------------------------------------------------------------------------
*/
router.get(
  "/tickets",
  verifyToken,
  getMyTickets
);

/*
|--------------------------------------------------------------------------
| Get My Ticket By ID
|--------------------------------------------------------------------------
*/
router.get(
  "/tickets/:id",
  verifyToken,
  getTicketById
);

/*
|--------------------------------------------------------------------------
| Update My Ticket
|--------------------------------------------------------------------------
*/
router.put(
  "/tickets/:id",
  verifyToken,
  updateTicket
);

/*
|--------------------------------------------------------------------------
| Support Assignment APIs
|--------------------------------------------------------------------------
*/
router.post(
  "/tickets/:id/assign",
  verifyToken,
  requireAdmin,
  assignTicket
);

router.get(
  "/assigned",
  verifyToken,
  requireAdmin,
  getAssignedTickets
);

/*
|--------------------------------------------------------------------------
| Ticket Status
|--------------------------------------------------------------------------
*/
router.put(
  "/tickets/:id/status",
  verifyToken,
  requireAdmin,
  updateTicketStatus
);
module.exports = router;