import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE_URL = "https://nicecomm-api-gateway.onrender.com";

function Warehouse() {
    const { token } = useAuth();

    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [capacity, setCapacity] = useState("");
    const [availableUnits, setAvailableUnits] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchWarehouseData = async () => {
        try {
            setLoading(true);
            setError("");

            const profileResponse = await fetch(
                `${API_BASE_URL}/api/warehouse/me`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const profileData = await profileResponse.json();

            if (!profileResponse.ok) {
                throw new Error(
                    profileData.message ||
                        "Failed to fetch warehouse profile"
                );
            }

            setProfile(profileData.profile);

            setCapacity(
                profileData.profile.capacity_units ?? ""
            );

            setAvailableUnits(
                profileData.profile.available_units ?? ""
            );

            const ordersResponse = await fetch(
                `${API_BASE_URL}/api/warehouse/assigned-orders`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const ordersData = await ordersResponse.json();

            if (!ordersResponse.ok) {
                throw new Error(
                    ordersData.message ||
                        "Failed to fetch assigned orders"
                );
            }

            setOrders(ordersData.assignments || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchWarehouseData();
        }
    }, [token]);

 const handleCapacityUpdate = async (event) => {
    event.preventDefault();

    try {
        setSaving(true);
        setError("");
        setSuccess("");

        const capacityNumber = Number(capacity);
        const availableUnitsNumber = Number(availableUnits);

        if (
            !Number.isInteger(capacityNumber) ||
            capacityNumber < 0
        ) {
            throw new Error(
                "Capacity must be a non-negative integer"
            );
        }

        if (
            !Number.isInteger(availableUnitsNumber) ||
            availableUnitsNumber < 0
        ) {
            throw new Error(
                "Available units must be a non-negative integer"
            );
        }

        if (availableUnitsNumber > capacityNumber) {
            throw new Error(
                "Available units cannot exceed capacity units"
            );
        }

        const response = await fetch(
            `${API_BASE_URL}/api/warehouse/me/capacity`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    capacity: capacityNumber,
                    available_units:
                        availableUnitsNumber,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                    "Failed to update warehouse capacity"
            );
        }

        setSuccess(
            "Warehouse capacity updated successfully."
        );

        // Refresh profile and assigned orders
        await fetchWarehouseData();

    } catch (err) {
        setError(err.message);
    } finally {
        setSaving(false);
    }
};

    if (loading) {
        return <p>Loading warehouse...</p>;
    }

    return (
        <div>
            <h1>Warehouse Dashboard</h1>

            <p>
                Manage your Warehouse Provider profile,
                capacity and assigned orders.
            </p>

            {error && <p>{error}</p>}
            {success && <p>{success}</p>}

            <hr />

            <h2>Warehouse Profile</h2>

            {profile && (
                <div>
                    <p>
                        <strong>Company:</strong>{" "}
                        {profile.company_name}
                    </p>

                    <p>
                        <strong>Contact Person:</strong>{" "}
                        {profile.contact_person}
                    </p>

                    <p>
                        <strong>Email:</strong>{" "}
                        {profile.email}
                    </p>

                    <p>
                        <strong>Phone:</strong>{" "}
                        {profile.phone || "-"}
                    </p>

                    <p>
                        <strong>City:</strong>{" "}
                        {profile.city}
                    </p>

                    <p>
                        <strong>State:</strong>{" "}
                        {profile.state}
                    </p>

                    <p>
                        <strong>Status:</strong>{" "}
                        {profile.status}
                    </p>
                </div>
            )}

            <hr />

            <h2>Warehouse Capacity</h2>

            <form onSubmit={handleCapacityUpdate}>
                <div>
                    <label htmlFor="capacity">
                        Capacity Units
                    </label>
                    <br />

                    <input
                        id="capacity"
                        type="number"
                        min="0"
                        value={capacity}
                        onChange={(event) =>
                            setCapacity(event.target.value)
                        }
                        required
                    />
                </div>

                <br />

                <div>
                    <label htmlFor="availableUnits">
                        Available Units
                    </label>
                    <br />

                    <input
                        id="availableUnits"
                        type="number"
                        min="0"
                        value={availableUnits}
                        onChange={(event) =>
                            setAvailableUnits(
                                event.target.value
                            )
                        }
                        required
                    />
                </div>

                <br />

                <button
                    type="submit"
                    disabled={saving}
                >
                    {saving
                        ? "Saving..."
                        : "Update Capacity"}
                </button>
            </form>

            <hr />

            <h2>Assigned Orders</h2>

            {orders.length === 0 ? (
                <p>No assigned orders found.</p>
            ) : (
                <div>
                    {orders.map((order) => (
                        <div key={order.assignment_id}>
                            <p>
                                <strong>
                                    Assignment ID:
                                </strong>{" "}
                                {order.assignment_id}
                            </p>

                            <p>
                                <strong>
                                    Order ID:
                                </strong>{" "}
                                {order.order_id}
                            </p>

                            <p>
                                <strong>
                                    Order Number:
                                </strong>{" "}
                                {order.order_number}
                            </p>

                            <p>
                                <strong>
                                    Company:
                                </strong>{" "}
                                {order.company_name}
                            </p>

                            <p>
                                <strong>
                                    Assignment Status:
                                </strong>{" "}
                                {order.assignment_status}
                            </p>

                            <p>
                                <strong>
                                    Order Status:
                                </strong>{" "}
                                {order.order_status}
                            </p>

                            <hr />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Warehouse;
