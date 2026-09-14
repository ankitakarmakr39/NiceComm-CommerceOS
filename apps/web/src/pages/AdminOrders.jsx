import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "https://nicecomm-api-gateway.onrender.com";

function AdminOrders() {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_BASE_URL}/api/orders/admin/all`,
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
                        data.message || "Failed to fetch orders"
                    );
                }

                setOrders(data.orders || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchOrders();
        }
    }, [token]);

    if (loading) {
        return <p>Loading admin orders...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div>
            <h1>All Orders</h1>

            <p>
                Total Orders: <strong>{orders.length}</strong>
            </p>

            {orders.length === 0 ? (
                <p>No orders found.</p>
            ) : (
                <div>
                    {orders.map((order) => (
                        <div key={order.id}>
                            <h2>
                                Order #{order.id}
                            </h2>

                            <p>
                                <strong>Order Number:</strong>{" "}
                                {order.order_number}
                            </p>

                            <p>
                                <strong>Customer:</strong>{" "}
                                {order.customer_name ||
                                    order.full_name ||
                                    "-"}
                            </p>

                            <p>
                                <strong>Customer Email:</strong>{" "}
                                {order.customer_email ||
                                    order.email ||
                                    "-"}
                            </p>

                            <p>
                                <strong>Total:</strong>{" "}
                                ₹
                                {Number(
                                    order.total_amount
                                ).toFixed(2)}
                            </p>

                            <p>
                                <strong>Status:</strong>{" "}
                                {order.status}
                            </p>

                            <p>
                                <strong>Shipping Address:</strong>{" "}
                                {order.shipping_address_line1},{" "}
                                {order.shipping_city},{" "}
                                {order.shipping_state},{" "}
                                {order.shipping_postal_code},{" "}
                                {order.shipping_country}
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        `/admin/orders/${order.id}`
                                    )
                                }
                            >
                                View Details
                            </button>

                            <hr />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminOrders;
