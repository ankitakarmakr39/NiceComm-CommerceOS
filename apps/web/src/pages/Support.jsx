import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

function Support() {
    const { token } = useAuth();

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        subject: "",
        description: "",
        priority: "Medium",
        related_order_id: "",
    });

    const fetchTickets = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                "https://nicecomm-api-gateway.onrender.com/api/support/tickets",
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

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!form.subject.trim() || !form.description.trim()) {
            setError("Subject and description are required.");
            return;
        }

        try {
            setCreating(true);

            const payload = {
                subject: form.subject.trim(),
                description: form.description.trim(),
                priority: form.priority,
            };

            if (form.related_order_id.trim()) {
                payload.related_order_id = Number(
                    form.related_order_id
                );
            }

            const response = await fetch(
                "https://nicecomm-api-gateway.onrender.com/api/support/tickets",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to create support ticket"
                );
            }

            setSuccess(
                `Ticket created successfully. Ticket Number: ${data.ticket.ticket_number}`
            );

            setForm({
                subject: "",
                description: "",
                priority: "Medium",
                related_order_id: "",
            });

            await fetchTickets();
        } catch (err) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div>
            <h1>Customer Support</h1>

            <p>
                Create a support ticket and track your existing tickets.
            </p>

            {error && (
                <div
                    style={{
                        marginBottom: "15px",
                        padding: "10px",
                        border: "1px solid #dc2626",
                    }}
                >
                    {error}
                </div>
            )}

            {success && (
                <div
                    style={{
                        marginBottom: "15px",
                        padding: "10px",
                        border: "1px solid #16a34a",
                    }}
                >
                    {success}
                </div>
            )}

            <hr />

            <h2>Create Support Ticket</h2>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "12px" }}>
                    <label>
                        Subject
                    </label>

                    <br />

                    <input
                        type="text"
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        placeholder="Enter ticket subject"
                        style={{ width: "100%", maxWidth: "500px" }}
                    />
                </div>

                <div style={{ marginBottom: "12px" }}>
                    <label>
                        Description
                    </label>

                    <br />

                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Describe your issue"
                        rows="5"
                        style={{ width: "100%", maxWidth: "500px" }}
                    />
                </div>

                <div style={{ marginBottom: "12px" }}>
                    <label>
                        Priority
                    </label>

                    <br />

                    <select
                        name="priority"
                        value={form.priority}
                        onChange={handleChange}
                    >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                    </select>
                </div>

                <div style={{ marginBottom: "12px" }}>
                    <label>
                        Related Order ID (Optional)
                    </label>

                    <br />

                    <input
                        type="number"
                        name="related_order_id"
                        value={form.related_order_id}
                        onChange={handleChange}
                        placeholder="Example: 5"
                        min="1"
                    />
                </div>

                <button
                    type="submit"
                    disabled={creating}
                >
                    {creating
                        ? "Creating Ticket..."
                        : "Create Ticket"}
                </button>
            </form>

            <hr />

            <h2>My Support Tickets</h2>

            {loading ? (
                <p>Loading tickets...</p>
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
                                marginBottom: "12px",
                            }}
                        >
                            <h3>
                                {ticket.ticket_number}
                            </h3>

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
                                <strong>Status:</strong>{" "}
                                {ticket.status}
                            </p>

                            {ticket.related_order_id && (
                                <p>
                                    <strong>Related Order:</strong>{" "}
                                    #{ticket.related_order_id}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Support;
