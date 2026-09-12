import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

function AdminSupport() {
    const { token } = useAuth();

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedTicket, setSelectedTicket] = useState(null);
    const [assignedUserId, setAssignedUserId] = useState("");
    const [status, setStatus] = useState("");

    const fetchTickets = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                "http://localhost:4000/api/support/tickets/all",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to fetch support tickets"
                );
            }

            setTickets(data.tickets || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchTickets();
        }
    }, [token]);

    const handleAssign = async (ticketId) => {
        if (!assignedUserId) {
            setError("Please enter an assigned user ID.");
            return;
        }

        try {
            setError("");

            const response = await fetch(
                `http://localhost:4000/api/support/tickets/${ticketId}/assign`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        assigned_user_id: Number(assignedUserId),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to assign ticket"
                );
            }

            setAssignedUserId("");
            setSelectedTicket(null);

            await fetchTickets();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleStatusUpdate = async (ticketId) => {
        if (!status) {
            setError("Please select a status.");
            return;
        }

        try {
            setError("");

            const response = await fetch(
                `http://localhost:4000/api/support/tickets/${ticketId}/status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        status,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to update ticket status"
                );
            }

            setStatus("");
            setSelectedTicket(null);

            await fetchTickets();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div>
            <h1>Admin Support Management</h1>

            <p>
                Manage customer support tickets, assignments and statuses.
            </p>

            {error && (
                <div
                    style={{
                        padding: "10px",
                        marginBottom: "15px",
                        border: "1px solid #dc2626",
                    }}
                >
                    {error}
                </div>
            )}

            <hr />

            {loading ? (
                <p>Loading support tickets...</p>
            ) : tickets.length === 0 ? (
                <p>No support tickets found.</p>
            ) : (
                <div>
                    {tickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            style={{
                                border: "1px solid #ccc",
                                padding: "15px",
                                marginBottom: "15px",
                            }}
                        >
                            <h2>
                                {ticket.ticket_number}
                            </h2>

                            <p>
                                <strong>Customer:</strong>{" "}
                                {ticket.created_by_name}
                            </p>

                            <p>
                                <strong>Email:</strong>{" "}
                                {ticket.created_by_email}
                            </p>

                            <p>
                                <strong>Subject:</strong>{" "}
                                {ticket.subject}
                            </p>

                            <p>
                                <strong>Description:</strong>{" "}
                                {ticket.description}
                            </p>

                            <p>
                                <strong>Priority:</strong>{" "}
                                {ticket.priority}
                            </p>

                            <p>
                                <strong>Ticket Status:</strong>{" "}
                                {ticket.status}
                            </p>

                            {ticket.related_order_id && (
                                <p>
                                    <strong>Related Order:</strong>{" "}
                                    #{ticket.related_order_id}
                                </p>
                            )}

                            <p>
                                <strong>Assigned User:</strong>{" "}
                                {ticket.assigned_user_name ||
                                    "Not Assigned"}
                            </p>

                            {ticket.assignment_status && (
                                <p>
                                    <strong>Assignment Status:</strong>{" "}
                                    {ticket.assignment_status}
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedTicket(ticket);
                                    setStatus(ticket.status);
                                    setAssignedUserId(
                                        ticket.assigned_user_id
                                            ? String(
                                                  ticket.assigned_user_id
                                              )
                                            : ""
                                    );
                                }}
                            >
                                Manage Ticket
                            </button>

                            {selectedTicket?.id === ticket.id && (
                                <div
                                    style={{
                                        marginTop: "15px",
                                        padding: "15px",
                                        border: "1px solid #999",
                                    }}
                                >
                                    <h3>
                                        Manage Ticket
                                    </h3>

                                    <div
                                        style={{
                                            marginBottom: "12px",
                                        }}
                                    >
                                        <label>
                                            Assigned User ID
                                        </label>

                                        <br />

                                        <input
                                            type="number"
                                            min="1"
                                            value={assignedUserId}
                                            onChange={(e) =>
                                                setAssignedUserId(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Example: 4"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleAssign(
                                                    ticket.id
                                                )
                                            }
                                            style={{
                                                marginLeft: "10px",
                                            }}
                                        >
                                            Assign
                                        </button>
                                    </div>

                                    <div
                                        style={{
                                            marginBottom: "12px",
                                        }}
                                    >
                                        <label>
                                            Ticket Status
                                        </label>

                                        <br />

                                        <select
                                            value={status}
                                            onChange={(e) =>
                                                setStatus(
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="Open">
                                                Open
                                            </option>

                                            <option value="In Progress">
                                                In Progress
                                            </option>

                                            <option value="Resolved">
                                                Resolved
                                            </option>

                                            <option value="Closed">
                                                Closed
                                            </option>

                                            <option value="Cancelled">
                                                Cancelled
                                            </option>
                                        </select>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleStatusUpdate(
                                                    ticket.id
                                                )
                                            }
                                            style={{
                                                marginLeft: "10px",
                                            }}
                                        >
                                            Update Status
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedTicket(null);
                                            setAssignedUserId("");
                                            setStatus("");
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminSupport;