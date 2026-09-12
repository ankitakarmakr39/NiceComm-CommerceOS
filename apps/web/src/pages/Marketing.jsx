import { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:4000";

function Marketing() {
    const [profile, setProfile] = useState(null);
    const [services, setServices] = useState("");

    const [clients, setClients] = useState([]);
    const [clientName, setClientName] = useState("");
    const [clientEmail, setClientEmail] = useState("");

    const [campaigns, setCampaigns] = useState([]);
    const [campaignName, setCampaignName] = useState("");
    const [campaignStatus, setCampaignStatus] = useState("Planned");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const getToken = () => {
        return localStorage.getItem("nicecomm_token");
    };

    const authHeaders = () => ({
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
    });

    const loadMarketingData = async () => {
        try {
            setLoading(true);
            setError("");
            setMessage("");

            const [profileResponse, clientsResponse, campaignsResponse] =
                await Promise.all([
                    fetch(`${API_BASE_URL}/api/marketing/me`, {
                        headers: authHeaders(),
                    }),
                    fetch(`${API_BASE_URL}/api/marketing/clients`, {
                        headers: authHeaders(),
                    }),
                    fetch(`${API_BASE_URL}/api/marketing/campaigns`, {
                        headers: authHeaders(),
                    }),
                ]);

            const profileData = await profileResponse.json();
            const clientsData = await clientsResponse.json();
            const campaignsData = await campaignsResponse.json();

            if (!profileResponse.ok) {
                throw new Error(
                    profileData.message || "Failed to fetch marketing profile"
                );
            }

            if (!clientsResponse.ok) {
                throw new Error(
                    clientsData.message || "Failed to fetch marketing clients"
                );
            }

            if (!campaignsResponse.ok) {
                throw new Error(
                    campaignsData.message || "Failed to fetch marketing campaigns"
                );
            }

            setProfile(profileData.profile);

            const existingServices = profileData.profile?.services;

            if (Array.isArray(existingServices)) {
                setServices(existingServices.join(", "));
            } else if (existingServices) {
                setServices(String(existingServices));
            } else {
                setServices("");
            }

            setClients(clientsData.clients || []);
            setCampaigns(campaignsData.campaigns || []);
        } catch (err) {
            setError(err.message || "Failed to load marketing data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMarketingData();
    }, []);

    const updateProfile = async (event) => {
        event.preventDefault();

        try {
            setError("");
            setMessage("");

            const serviceList = services
                .split(",")
                .map((service) => service.trim())
                .filter(Boolean);

            const response = await fetch(
                `${API_BASE_URL}/api/marketing/me`,
                {
                    method: "PATCH",
                    headers: authHeaders(),
                    body: JSON.stringify({
                        services: serviceList,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to update marketing profile"
                );
            }

            setMessage(data.message || "Marketing profile updated successfully");

            if (data.profile?.services) {
                setServices(data.profile.services.join(", "));
            }
        } catch (err) {
            setError(err.message || "Failed to update marketing profile");
        }
    };

    const createClient = async (event) => {
        event.preventDefault();

        try {
            setError("");
            setMessage("");

            const response = await fetch(
                `${API_BASE_URL}/api/marketing/clients`,
                {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({
                        client_name: clientName,
                        client_email: clientEmail,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to create marketing client"
                );
            }

            setMessage(
                data.message || "Marketing client created successfully"
            );

            setClientName("");
            setClientEmail("");

            await loadMarketingData();
        } catch (err) {
            setError(err.message || "Failed to create marketing client");
        }
    };

    const createCampaign = async (event) => {
        event.preventDefault();

        try {
            setError("");
            setMessage("");

            const response = await fetch(
                `${API_BASE_URL}/api/marketing/campaigns`,
                {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({
                        campaign_name: campaignName,
                        status: campaignStatus,
                        start_date: startDate || null,
                        end_date: endDate || null,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to create marketing campaign"
                );
            }

            setMessage(
                data.message || "Marketing campaign created successfully"
            );

            setCampaignName("");
            setCampaignStatus("Planned");
            setStartDate("");
            setEndDate("");

            await loadMarketingData();
        } catch (err) {
            setError(err.message || "Failed to create marketing campaign");
        }
    };

    if (loading) {
        return <p>Loading Marketing Dashboard...</p>;
    }

    return (
        <div style={{ padding: "24px" }}>
            <h1>Marketing Dashboard</h1>

            <p>
                Manage your Marketing Agency profile, clients and campaigns.
            </p>

            {message && (
                <p style={{ color: "green", fontWeight: "bold" }}>
                    {message}
                </p>
            )}

            {error && (
                <p style={{ color: "red", fontWeight: "bold" }}>
                    {error}
                </p>
            )}

            <hr />

            <section>
                <h2>Marketing Profile</h2>

                {profile && (
                    <>
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
                    </>
                )}
            </section>

            <hr />

            <section>
                <h2>Marketing Services</h2>

                <form onSubmit={updateProfile}>
                    <div>
                        <label>
                            <strong>Services</strong>
                        </label>
                    </div>

                    <input
                        type="text"
                        value={services}
                        onChange={(event) =>
                            setServices(event.target.value)
                        }
                        placeholder="SEO, Social Media, Advertising"
                        style={{
                            width: "100%",
                            maxWidth: "600px",
                            padding: "10px",
                            marginTop: "8px",
                        }}
                    />

                    <p>
                        Enter multiple services separated by commas.
                    </p>

                    <button type="submit">
                        Update Services
                    </button>
                </form>
            </section>

            <hr />

            <section>
                <h2>Marketing Clients</h2>

                <form onSubmit={createClient}>
                    <div>
                        <label>
                            <strong>Client Name</strong>
                        </label>
                    </div>

                    <input
                        type="text"
                        value={clientName}
                        onChange={(event) =>
                            setClientName(event.target.value)
                        }
                        placeholder="Client company name"
                        required
                        style={{
                            display: "block",
                            width: "100%",
                            maxWidth: "500px",
                            padding: "10px",
                            marginTop: "8px",
                            marginBottom: "12px",
                        }}
                    />

                    <div>
                        <label>
                            <strong>Client Email</strong>
                        </label>
                    </div>

                    <input
                        type="email"
                        value={clientEmail}
                        onChange={(event) =>
                            setClientEmail(event.target.value)
                        }
                        placeholder="client@example.com"
                        style={{
                            display: "block",
                            width: "100%",
                            maxWidth: "500px",
                            padding: "10px",
                            marginTop: "8px",
                            marginBottom: "12px",
                        }}
                    />

                    <button type="submit">
                        Create Client
                    </button>
                </form>

                <h3>Client List</h3>

                {clients.length === 0 ? (
                    <p>No marketing clients found.</p>
                ) : (
                    clients.map((client) => (
                        <div
                            key={client.id}
                            style={{
                                border: "1px solid #ddd",
                                padding: "12px",
                                marginBottom: "10px",
                            }}
                        >
                            <p>
                                <strong>Client ID:</strong>{" "}
                                {client.id}
                            </p>

                            <p>
                                <strong>Name:</strong>{" "}
                                {client.client_name}
                            </p>

                            <p>
                                <strong>Email:</strong>{" "}
                                {client.client_email || "N/A"}
                            </p>

                            <p>
                                <strong>Status:</strong>{" "}
                                {client.status}
                            </p>
                        </div>
                    ))
                )}
            </section>

            <hr />

            <section>
                <h2>Marketing Campaigns</h2>

                <form onSubmit={createCampaign}>
                    <div>
                        <label>
                            <strong>Campaign Name</strong>
                        </label>
                    </div>

                    <input
                        type="text"
                        value={campaignName}
                        onChange={(event) =>
                            setCampaignName(event.target.value)
                        }
                        placeholder="Summer Marketing Campaign"
                        required
                        style={{
                            display: "block",
                            width: "100%",
                            maxWidth: "500px",
                            padding: "10px",
                            marginTop: "8px",
                            marginBottom: "12px",
                        }}
                    />

                    <div>
                        <label>
                            <strong>Status</strong>
                        </label>
                    </div>

                    <select
                        value={campaignStatus}
                        onChange={(event) =>
                            setCampaignStatus(event.target.value)
                        }
                        style={{
                            padding: "10px",
                            marginTop: "8px",
                            marginBottom: "12px",
                        }}
                    >
                        <option value="Planned">Planned</option>
                        <option value="Running">Running</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>

                    <div>
                        <label>
                            <strong>Start Date</strong>
                        </label>
                    </div>

                    <input
                        type="date"
                        value={startDate}
                        onChange={(event) =>
                            setStartDate(event.target.value)
                        }
                        style={{
                            display: "block",
                            padding: "10px",
                            marginTop: "8px",
                            marginBottom: "12px",
                        }}
                    />

                    <div>
                        <label>
                            <strong>End Date</strong>
                        </label>
                    </div>

                    <input
                        type="date"
                        value={endDate}
                        onChange={(event) =>
                            setEndDate(event.target.value)
                        }
                        style={{
                            display: "block",
                            padding: "10px",
                            marginTop: "8px",
                            marginBottom: "12px",
                        }}
                    />

                    <button type="submit">
                        Create Campaign
                    </button>
                </form>

                <h3>Campaign List</h3>

                {campaigns.length === 0 ? (
                    <p>No marketing campaigns found.</p>
                ) : (
                    campaigns.map((campaign) => (
                        <div
                            key={campaign.id}
                            style={{
                                border: "1px solid #ddd",
                                padding: "12px",
                                marginBottom: "10px",
                            }}
                        >
                            <p>
                                <strong>Campaign ID:</strong>{" "}
                                {campaign.id}
                            </p>

                            <p>
                                <strong>Name:</strong>{" "}
                                {campaign.campaign_name}
                            </p>

                            <p>
                                <strong>Status:</strong>{" "}
                                {campaign.status}
                            </p>

                            <p>
                                <strong>Start Date:</strong>{" "}
                                {campaign.start_date || "N/A"}
                            </p>

                            <p>
                                <strong>End Date:</strong>{" "}
                                {campaign.end_date || "N/A"}
                            </p>
                        </div>
                    ))
                )}
            </section>

            <hr />

            <h2>Marketing Dashboard Summary</h2>

            <p>
                <strong>Total Clients:</strong>{" "}
                {clients.length}
            </p>

            <p>
                <strong>Total Campaigns:</strong>{" "}
                {campaigns.length}
            </p>
        </div>
    );
}

export default Marketing;