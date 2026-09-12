import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE_URL = "http://localhost:4000";

function OrderDetails() {
    const { id } = useParams();
    const { token } = useAuth();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_BASE_URL}/api/orders/${id}`,
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

                setOrder({
                    ...data.order,
                    order_items: data.order_items || [],
                    assignments: data.assignments || [],
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token && id) {
            fetchOrder();
        }
    }, [token, id]);

    if (loading) {
        return <p>Loading order...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    if (!order) {
        return <p>Order not found.</p>;
    }

    return (
        <div>
            <h1>Order Details</h1>

            <h2>Order #{order.id}</h2>

            <p>
                <strong>Order Number:</strong>{" "}
                {order.order_number}
            </p>

            <p>
                <strong>Status:</strong>{" "}
                {order.status}
            </p>

            <p>
                <strong>Total:</strong>{" "}
                ₹
                {Number(
                    order.total_amount
                ).toFixed(2)}
            </p>

            <h2>Shipping Address</h2>

            <p>
                {order.shipping_address_line1}
                <br />
                {order.shipping_city}
                <br />
                {order.shipping_state}
                <br />
                {order.shipping_postal_code}
                <br />
                {order.shipping_country}
            </p>

            

            <h2>Items</h2>

            {order.order_items &&
                order.order_items.length > 0 ? (
                <div>
                    {order.order_items.map(
                        (item) => (
                            <div key={item.id}>
                                <p>
                                    <strong>
                                        Product:
                                    </strong>{" "}
                                    {
                                        item.product_name
                                    }
                                </p>

                                <p>
                                    <strong>
                                        SKU:
                                    </strong>{" "}
                                    {item.sku}
                                </p>

                                <p>
                                    <strong>
                                        Quantity:
                                    </strong>{" "}
                                    {item.quantity}
                                </p>

                                <p>
                                    <strong>
                                        Unit Price:
                                    </strong>{" "}
                                    ₹
                                    {Number(
                                        item.unit_price
                                    ).toFixed(2)}
                                </p>

                                <p>
                                    <strong>
                                        Line Total:
                                    </strong>{" "}
                                    ₹
                                    {Number(
                                        item.line_total
                                    ).toFixed(2)}
                                </p>

                                <hr />
                            </div>
                        )
                    )}
                </div>
            ) : (
                <p>No items found.</p>
            )}

            <h2>Assignments</h2>

            {order.assignments &&
                order.assignments.length > 0 ? (
                <div>
                    {order.assignments.map(
                        (assignment) => (
                            <div
                                key={
                                    assignment.id
                                }
                            >
                                <p>
                                    <strong>
                                        Company:
                                    </strong>{" "}
                                    {assignment.company_name}
                                </p>

                                <p>
                                    <strong>
                                        Role:
                                    </strong>{" "}
                                    {
                                        assignment.participant_role
                                    }
                                </p>

                                <p>
                                    <strong>
                                        Status:
                                    </strong>{" "}
                                    {
                                        assignment.status
                                    }
                                </p>

                                <hr />
                            </div>
                        )
                    )}
                </div>
            ) : (
                <p>
                    No assignments found.
                </p>
            )}
        </div>
    );
}

export default OrderDetails;