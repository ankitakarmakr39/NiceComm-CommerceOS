import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE_URL = "https://nicecomm-api-gateway.onrender.com";

function Affiliate() {
    const { token } = useAuth();

    const [profile, setProfile] = useState(null);
    const [commissions, setCommissions] = useState([]);

    const [referralCode, setReferralCode] = useState("");
    const [commissionRate, setCommissionRate] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const [profileResponse, commissionsResponse] =
                await Promise.all([
                    fetch(`${API_BASE_URL}/api/affiliate/me`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                    fetch(`${API_BASE_URL}/api/affiliate/commissions`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                ]);

            const profileData = await profileResponse.json();
            const commissionsData =
                await commissionsResponse.json();

            if (!profileResponse.ok) {
                throw new Error(
                    profileData.message ||
                    "Failed to fetch affiliate profile"
                );
            }

            if (!commissionsResponse.ok) {
                throw new Error(
                    commissionsData.message ||
                    "Failed to fetch commissions"
                );
            }

            setProfile(profileData.profile || null);
            setCommissions(
                commissionsData.commissions || []
            );

            setReferralCode(
                profileData.profile?.referral_code || ""
            );

            setCommissionRate(
                profileData.profile?.commission_rate !== null &&
                    profileData.profile?.commission_rate !== undefined
                    ? String(
                        profileData.profile.commission_rate
                    )
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

        if (!referralCode.trim()) {
            setError("Referral code is required.");
            return;
        }

        if (
            commissionRate === "" ||
            Number.isNaN(Number(commissionRate)) ||
            Number(commissionRate) < 0
        ) {
            setError(
                "Commission rate must be a valid non-negative number."
            );
            return;
        }

        try {
            setSaving(true);

            const response = await fetch(
                `${API_BASE_URL}/api/affiliate/me`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        referral_code: referralCode.trim(),
                        commission_rate: Number(
                            commissionRate
                        ),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to update affiliate profile"
                );
            }

            setProfile(data.profile || profile);

            setSuccess(
                "Affiliate profile updated successfully."
            );
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p>Loading affiliate profile...</p>;
    }

    return (
        <div>
            <h1>Affiliate Partner</h1>

            <p>
                Manage your affiliate profile, referral code,
                commission rate and commission history.
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

            <h2>Affiliate Profile</h2>

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
                <p>No affiliate profile found.</p>
            )}

            <h2>Affiliate Settings</h2>

            <form onSubmit={handleSave}>
                <div style={{ marginBottom: "12px" }}>
                    <label>
                        <strong>Referral Code</strong>
                    </label>

                    <br />

                    <input
                        type="text"
                        value={referralCode}
                        onChange={(e) =>
                            setReferralCode(e.target.value)
                        }
                        placeholder="Example: NICEAFF2026"
                    />
                </div>

                <div style={{ marginBottom: "12px" }}>
                    <label>
                        <strong>Commission Rate (%)</strong>
                    </label>

                    <br />

                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={commissionRate}
                        onChange={(e) =>
                            setCommissionRate(
                                e.target.value
                            )
                        }
                        placeholder="Example: 8.5"
                    />
                </div>

                <button
                    type="submit"
                    disabled={saving}
                >
                    {saving
                        ? "Saving..."
                        : "Save Affiliate Profile"}
                </button>
            </form>

            <hr />

            <h2>Commission History</h2>

            {commissions.length === 0 ? (
                <p>No commission records found.</p>
            ) : (
                <div>
                    {commissions.map((commission) => (
                        <div
                            key={commission.id}
                            style={{
                                border: "1px solid #ccc",
                                padding: "15px",
                                marginBottom: "12px",
                            }}
                        >
                            <h3>
                                Commission #{commission.id}
                            </h3>

                            <p>
                                <strong>Order ID:</strong>{" "}
                                #{commission.order_id}
                            </p>

                            <p>
                                <strong>Commission Amount:</strong>{" "}
                                {commission.amount}
                            </p>

                            <p>
                                <strong>Status:</strong>{" "}
                                {commission.status}
                            </p>

                            {commission.created_at && (
                                <p>
                                    <strong>Created:</strong>{" "}
                                    {new Date(
                                        commission.created_at
                                    ).toLocaleString()}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Affiliate;
