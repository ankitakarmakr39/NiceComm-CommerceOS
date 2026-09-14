import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE_URL = "https://nicecomm-api-gateway.onrender.com";

function Logistics() {
    const { token } = useAuth();

    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState([]);

    const [serviceAreas, setServiceAreas] = useState("");
    const [vehicleTypes, setVehicleTypes] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const [profileResponse, ordersResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/api/logistics/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),
                fetch(`${API_BASE_URL}/api/logistics/assigned-orders`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),
            ]);

            const profileData = await profileResponse.json();
            const ordersData = await ordersResponse.json();

            if (!profileResponse.ok) {
                throw new Error(
                    profileData.message ||
                        "Failed to fetch logistics profile"
                );
            }

            if (!ordersResponse.ok) {
                throw new Error(
                    ordersData.message ||
                        "Failed to fetch assigned orders"
                );
            }

            setProfile(profileData.profile || null);
            setOrders(ordersData.assignments || []);

            setServiceAreas(
                Array.isArray(profileData.profile?.service_areas)
                    ? profileData.profile.service_areas.join(", ")
                    : ""
            );

            setVehicleTypes(
                Array.isArray(profileData.profile?.vehicle_types)
                    ? profileData.profile.vehicle_types.join(", ")
                    : ""
            );
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const handleSave = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
        setSaving(true);

        const payload = {
            service_areas: serviceAreas
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),

            vehicle_types: vehicleTypes
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
        };

        const response = await fetch(
            `${API_BASE_URL}/api/logistics/me`,
            {
                method: "PATCH",
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
                data.message ||
                    "Failed to update logistics profile"
            );
        }

        setSuccess(
            "Logistics profile updated successfully."
        );

        // Fetch the latest profile from the backend
        await fetchData();

    } catch (err) {
        setError(err.message);
    } finally {
        setSaving(false);
    }
};

    if (loading) {
        return <p>Loading logistics profile...</p>;
    }

    return (
        <div>
            <h1>Logistics Provider</h1>

            <p>
                Manage your logistics profile, service areas,
                vehicle types and assigned orders.
            </p>

            {error && (
                <div
                    style={{
                        padding: "10px",
                        marginBottom: "15px",
                        border: "1px solid #dc2626",
                    }}
                >
                    {error}
                </div>
            )}

            {success && (
                <div
                    style={{
                        padding: "10px",
                        marginBottom: "15px",
                        border: "1px solid #16a34a",
                    }}
                >
                    {success}
                </div>
            )}

            <hr />

            <h2>Logistics Profile</h2>

            {profile ? (
                <div
                    style={{
                        border: "1px solid #ccc",
                        padding: "15px",
                        marginBottom: "20px",
                    }}
                >
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
                        {profile.phone}
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

                    <p>
                        <strong>Participant Type:</strong>{" "}
                        {profile.participant_type}
                    </p>
                </div>
            ) : (
                <p>No logistics profile found.</p>
            )}

            <h2>Service Areas & Vehicle Types</h2>

            <form onSubmit={handleSave}>
                <div style={{ marginBottom: "12px" }}>
                    <label>
                        <strong>Service Areas</strong>
                    </label>

                    <br />

                    <input
                        type="text"
                        value={serviceAreas}
                        onChange={(e) =>
                            setServiceAreas(e.target.value)
                        }
                        placeholder="Example: Naihati, Kolkata, Howrah"
                        style={{
                            width: "100%",
                            maxWidth: "600px",
                        }}
                    />

                    <p>
                        Enter multiple areas separated by commas.
                    </p>
                </div>

                <div style={{ marginBottom: "12px" }}>
                    <label>
                        <strong>Vehicle Types</strong>
                    </label>

                    <br />

                    <input
                        type="text"
                        value={vehicleTypes}
                        onChange={(e) =>
                            setVehicleTypes(e.target.value)
                        }
                        placeholder="Example: Bike, Van, Truck"
                        style={{
                            width: "100%",
                            maxWidth: "600px",
                        }}
                    />

                    <p>
                        Enter multiple vehicle types separated by
                        commas.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                >
                    {saving
                        ? "Saving..."
                        : "Save Logistics Profile"}
                </button>
            </form>

            <hr />

            <h2>Assigned Orders</h2>

            {orders.length === 0 ? (
                <p>No assigned orders found.</p>
            ) : (
                <div>
                    {orders.map((order) => (
                        <div
                            key={order.assignment_id}
                            style={{
                                border: "1px solid #ccc",
                                padding: "15px",
                                marginBottom: "12px",
                            }}
                        >
                            <h3>
                                Order #{order.order_id}
                            </h3>

                            <p>
                                <strong>Order Number:</strong>{" "}
                                {order.order_number}
                            </p>

                            <p>
                                <strong>Assignment Status:</strong>{" "}
                                {order.assignment_status}
                            </p>

                            <p>
                                <strong>Order Status:</strong>{" "}
                                {order.order_status}
                            </p>

                            <p>
                                <strong>Company:</strong>{" "}
                                {order.company_name}
                            </p>

                            <p>
                                <strong>Participant Type:</strong>{" "}
                                {order.participant_type}
                            </p>

                            {order.notes && (
                                <p>
                                    <strong>Notes:</strong>{" "}
                                    {order.notes}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Logistics;
