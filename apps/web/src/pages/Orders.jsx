import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:4000";

function Orders() {
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
                    `${API_BASE_URL}/api/orders`,
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
                        "Failed to fetch orders"
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
        return <p>Loading orders...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div>
            <h1>My Orders</h1>

            {orders.length === 0 ? (
                <p>You have no orders yet.</p>
            ) : (
                <div>
                    {orders.map((order) => (
                        <div key={order.id}>
                            <h2>
                                Order #{order.id}
                            </h2>

                            <p>
                                <strong>
                                    Order Number:
                                </strong>{" "}
                                {order.order_number}
                            </p>

                            <p>
                                <strong>
                                    Total:
                                </strong>{" "}
                                ₹
                                {Number(
                                    order.total_amount
                                ).toFixed(2)}
                            </p>

                            <p>
                                <strong>
                                    Status:
                                </strong>{" "}
                                {order.status}
                            </p>

                            <p>
                                <strong>
                                    Shipping Address:
                                </strong>{" "}
                                {order.shipping_address_line1},{" "}
                                {order.shipping_city},{" "}
                                {order.shipping_state},{" "}
                                {order.shipping_postal_code},{" "}
                                {order.shipping_country}
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    navigate(`/orders/${order.id}`);
                                }}
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

export default Orders;