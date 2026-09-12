import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:4000";

const Repair = () => {
    const [profile, setProfile] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const token = localStorage.getItem("nicecomm_token");

    const fetchRepairData = async () => {
        try {
            setLoading(true);
            setError("");

            const headers = {
                Authorization: `Bearer ${token}`,
            };

            const [profileResponse, assignmentsResponse] =
                await Promise.all([
                    fetch(`${API_BASE}/api/repair/me`, {
                        headers,
                    }),
                    fetch(`${API_BASE}/api/repair/assigned-repairs`, {
                        headers,
                    }),
                ]);

            const profileData = await profileResponse.json();
            const assignmentsData = await assignmentsResponse.json();

            if (!profileResponse.ok) {
                throw new Error(
                    profileData.message ||
                        "Failed to fetch repair profile"
                );
            }

            if (!assignmentsResponse.ok) {
                throw new Error(
                    assignmentsData.message ||
                        "Failed to fetch assigned repairs"
                );
            }

            setProfile(profileData.profile || null);
            setAssignments(assignmentsData.assignments || []);
        } catch (err) {
            console.error("Repair fetch error:", err);
            setError(
                err.message || "Failed to load repair information"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRepairData();
    }, []);

    if (loading) {
        return (
            <div style={styles.page}>
                <h1>Repair Partner</h1>
                <p>Loading repair information...</p>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>
                        Repair Partner
                    </h1>

                    <p style={styles.subtitle}>
                        Manage your repair profile and assigned repair jobs.
                    </p>
                </div>
            </div>

            {error && (
                <div style={styles.error}>
                    {error}
                </div>
            )}

            {/* Repair Profile */}
            <section style={styles.card}>
                <h2 style={styles.cardTitle}>
                    Repair Profile
                </h2>

                {profile ? (
                    <>
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
                                <strong>Postal Code:</strong>{" "}
                                {profile.postal_code || "—"}
                            </div>

                            <div>
                                <strong>Status:</strong>{" "}
                                {profile.participant_status || "—"}
                            </div>

                            <div>
                                <strong>Participant Type:</strong>{" "}
                                {profile.participant_type ||
                                    "Repair Partner"}
                            </div>
                        </div>

                        <div style={styles.infoSection}>
                            <h3 style={styles.subTitle}>
                                Service Areas
                            </h3>

                            <div style={styles.tags}>
                                {Array.isArray(profile.service_areas) &&
                                profile.service_areas.length > 0 ? (
                                    profile.service_areas.map(
                                        (area, index) => (
                                            <span
                                                key={index}
                                                style={styles.tag}
                                            >
                                                {area}
                                            </span>
                                        )
                                    )
                                ) : (
                                    <span>—</span>
                                )}
                            </div>
                        </div>

                        <div style={styles.infoSection}>
                            <h3 style={styles.subTitle}>
                                Services
                            </h3>

                            <div style={styles.tags}>
                                {Array.isArray(profile.services) &&
                                profile.services.length > 0 ? (
                                    profile.services.map(
                                        (service, index) => (
                                            <span
                                                key={index}
                                                style={styles.tag}
                                            >
                                                {service}
                                            </span>
                                        )
                                    )
                                ) : (
                                    <span>—</span>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <p>No repair profile found.</p>
                )}
            </section>

            {/* Assigned Repairs */}
            <section style={styles.card}>
                <div style={styles.sectionHeader}>
                    <div>
                        <h2 style={styles.cardTitle}>
                            Assigned Repairs
                        </h2>

                        <p style={styles.sectionText}>
                            Repair jobs assigned to your organization.
                        </p>
                    </div>

                    <div style={styles.countBadge}>
                        {assignments.length}
                    </div>
                </div>

                {assignments.length === 0 ? (
                    <div style={styles.empty}>
                        No repairs assigned yet.
                    </div>
                ) : (
                    <div style={styles.assignmentList}>
                        {assignments.map((assignment) => (
                            <div
                                key={assignment.assignment_id}
                                style={styles.assignmentCard}
                            >
                                <div style={styles.assignmentHeader}>
                                    <h3 style={styles.assignmentTitle}>
                                        Repair #{assignment.assignment_id}
                                    </h3>

                                    <span
                                        style={{
                                            ...styles.status,
                                            ...(assignment.status ===
                                            "Completed"
                                                ? styles.statusCompleted
                                                : assignment.status ===
                                                  "In Progress"
                                                ? styles.statusProgress
                                                : styles.statusAssigned),
                                        }}
                                    >
                                        {assignment.status ||
                                            "Assigned"}
                                    </span>
                                </div>

                                <div style={styles.details}>
                                    <div>
                                        <strong>Order ID:</strong>{" "}
                                        #{assignment.order_id || "—"}
                                    </div>

                                    <div>
                                        <strong>Order Number:</strong>{" "}
                                        {assignment.order_number ||
                                            "—"}
                                    </div>

                                    <div>
                                        <strong>Participant:</strong>{" "}
                                        {assignment.company_name ||
                                            "—"}
                                    </div>

                                    <div>
                                        <strong>Participant Type:</strong>{" "}
                                        {assignment.participant_type ||
                                            "Repair Partner"}
                                    </div>

                                    <div>
                                        <strong>Repair Notes:</strong>{" "}
                                        {assignment.repair_notes ||
                                            "—"}
                                    </div>

                                    <div>
                                        <strong>Assigned:</strong>{" "}
                                        {assignment.assigned_at
                                            ? new Date(
                                                  assignment.assigned_at
                                              ).toLocaleString()
                                            : "—"}
                                    </div>

                                    {assignment.completed_at && (
                                        <div>
                                            <strong>Completed:</strong>{" "}
                                            {new Date(
                                                assignment.completed_at
                                            ).toLocaleString()}
                                        </div>
                                    )}

                                    <div>
                                        <strong>Order Status:</strong>{" "}
                                        {assignment.order_status ||
                                            "—"}
                                    </div>

                                    <div>
                                        <strong>Total Amount:</strong>{" "}
                                        ₹
                                        {assignment.total_amount ||
                                            "0.00"}
                                    </div>
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
        gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
        gap: "16px",
        lineHeight: "1.6",
    },

    infoSection: {
        marginTop: "24px",
    },

    subTitle: {
        marginBottom: "12px",
    },

    tags: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
    },

    tag: {
        padding: "7px 12px",
        background: "#f1f1f1",
        borderRadius: "20px",
        fontSize: "14px",
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

    assignmentList: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },

    assignmentCard: {
        border: "1px solid #e1e1e1",
        borderRadius: "8px",
        padding: "18px",
        background: "#fafafa",
    },

    assignmentHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "15px",
    },

    assignmentTitle: {
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
};

export default Repair;