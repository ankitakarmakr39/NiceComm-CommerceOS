import { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:4000";

function SellerOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const token = localStorage.getItem("nicecomm_token");

    const fetchAssignedOrders = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_BASE_URL}/api/orders/assigned`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to fetch assigned orders"
                );
            }

            setOrders(data.orders || data.assignments || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignedOrders();
    }, []);

    const updateStatus = async (assignmentId, status) => {
        try {
            setError("");

            const response = await fetch(
    `${API_BASE_URL}/api/orders/assignments/${assignmentId}`,
    {
        method: "PATCH",
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
                    data.message || "Failed to update assignment status"
                );
            }

            await fetchAssignedOrders();
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return <p>Loading assigned orders...</p>;
    }

    return (
        <div>
            <h1>Seller Orders</h1>

            <p>
                View and manage orders assigned to your seller account.
            </p>

            {error && (
                <p>
                    <strong>{error}</strong>
                </p>
            )}

            {orders.length === 0 ? (
                <p>No assigned orders found.</p>
            ) : (
                orders.map((order) => {
                    const assignmentId =
                        order.assignment_id || order.id;

                    const orderId =
                        order.order_id || order.id;

                    const orderNumber =
                        order.order_number ||
                        order.orderNumber ||
                        `Order #${orderId}`;

                    const assignmentStatus =
                        order.assignment_status ||
                        order.status ||
                        "Assigned";

                    return (
                        <div
                            key={assignmentId}
                            style={{
                                border: "1px solid #ddd",
                                padding: "20px",
                                marginBottom: "20px",
                                borderRadius: "8px",
                            }}
                        >
                            <h2>Order #{orderId}</h2>

                            <p>
                                <strong>Order Number:</strong>{" "}
                                {orderNumber}
                            </p>

                            <p>
                                <strong>Total:</strong>{" "}
                                ₹
                                {Number(
                                    order.total_amount || 0
                                ).toFixed(2)}
                            </p>

                            <p>
                                <strong>Order Status:</strong>{" "}
                                {order.order_status || "Pending"}
                            </p>

                            <p>
                                <strong>Assignment Status:</strong>{" "}
                                {assignmentStatus}
                            </p>

                            <p>
                                <strong>Assignment ID:</strong>{" "}
                                {assignmentId}
                            </p>

                            {assignmentStatus === "Assigned" && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        updateStatus(
                                            assignmentId,
                                            "Accepted"
                                        )
                                    }
                                >
                                    Accept Order
                                </button>
                            )}

                            {assignmentStatus === "Accepted" && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        updateStatus(
                                            assignmentId,
                                            "In Progress"
                                        )
                                    }
                                >
                                    Start Processing
                                </button>
                            )}

                            {assignmentStatus === "In Progress" && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        updateStatus(
                                            assignmentId,
                                            "Completed"
                                        )
                                    }
                                >
                                    Complete Order
                                </button>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}

export default SellerOrders;