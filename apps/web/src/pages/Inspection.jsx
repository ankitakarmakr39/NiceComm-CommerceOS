import React, { useEffect, useState } from "react";

const API_BASE = "https://nicecomm-api-gateway.onrender.com";

const Inspection = () => {
    const [profile, setProfile] = useState(null);
    const [inspections, setInspections] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const token = localStorage.getItem("nicecomm_token");

    const fetchInspectionData = async () => {
        try {
            setLoading(true);
            setError("");

            const headers = {
                Authorization: `Bearer ${token}`,
            };

            const [profileResponse, inspectionResponse] = await Promise.all([
                fetch(`${API_BASE}/api/inspection/me`, {
                    headers,
                }),
                fetch(`${API_BASE}/api/inspection/assigned-inspections`, {
                    headers,
                }),
            ]);

            const profileData = await profileResponse.json();
            const inspectionData = await inspectionResponse.json();

            if (!profileResponse.ok) {
                throw new Error(
                    profileData.message || "Failed to fetch inspection profile"
                );
            }

            if (!inspectionResponse.ok) {
                throw new Error(
                    inspectionData.message ||
                        "Failed to fetch assigned inspections"
                );
            }

            setProfile(profileData.profile || null);
            setInspections(inspectionData.inspections || []);
        } catch (err) {
            console.error("Inspection fetch error:", err);
            setError(err.message || "Failed to load inspection data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInspectionData();
    }, []);

    if (loading) {
        return (
            <div style={styles.page}>
                <h1>Inspection Partner</h1>
                <p>Loading inspection information...</p>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Inspection Partner</h1>
                    <p style={styles.subtitle}>
                        Manage your inspection profile and assigned inspections.
                    </p>
                </div>
            </div>

            {error && (
                <div style={styles.error}>
                    {error}
                </div>
            )}

            {success && (
                <div style={styles.success}>
                    {success}
                </div>
            )}

            {/* Profile */}
            <section style={styles.card}>
                <h2 style={styles.cardTitle}>Inspection Profile</h2>

                {profile ? (
                    <div style={styles.profileGrid}>
                        <div>
                            <strong>Company:</strong>{" "}
                            {profile.company_name || "—"}
                        </div>

                        <div>
                            <strong>Contact Person:</strong>{" "}
                            {profile.contact_person || "—"}
                        </div>

                        <div>
                            <strong>Email:</strong>{" "}
                            {profile.email || "—"}
                        </div>

                        <div>
                            <strong>Phone:</strong>{" "}
                            {profile.phone || "—"}
                        </div>

                        <div>
                            <strong>City:</strong>{" "}
                            {profile.city || "—"}
                        </div>

                        <div>
                            <strong>State:</strong>{" "}
                            {profile.state || "—"}
                        </div>

                        <div>
                            <strong>Status:</strong>{" "}
                            {profile.participant_status || "—"}
                        </div>

                        <div>
                            <strong>Participant Type:</strong>{" "}
                            {profile.participant_type || "Inspection Partner"}
                        </div>
                    </div>
                ) : (
                    <p>No inspection profile found.</p>
                )}
            </section>

            {/* Assigned Inspections */}
            <section style={styles.card}>
                <div style={styles.sectionHeader}>
                    <div>
                        <h2 style={styles.cardTitle}>
                            Assigned Inspections
                        </h2>

                        <p style={styles.sectionText}>
                            Inspections assigned to your organization.
                        </p>
                    </div>

                    <div style={styles.countBadge}>
                        {inspections.length}
                    </div>
                </div>

                {inspections.length === 0 ? (
                    <div style={styles.empty}>
                        No inspections assigned yet.
                    </div>
                ) : (
                    <div style={styles.inspectionList}>
                        {inspections.map((inspection) => (
                            <div
                                key={inspection.assignment_id}
                                style={styles.inspectionCard}
                            >
                                <div style={styles.inspectionHeader}>
                                    <h3 style={styles.inspectionTitle}>
                                        Inspection #{inspection.assignment_id}
                                    </h3>

                                    <span
                                        style={{
                                            ...styles.status,
                                            ...(inspection.inspection_status === "Completed"
                                                ? styles.statusCompleted
                                                :inspection.inspection_status === "In Progress"
                                                ? styles.statusProgress
                                                : styles.statusAssigned),
                                        }}
                                    >
                                       {inspection.inspection_status || "Assigned"}
                                    </span>
                                </div>

                                <div style={styles.details}>
                                    <div>
                                        <strong>Order ID:</strong>{" "}
                                        #{inspection.order_id || "—"}
                                    </div>

                                    <div>
                                        <strong>Participant:</strong>{" "}
                                        {inspection.company_name || "—"}
                                    </div>

                                    <div>
                                        <strong>Role:</strong>{" "}
                                        {inspection.participant_type || "Inspection Partner"}
                                    </div>

                                    {inspection.inspection_notes && (
                                        <div>
                                            <strong>Notes:</strong>{" "}
                                            {inspection.inspection_notes}
                                        </div>
                                    )}

                                    {inspection.assigned_at && (
                                        <div>
                                            <strong>Assigned:</strong>{" "}
                                            {new Date(
                                                inspection.assigned_at
                                            ).toLocaleString()}
                                        </div>
                                    )}

                                    {inspection.completed_at && (
                                        <div>
                                            <strong>Completed:</strong>{" "}
                                            {new Date(
                                                inspection.completed_at
                                            ).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

const styles = {
    page: {
        padding: "30px",
        maxWidth: "1200px",
        margin: "0 auto",
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "25px",
    },

    title: {
        margin: 0,
        fontSize: "30px",
    },

    subtitle: {
        marginTop: "8px",
        color: "#666",
    },

    card: {
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: "10px",
        padding: "24px",
        marginBottom: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    },

    cardTitle: {
        marginTop: 0,
        marginBottom: "18px",
    },

    profileGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "16px",
        lineHeight: "1.6",
    },

    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
    },

    sectionText: {
        margin: 0,
        color: "#666",
    },

    countBadge: {
        minWidth: "36px",
        height: "36px",
        borderRadius: "50%",
        background: "#f1f1f1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
    },

    inspectionList: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },

    inspectionCard: {
        border: "1px solid #e1e1e1",
        borderRadius: "8px",
        padding: "18px",
        background: "#fafafa",
    },

    inspectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "15px",
    },

    inspectionTitle: {
        margin: 0,
    },

    status: {
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "600",
    },

    statusAssigned: {
        background: "#fff3cd",
        color: "#856404",
    },

    statusProgress: {
        background: "#cfe2ff",
        color: "#084298",
    },

    statusCompleted: {
        background: "#d1e7dd",
        color: "#0f5132",
    },

    details: {
        display: "grid",
        gap: "9px",
        color: "#444",
    },

    empty: {
        padding: "30px",
        textAlign: "center",
        color: "#777",
        background: "#fafafa",
        borderRadius: "8px",
    },

    error: {
        background: "#f8d7da",
        color: "#842029",
        padding: "12px 16px",
        borderRadius: "8px",
        marginBottom: "20px",
    },

    success: {
        background: "#d1e7dd",
        color: "#0f5132",
        padding: "12px 16px",
        borderRadius: "8px",
        marginBottom: "20px",
    },
};

export default Inspection;
