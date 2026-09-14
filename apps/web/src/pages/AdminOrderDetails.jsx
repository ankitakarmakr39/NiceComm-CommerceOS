import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE_URL = "https://nicecomm-api-gateway.onrender.com";

const roleTypeMap = {
    Seller: "Seller",
    Warehouse: "Warehouse Provider",
    Packaging: "Packaging Provider",
    Logistics: "Logistics Provider",
    Marketing: "Marketing Agency",
    Affiliate: "Affiliate Partner",
    Inspection: "Inspection Partner",
    Repair: "Repair Partner",
    Installation: "Installation Partner",
};

function AdminOrderDetails() {
    const { token } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [participants, setParticipants] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showAssignmentForm, setShowAssignmentForm] =
        useState(false);

    const [assignmentForm, setAssignmentForm] = useState({
        participant_role: "",
        participant_id: "",
        notes: "",
    });

    const [assignmentLoading, setAssignmentLoading] =
        useState(false);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_BASE_URL}/api/orders/admin/${id}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to fetch order"
                );
            }

            setOrder(data.order || null);
            setItems(data.order_items || []);
            setAssignments(data.assignments || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchParticipants = async () => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/participants`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to fetch participants"
                );
            }

            setParticipants(
                data.participants || []
            );
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        if (token && id) {
            fetchOrder();
            fetchParticipants();
        }
    }, [token, id]);

    const handleAssignmentChange = (event) => {
        const { name, value } = event.target;

        setAssignmentForm(
            (previousForm) => ({
                ...previousForm,
                [name]: value,
            })
        );
    };

    const handleRoleChange = (event) => {
        const role = event.target.value;

        setAssignmentForm({
            participant_role: role,
            participant_id: "",
            notes: assignmentForm.notes,
        });
    };

    const handleOpenAssignmentForm = () => {
        setError("");
        setSuccess("");

        setAssignmentForm({
            participant_role: "",
            participant_id: "",
            notes: "",
        });

        setShowAssignmentForm(true);
    };

    const handleCloseAssignmentForm = () => {
        setShowAssignmentForm(false);

        setAssignmentForm({
            participant_role: "",
            participant_id: "",
            notes: "",
        });

        setError("");
    };

    const handleCreateAssignment = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        try {
            if (!assignmentForm.participant_role) {
                throw new Error(
                    "Please select a participant role."
                );
            }

            if (!assignmentForm.participant_id) {
                throw new Error(
                    "Please select a participant."
                );
            }

            if (
                !order ||
                !Number.isInteger(Number(order.id)) ||
                Number(order.id) <= 0
            ) {
                throw new Error(
                    "Invalid order ID."
                );
            }

            if (
                ["Completed", "Cancelled"].includes(
                    order.status
                )
            ) {
                throw new Error(
                    "Cannot create assignment for a completed or cancelled order."
                );
            }

            setAssignmentLoading(true);

            const response = await fetch(
                `${API_BASE_URL}/api/orders/assignments`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        order_id: Number(order.id),

                        participant_id:
                            Number(
                                assignmentForm.participant_id
                            ),

                        participant_role:
                            assignmentForm.participant_role,

                        notes:
                            assignmentForm.notes.trim() ||
                            null,
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to create assignment"
                );
            }

            setSuccess(
                "Order assignment created successfully."
            );

            setShowAssignmentForm(false);

            setAssignmentForm({
                participant_role: "",
                participant_id: "",
                notes: "",
            });

            await fetchOrder();
        } catch (err) {
            setError(err.message);
        } finally {
            setAssignmentLoading(false);
        }
    };

    const availableParticipants = participants.filter(
        (participant) => {
            if (
                participant.status !== "Active"
            ) {
                return false;
            }

            if (
                !assignmentForm.participant_role
            ) {
                return false;
            }

            return (
                participant.participant_type_name ===
                roleTypeMap[
                    assignmentForm.participant_role
                ]
            );
        }
    );

    if (loading) {
        return (
            <div className="nice-content">
                <div className="nice-empty-state">
                    Loading admin order details...
                </div>
            </div>
        );
    }

    if (error && !order) {
        return (
            <div className="nice-content">
                <div className="nice-auth-error">
                    {error}
                </div>

                <button
                    type="button"
                    className="nice-secondary-button"
                    onClick={() =>
                        navigate("/admin/orders")
                    }
                >
                    ← Back to Orders
                </button>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="nice-content">
                <div className="nice-empty-state">
                    Order not found.
                </div>

                <button
                    type="button"
                    className="nice-secondary-button"
                    onClick={() =>
                        navigate("/admin/orders")
                    }
                >
                    ← Back to Orders
                </button>
            </div>
        );
    }

    return (
        <div className="nice-content">

            {/* =========================
                PAGE HEADER
            ========================== */}

            <div className="nice-page-header">

                <div>
                    <div className="nice-page-kicker">
                        ADMINISTRATION
                    </div>

                    <h1>
                        Order #{order.id}
                    </h1>

                    <p>
                        View order details and manage
                        participant assignments.
                    </p>
                </div>

                <button
                    type="button"
                    className="nice-secondary-button"
                    onClick={() =>
                        navigate("/admin/orders")
                    }
                >
                    ← Back to Orders
                </button>

            </div>


            {/* =========================
                ERROR
            ========================== */}

            {error && (
                <div className="nice-auth-error">
                    {error}
                </div>
            )}


            {/* =========================
                SUCCESS
            ========================== */}

            {success && (
                <div className="nice-auth-success">

                    <span className="nice-auth-success-icon">
                        ✓
                    </span>

                    <span>
                        {success}
                    </span>

                </div>
            )}


            {/* =========================
                ORDER SUMMARY
            ========================== */}

            <div className="nice-card">

                <div className="nice-card-header">

                    <div>
                        <h2>
                            Order Summary
                        </h2>

                        <p>
                            Core order information.
                        </p>
                    </div>

                    <span
                        className={
                            order.status === "Completed"
                                ? "nice-status-active"
                                : "nice-status-inactive"
                        }
                    >
                        {order.status}
                    </span>

                </div>

                <div className="nice-detail-grid">

                    <div>
                        <strong>
                            Order Number
                        </strong>

                        <p>
                            {order.order_number}
                        </p>
                    </div>

                    <div>
                        <strong>
                            Total
                        </strong>

                        <p>
                            ₹
                            {Number(
                                order.total_amount
                            ).toFixed(2)}
                        </p>
                    </div>

                    <div>
                        <strong>
                            Created At
                        </strong>

                        <p>
                            {new Date(
                                order.created_at
                            ).toLocaleString()}
                        </p>
                    </div>

                </div>

            </div>


            {/* =========================
                CUSTOMER
            ========================== */}

            <div className="nice-card">

                <div className="nice-card-header">
                    <div>
                        <h2>
                            Customer Information
                        </h2>
                    </div>
                </div>

                <div className="nice-detail-grid">

                    <div>
                        <strong>
                            Name
                        </strong>

                        <p>
                            {order.customer_name ||
                                "-"}
                        </p>
                    </div>

                    <div>
                        <strong>
                            Email
                        </strong>

                        <p>
                            {order.customer_email ||
                                "-"}
                        </p>
                    </div>

                </div>

            </div>


            {/* =========================
                SHIPPING ADDRESS
            ========================== */}

            <div className="nice-card">

                <div className="nice-card-header">
                    <div>
                        <h2>
                            Shipping Address
                        </h2>
                    </div>
                </div>

                <p>
                    {order.shipping_address_line1 ||
                        ""}

                    {order.shipping_address_line2
                        ? `, ${order.shipping_address_line2}`
                        : ""}

                    {order.shipping_city
                        ? `, ${order.shipping_city}`
                        : ""}

                    {order.shipping_state
                        ? `, ${order.shipping_state}`
                        : ""}

                    {order.shipping_postal_code
                        ? `, ${order.shipping_postal_code}`
                        : ""}

                    {order.shipping_country
                        ? `, ${order.shipping_country}`
                        : ""}
                </p>

            </div>


            {/* =========================
                ORDER ITEMS
            ========================== */}

            <div className="nice-card">

                <div className="nice-card-header">
                    <div>
                        <h2>
                            Order Items
                        </h2>

                        <p>
                            Products included in this order.
                        </p>
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="nice-empty-state">
                        No items found.
                    </div>
                ) : (
                    <div className="nice-table-wrap">

                        <table className="nice-table">

                            <thead>
                                <tr>
                                    <th>
                                        Product
                                    </th>

                                    <th>
                                        SKU
                                    </th>

                                    <th>
                                        Quantity
                                    </th>

                                    <th>
                                        Unit Price
                                    </th>

                                    <th>
                                        Line Total
                                    </th>
                                </tr>
                            </thead>

                            <tbody>

                                {items.map(
                                    (item) => (
                                        <tr
                                            key={
                                                item.id
                                            }
                                        >

                                            <td>
                                                <strong>
                                                    {
                                                        item.product_name
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                {
                                                    item.sku
                                                }
                                            </td>

                                            <td>
                                                {
                                                    item.quantity
                                                }
                                            </td>

                                            <td>
                                                ₹
                                                {Number(
                                                    item.unit_price
                                                ).toFixed(2)}
                                            </td>

                                            <td>
                                                ₹
                                                {Number(
                                                    item.line_total
                                                ).toFixed(2)}
                                            </td>

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>


            {/* =========================
                PARTICIPANT ASSIGNMENTS
            ========================== */}

            <div className="nice-card">

                <div className="nice-card-header">

                    <div>
                        <h2>
                            Participant Assignments
                        </h2>

                        <p>
                            Participants currently assigned
                            to this order.
                        </p>
                    </div>

                    {!showAssignmentForm &&
                        !["Completed", "Cancelled"].includes(
                            order.status
                        ) && (
                            <button
                                type="button"
                                className="nice-create-button"
                                onClick={
                                    handleOpenAssignmentForm
                                }
                            >
                                + Create Assignment
                            </button>
                        )}

                </div>


                {/* =========================
                    CREATE ASSIGNMENT FORM
                ========================== */}

                {showAssignmentForm && (
                    <div
                        className="nice-card"
                        style={{
                            marginTop: "20px",
                            background: "#f8fafc",
                        }}
                    >

                        <div className="nice-card-header">

                            <div>
                                <h3>
                                    Create Order Assignment
                                </h3>

                                <p>
                                    Assign an active participant
                                    to this order.
                                </p>
                            </div>

                        </div>


                        <form
                            className="nice-auth-form"
                            onSubmit={
                                handleCreateAssignment
                            }
                        >

                            <div className="nice-form-grid">

                                {/* Role */}

                                <div className="nice-auth-field">

                                    <label htmlFor="participant_role">
                                        Participant Role
                                    </label>

                                    <select
                                        id="participant_role"
                                        name="participant_role"
                                        value={
                                            assignmentForm.participant_role
                                        }
                                        onChange={
                                            handleRoleChange
                                        }
                                        required
                                    >

                                        <option value="">
                                            Select Role
                                        </option>

                                        {Object.keys(
                                            roleTypeMap
                                        ).map(
                                            (role) => (
                                                <option
                                                    key={
                                                        role
                                                    }
                                                    value={
                                                        role
                                                    }
                                                >
                                                    {
                                                        role
                                                    }
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>


                                {/* Participant */}

                                <div className="nice-auth-field">

                                    <label htmlFor="participant_id">
                                        Participant
                                    </label>

                                    <select
                                        id="participant_id"
                                        name="participant_id"
                                        value={
                                            assignmentForm.participant_id
                                        }
                                        onChange={
                                            handleAssignmentChange
                                        }
                                        required
                                        disabled={
                                            !assignmentForm.participant_role
                                        }
                                    >

                                        <option value="">
                                            {assignmentForm.participant_role
                                                ? "Select Participant"
                                                : "Select Role First"}
                                        </option>

                                        {availableParticipants.map(
                                            (
                                                participant
                                            ) => (
                                                <option
                                                    key={
                                                        participant.id
                                                    }
                                                    value={
                                                        participant.id
                                                    }
                                                >
                                                    {
                                                        participant.company_name
                                                    }{" "}
                                                    — ID{" "}
                                                    {
                                                        participant.id
                                                    }
                                                </option>
                                            )
                                        )}

                                    </select>

                                    {assignmentForm.participant_role &&
                                        availableParticipants.length ===
                                            0 && (
                                            <small
                                                style={{
                                                    color: "#64748b",
                                                    fontSize: "12px",
                                                    marginTop: "6px",
                                                }}
                                            >
                                                No active participants
                                                available for this role.
                                            </small>
                                        )}

                                </div>

                            </div>


                            {/* Notes */}

                            <div className="nice-auth-field">

                                <label htmlFor="notes">
                                    Notes
                                </label>

                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={
                                        assignmentForm.notes
                                    }
                                    onChange={
                                        handleAssignmentChange
                                    }
                                    placeholder="Enter assignment notes"
                                    rows="4"
                                />

                            </div>


                            {/* Actions */}

                            <div className="nice-form-actions">

                                <button
                                    type="button"
                                    className="nice-secondary-button"
                                    onClick={
                                        handleCloseAssignmentForm
                                    }
                                    disabled={
                                        assignmentLoading
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="nice-auth-submit"
                                    disabled={
                                        assignmentLoading ||
                                        !assignmentForm.participant_id
                                    }
                                >
                                    {assignmentLoading
                                        ? "Creating..."
                                        : "Create Assignment →"}
                                </button>

                            </div>

                        </form>

                    </div>
                )}


                {/* =========================
                    ASSIGNMENT LIST
                ========================== */}

                <div
                    style={{
                        marginTop: "24px",
                    }}
                >

                    {assignments.length === 0 ? (
                        <div className="nice-empty-state">
                            No assignments found.
                        </div>
                    ) : (
                        <div className="nice-table-wrap">

                            <table className="nice-table">

                                <thead>

                                    <tr>
                                        <th>
                                            Participant
                                        </th>

                                        <th>
                                            Contact
                                        </th>

                                        <th>
                                            Role
                                        </th>

                                        <th>
                                            Participant Type
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Notes
                                        </th>
                                    </tr>

                                </thead>

                                <tbody>

                                    {assignments.map(
                                        (assignment) => (
                                            <tr
                                                key={
                                                    assignment.id
                                                }
                                            >

                                                <td>
                                                    <strong>
                                                        {
                                                            assignment.company_name
                                                        }
                                                    </strong>
                                                </td>

                                                <td>
                                                    {
                                                        assignment.contact_person ||
                                                        "-"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        assignment.participant_role
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        assignment.participant_type
                                                    }
                                                </td>

                                                <td>

                                                    <span
                                                        className={
                                                            assignment.status ===
                                                                "Completed"
                                                                ? "nice-status-active"
                                                                : "nice-status-inactive"
                                                        }
                                                    >
                                                        {
                                                            assignment.status
                                                        }
                                                    </span>

                                                </td>

                                                <td>
                                                    {
                                                        assignment.notes ||
                                                        "-"
                                                    }
                                                </td>

                                            </tr>
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>
                    )}

                </div>

            </div>

        </div>
    );
}

export default AdminOrderDetails;
