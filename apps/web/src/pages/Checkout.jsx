import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE_URL = "http://localhost:4000";

function Checkout() {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [shippingAddressLine1, setShippingAddressLine1] =
        useState("");
    const [shippingCity, setShippingCity] = useState("");
    const [shippingState, setShippingState] = useState("");
    const [shippingPostalCode, setShippingPostalCode] =
        useState("");
    const [shippingCountry, setShippingCountry] =
        useState("India");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [order, setOrder] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");
        setOrder(null);
        setLoading(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/checkout`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        shipping_address_line1:
                            shippingAddressLine1,
                        shipping_city:
                            shippingCity,
                        shipping_state:
                            shippingState,
                        shipping_postal_code:
                            shippingPostalCode,
                        shipping_country:
                            shippingCountry,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Checkout failed"
                );
            }

            setOrder(data.order || null);
            setSuccess(
                "Order placed successfully."
            );

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Checkout</h1>

            <h2>Shipping Address</h2>

            {error && <p>{error}</p>}
            {success && <p>{success}</p>}

            {!order && (
                <form onSubmit={handleSubmit}>

                    <div>
                        <label htmlFor="address">
                            Address
                        </label>

                        <br />

                        <input
                            id="address"
                            type="text"
                            value={
                                shippingAddressLine1
                            }
                            onChange={(event) =>
                                setShippingAddressLine1(
                                    event.target.value
                                )
                            }
                            required
                        />
                    </div>

                    <br />

                    <div>
                        <label htmlFor="city">
                            City
                        </label>

                        <br />

                        <input
                            id="city"
                            type="text"
                            value={shippingCity}
                            onChange={(event) =>
                                setShippingCity(
                                    event.target.value
                                )
                            }
                            required
                        />
                    </div>

                    <br />

                    <div>
                        <label htmlFor="state">
                            State
                        </label>

                        <br />

                        <input
                            id="state"
                            type="text"
                            value={shippingState}
                            onChange={(event) =>
                                setShippingState(
                                    event.target.value
                                )
                            }
                            required
                        />
                    </div>

                    <br />

                    <div>
                        <label htmlFor="postalCode">
                            Postal Code
                        </label>

                        <br />

                        <input
                            id="postalCode"
                            type="text"
                            value={
                                shippingPostalCode
                            }
                            onChange={(event) =>
                                setShippingPostalCode(
                                    event.target.value
                                )
                            }
                            required
                        />
                    </div>

                    <br />

                    <div>
                        <label htmlFor="country">
                            Country
                        </label>

                        <br />

                        <input
                            id="country"
                            type="text"
                            value={shippingCountry}
                            onChange={(event) =>
                                setShippingCountry(
                                    event.target.value
                                )
                            }
                            required
                        />
                    </div>

                    <br />

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Placing Order..."
                            : "Place Order"}
                    </button>

                </form>
            )}

            {order && (
                <div>
                    <h2>Order Created</h2>

                    <p>
                        <strong>
                            Order ID:
                        </strong>{" "}
                        {order.id}
                    </p>

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

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/orders")
                        }
                    >
                        View My Orders
                    </button>
                </div>
            )}
        </div>
    );
}

export default Checkout;