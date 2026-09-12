import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:4000";

export default function Compliance() {
    const [compliance, setCompliance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchCompliance = async () => {
            try {
                const token = localStorage.getItem("nicecomm_token");

                const response = await fetch(
                    `${API_BASE}/api/compliance/me`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Failed to fetch compliance status"
                    );
                }

                setCompliance(data.compliance);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCompliance();
    }, []);

    if (loading) {
        return <div>Loading compliance status...</div>;
    }

    if (error) {
        return (
            <div>
                <h2>Compliance</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div>
            <h1>Compliance</h1>

            <p>
                View your current compliance verification status.
            </p>

            <section>
                <h2>Compliance Status</h2>

                <p>
                    <strong>Company:</strong>{" "}
                    {compliance.company_name}
                </p>

                <p>
                    <strong>Participant Type:</strong>{" "}
                    {compliance.participant_type}
                </p>

                <p>
                    <strong>Verification Status:</strong>{" "}
                    {compliance.verification_status}
                </p>

                <p>
                    <strong>Verification Notes:</strong>{" "}
                    {compliance.verification_notes || "—"}
                </p>

                <p>
                    <strong>Verified At:</strong>{" "}
                    {compliance.verified_at
                        ? new Date(
                              compliance.verified_at
                          ).toLocaleString()
                        : "Not verified yet"}
                </p>
            </section>
        </div>
    );
}