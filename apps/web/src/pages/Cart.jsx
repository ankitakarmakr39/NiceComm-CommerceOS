import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE_URL = "https://nicecomm-api-gateway.onrender.com";

function Cart() {
    const { token } = useAuth();

    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingItemId, setUpdatingItemId] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchCart = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_BASE_URL}/api/cart`,
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
                    data.message || "Failed to fetch cart"
                );
            }

            setCart({
                ...data.cart,
                items: data.items || [],
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchCart();
        }
    }, [token]);

    const updateQuantity = async (item, newQuantity) => {
        if (!Number.isInteger(newQuantity) || newQuantity < 1) {
            setError("Quantity must be at least 1.");
            return;
        }

        if (newQuantity > Number(item.stock_quantity)) {
            setError("Quantity cannot exceed available stock.");
            return;
        }

        try {
            setUpdatingItemId(item.id);
            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_BASE_URL}/api/cart/items/${item.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        quantity: newQuantity,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to update quantity"
                );
            }

            await fetchCart();

            setSuccess("Cart quantity updated successfully.");
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingItemId(null);
        }
    };

    const removeItem = async (itemId) => {
        try {
            setUpdatingItemId(itemId);
            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_BASE_URL}/api/cart/items/${itemId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to remove item"
                );
            }

            await fetchCart();

            setSuccess("Item removed from cart successfully.");
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingItemId(null);
        }
    };

    if (loading) {
        return <p>Loading cart...</p>;
    }

    if (error && !cart) {
        return <p>{error}</p>;
    }

    const items = cart?.items || [];

    const total = items.reduce(
        (sum, item) =>
            sum +
            Number(item.retail_price) *
            Number(item.quantity),
        0
    );

    return (
        <div>
            <h1>My Cart</h1>

            {error && <p>{error}</p>}
            {success && <p>{success}</p>}

            {items.length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <div>
                    {items.map((item) => {
                        const lineTotal =
                            Number(item.retail_price) *
                            Number(item.quantity);

                        const isUpdating =
                            updatingItemId === item.id;

                        return (
                            <div key={item.id}>
                                <h2>{item.name}</h2>

                                <p>SKU: {item.sku}</p>

                                <p>
                                    Seller: {item.seller_company_name}
                                </p>

                                <p>
                                    Unit Price: ₹
                                    {Number(item.retail_price).toFixed(2)}
                                </p>

                                <p>
                                    Stock Available:{" "}
                                    {item.stock_quantity}
                                </p>

                                <div className="nice-cart-quantity">
                                    <label htmlFor={`quantity-${item.id}`}>
                                        Quantity:
                                    </label>

                                    <div className="nice-cart-quantity-controls">
                                        <button
                                            type="button"
                                            disabled={
                                                isUpdating ||
                                                Number(item.quantity) <= 1
                                            }
                                            onClick={() =>
                                                updateQuantity(
                                                    item,
                                                    Number(item.quantity) - 1
                                                )
                                            }
                                        >
                                            -
                                        </button>

                                        <input
                                            id={`quantity-${item.id}`}
                                            type="number"
                                            min="1"
                                            max={item.stock_quantity}
                                            value={item.quantity}
                                            disabled={isUpdating}
                                            onChange={(event) => {
                                                const value = Number(
                                                    event.target.value
                                                );

                                                if (
                                                    Number.isInteger(value) &&
                                                    value >= 1
                                                ) {
                                                    updateQuantity(item, value);
                                                }
                                            }}
                                        />

                                        <button
                                            type="button"
                                            disabled={
                                                isUpdating ||
                                                Number(item.quantity) >=
                                                Number(item.stock_quantity)
                                            }
                                            onClick={() =>
                                                updateQuantity(
                                                    item,
                                                    Number(item.quantity) + 1
                                                )
                                            }
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>


                                <p>
                                    Line Total: ₹
                                    {lineTotal.toFixed(2)}
                                </p>

                                <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => removeItem(item.id)}
                                >
                                    {isUpdating ? "Removing..." : "Remove"}
                                </button>

                                <hr />


                            </div>
                        );
                    })}

                    <h2>
                        Cart Total: ₹{total.toFixed(2)}
                    </h2>
                    <button
                        type="button"
                        onClick={() => {
                            window.location.href = "/checkout";
                        }}
                    >
                        Proceed to Checkout
                    </button>
                </div>
            )}
        </div>
    );
}

export default Cart;
