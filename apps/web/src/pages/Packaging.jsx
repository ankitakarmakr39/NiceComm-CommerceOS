import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE_URL = "http://localhost:4000";

function Packaging() {
    const { token } = useAuth();

    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState([]);

    const [capacity, setCapacity] = useState("");
    const [packagingTypes, setPackagingTypes] = useState("");

    const [loading, setLoading] = useState(true);
    const [savingCapacity, setSavingCapacity] = useState(false);
    const [savingTypes, setSavingTypes] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchPackagingData = async () => {
        try {
            setLoading(true);
            setError("");

            const profileResponse = await fetch(
                `${API_BASE_URL}/api/packaging/me`,
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
                        "Failed to fetch packaging profile"
                );
            }

            setProfile(profileData.profile);

            setCapacity(
                profileData.profile.capacity_units ?? ""
            );

            const existingTypes =
                Array.isArray(
                    profileData.profile.packaging_types
                )
                    ? profileData.profile.packaging_types
                    : [];

            setPackagingTypes(existingTypes.join(", "));

            const ordersResponse = await fetch(
                `${API_BASE_URL}/api/packaging/assigned-orders`,
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
            fetchPackagingData();
        }
    }, [token]);

    const handleCapacityUpdate = async (event) => {
        event.preventDefault();

        try {
            setSavingCapacity(true);
            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_BASE_URL}/api/packaging/me/capacity`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        capacity: Number(capacity),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to update packaging capacity"
                );
            }

            setSuccess(
                "Packaging capacity updated successfully."
            );

            await fetchPackagingData();
        } catch (err) {
            setError(err.message);
        } finally {
            setSavingCapacity(false);
        }
    };

    const handleTypesUpdate = async (event) => {
        event.preventDefault();

        try {
            setSavingTypes(true);
            setError("");
            setSuccess("");

            const types = packagingTypes
                .split(",")
                .map((type) => type.trim())
                .filter(Boolean);

            const response = await fetch(
                `${API_BASE_URL}/api/packaging/me/types`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        packaging_types: types,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to update packaging types"
                );
            }

            setSuccess(
                "Packaging types updated successfully."
            );

            await fetchPackagingData();
        } catch (err) {
            setError(err.message);
        } finally {
            setSavingTypes(false);
        }
    };

    if (loading) {
        return <p>Loading packaging...</p>;
    }

    return (
        <div>
            <h1>Packaging Dashboard</h1>

            <p>
                Manage your Packaging Provider profile,
                capacity, packaging types and assigned orders.
            </p>

            {error && <p>{error}</p>}
            {success && <p>{success}</p>}

            <hr />

            <h2>Packaging Profile</h2>

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
                        {profile.participant_status}
                    </p>
                </div>
            )}

            <hr />

            <h2>Packaging Capacity</h2>

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

                <button
                    type="submit"
                    disabled={savingCapacity}
                >
                    {savingCapacity
                        ? "Saving..."
                        : "Update Capacity"}
                </button>
            </form>

            <hr />

            <h2>Packaging Types</h2>

            <form onSubmit={handleTypesUpdate}>
                <div>
                    <label htmlFor="packagingTypes">
                        Packaging Types
                    </label>
                    <br />

                    <input
                        id="packagingTypes"
                        type="text"
                        value={packagingTypes}
                        onChange={(event) =>
                            setPackagingTypes(
                                event.target.value
                            )
                        }
                        placeholder="Carton Box, Bubble Wrap, Wooden Crate"
                    />
                </div>

                <br />

                <p>
                    Enter multiple packaging types separated
                    by commas.
                </p>

                <button
                    type="submit"
                    disabled={savingTypes}
                >
                    {savingTypes
                        ? "Saving..."
                        : "Update Packaging Types"}
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

export default Packaging;