import React, { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:4000";

const PARTICIPANT_TYPES = [
    { id: 1, name: "Seller" },
    { id: 2, name: "Warehouse Provider" },
    { id: 3, name: "Logistics Provider" },
    { id: 4, name: "Packaging Provider" },
    { id: 5, name: "Marketing Agency" },
    { id: 6, name: "Affiliate Partner" },
    { id: 7, name: "Inspection Partner" },
    { id: 8, name: "Repair Partner" },
    { id: 9, name: "Installation Partner" },
];

const INITIAL_FORM = {
    participant_type_id: "",
    company_name: "",
    contact_person: "",
    phone: "",
    email: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",

    // Warehouse Profile
    capacity_units: "",
    available_units: "",
    inventory_notes: "",

    // Seller Profile
    business_name: "",
    tax_identifier: "",
    retail_enabled: false,
    wholesale_enabled: false,
};

function AdminParticipants() {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [form, setForm] = useState(INITIAL_FORM);
    const [creating, setCreating] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [editingParticipant, setEditingParticipant] = useState(null);
    const [updating, setUpdating] = useState(false);

    const getAuthHeaders = () => {
        const token = localStorage.getItem("nicecomm_token");

        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };
    };

    const fetchParticipants = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_BASE_URL}/api/participants`,
                {
                    method: "GET",
                    headers: getAuthHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to fetch participants"
                );
            }

            const participantList = Array.isArray(data)
                ? data
                : data.participants || [];

            setParticipants(participantList);
        } catch (err) {
            console.error(
                "Fetch Participants Error:",
                err
            );

            setError(
                err.message ||
                    "Failed to fetch participants"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParticipants();
    }, []);

    const handleFormChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const resetForm = () => {
        setForm(INITIAL_FORM);
    };

    const handleCreateParticipant = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!form.participant_type_id) {
            setError(
                "Please select a participant type."
            );
            return;
        }

        if (!form.company_name.trim()) {
            setError("Company name is required.");
            return;
        }

        try {
            setCreating(true);

            const payload = {
                participant_type_id: Number(
                    form.participant_type_id
                ),

                company_name:
                    form.company_name.trim(),

                contact_person:
                    form.contact_person.trim(),

                phone: form.phone.trim(),

                email: form.email.trim(),

                address_line1:
                    form.address_line1.trim(),

                address_line2:
                    form.address_line2.trim(),

                city: form.city.trim(),

                state: form.state.trim(),

                postal_code:
                    form.postal_code.trim(),

                country:
                    form.country.trim() || "India",

                // Warehouse Profile
                capacity_units:
                    form.capacity_units === ""
                        ? null
                        : Number(
                              form.capacity_units
                          ),

                available_units:
                    form.available_units === ""
                        ? null
                        : Number(
                              form.available_units
                          ),

                inventory_notes:
                    form.inventory_notes.trim(),

                // Seller Profile
                business_name:
                    form.business_name.trim(),

                tax_identifier:
                    form.tax_identifier.trim(),

                retail_enabled:
                    form.retail_enabled,

                wholesale_enabled:
                    form.wholesale_enabled,
            };

            const response = await fetch(
                `${API_BASE_URL}/api/participants`,
                {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to create participant"
                );
            }

            setSuccess(
                data.message ||
                    "Participant created successfully"
            );

            resetForm();
            setShowCreateForm(false);

            await fetchParticipants();
        } catch (err) {
            console.error(
                "Create Participant Error:",
                err
            );

            setError(
                err.message ||
                    "Failed to create participant"
            );
        } finally {
            setCreating(false);
        }
    };

    const handleCancelCreate = () => {
        resetForm();
        setEditingParticipant(null);
        setShowCreateForm(false);
        setError("");
    };

    const handleEditParticipant = (participant) => {
        setEditingParticipant(participant);

        setForm({
            participant_type_id: String(
                participant.participant_type_id || ""
            ),

            company_name:
                participant.company_name || "",

            contact_person:
                participant.contact_person || "",

            phone: participant.phone || "",

            email: participant.email || "",

            address_line1:
                participant.address_line1 || "",

            address_line2:
                participant.address_line2 || "",

            city: participant.city || "",

            state: participant.state || "",

            postal_code:
                participant.postal_code || "",

            country:
                participant.country || "India",

            capacity_units:
                participant.capacity_units ?? "",

            available_units:
                participant.available_units ?? "",

            inventory_notes:
                participant.inventory_notes || "",

            // Seller Profile
            business_name:
                participant.business_name || "",

            tax_identifier:
                participant.tax_identifier || "",

            retail_enabled:
                participant.retail_enabled ?? false,

            wholesale_enabled:
                participant.wholesale_enabled ?? false,
        });

        setShowCreateForm(true);
        setError("");
        setSuccess("");
    };

    const handleToggleStatus = async (participant) => {
        try {
            setError("");
            setSuccess("");

            const newStatus =
                participant.status === "Active"
                    ? "Inactive"
                    : "Active";

            const confirmed = window.confirm(
                `Are you sure you want to ${
                    newStatus === "Active"
                        ? "activate"
                        : "deactivate"
                } this participant?`
            );

            if (!confirmed) {
                return;
            }

            const response = await fetch(
                `${API_BASE_URL}/api/participants/${participant.id}/status`,
                {
                    method: "PATCH",
                    headers: getAuthHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to update participant status"
                );
            }

            setSuccess(
                data.message ||
                    "Participant status updated successfully"
            );

            await fetchParticipants();
        } catch (error) {
            console.error(
                "Toggle Participant Status Error:",
                error
            );

            setError(
                error.message ||
                    "Failed to update participant status"
            );
        }
    };

    const handleUpdateParticipant = async (event) => {
        event.preventDefault();

        if (!editingParticipant) {
            return;
        }

        setUpdating(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/participants/${editingParticipant.id}`,
                {
                    method: "PUT",

                    headers: {
                        ...getAuthHeaders(),
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        participant_type_id:
                            Number(
                                form.participant_type_id
                            ),

                        company_name:
                            form.company_name.trim(),

                        contact_person:
                            form.contact_person.trim(),

                        phone: form.phone.trim(),

                        email: form.email.trim(),

                        address_line1:
                            form.address_line1.trim(),

                        address_line2:
                            form.address_line2.trim(),

                        city: form.city.trim(),

                        state: form.state.trim(),

                        postal_code:
                            form.postal_code.trim(),

                        country:
                            form.country.trim() ||
                            "India",

                        status:
                            editingParticipant.status ||
                            "Active",

                        // Warehouse Profile
                        capacity_units:
                            form.capacity_units === ""
                                ? null
                                : Number(
                                      form.capacity_units
                                  ),

                        available_units:
                            form.available_units === ""
                                ? null
                                : Number(
                                      form.available_units
                                  ),

                        inventory_notes:
                            form.inventory_notes.trim(),

                        // Seller Profile
                        business_name:
                            form.business_name.trim(),

                        tax_identifier:
                            form.tax_identifier.trim(),

                        retail_enabled:
                            form.retail_enabled,

                        wholesale_enabled:
                            form.wholesale_enabled,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to update participant"
                );
            }

            setSuccess(
                "Participant updated successfully"
            );

            setEditingParticipant(null);

            resetForm();

            setShowCreateForm(false);

            await fetchParticipants();
        } catch (error) {
            console.error(
                "Update Participant Error:",
                error
            );

            setError(
                error.message ||
                    "Failed to update participant"
            );
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="nice-participant-page">
            {/* Header */}
            <div className="nice-participant-page-header">
                <div>
                    <h1
                        style={{
                            margin: 0,
                            marginBottom: "6px",
                        }}
                    >
                        Participants
                    </h1>

                    <p
                        style={{
                            margin: 0,
                            color: "#666",
                        }}
                    >
                        Manage NiceComm ecosystem
                        participants
                    </p>
                </div>

                <div className="nice-participant-header-actions">
                    <button
                        type="button"
                        onClick={fetchParticipants}
                    >
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setError("");
                            setSuccess("");

                            if (
                                showCreateForm
                            ) {
                                setEditingParticipant(
                                    null
                                );
                                resetForm();
                            }

                            setShowCreateForm(
                                (previous) =>
                                    !previous
                            );
                        }}
                    >
                        {showCreateForm
                            ? "Close Form"
                            : "Create Participant"}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div
                    style={{
                        padding: "12px",
                        marginBottom: "15px",
                        border:
                            "1px solid #dc3545",
                        borderRadius: "6px",
                        color: "#dc3545",
                        background: "#fff5f5",
                    }}
                >
                    {error}
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div
                    style={{
                        padding: "12px",
                        marginBottom: "15px",
                        border:
                            "1px solid #198754",
                        borderRadius: "6px",
                        color: "#198754",
                        background: "#f3fff7",
                    }}
                >
                    {success}
                </div>
            )}

            {/* Create / Edit Participant Form */}
            {showCreateForm && (
                <div
                    style={{
                        border:
                            "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "20px",
                        marginBottom: "25px",
                        background: "#fafafa",
                    }}
                >
                    <h2
                        style={{
                            marginTop: 0,
                        }}
                    >
                        {editingParticipant
                            ? "Edit Participant"
                            : "Create Participant"}
                    </h2>

                    <form
                        onSubmit={
                            editingParticipant
                                ? handleUpdateParticipant
                                : handleCreateParticipant
                        }
                    >
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(2, minmax(0, 1fr))",
                                gap: "15px",
                            }}
                        >
                            {/* Participant Type */}
                            <div>
                                <label>
                                    <strong>
                                        Participant Type *
                                    </strong>
                                </label>

                                <select
                                    name="participant_type_id"
                                    value={
                                        form.participant_type_id
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    style={
                                        inputStyle
                                    }
                                    required
                                >
                                    <option value="">
                                        Select Participant
                                        Type
                                    </option>

                                    {PARTICIPANT_TYPES.map(
                                        (type) => (
                                            <option
                                                key={
                                                    type.id
                                                }
                                                value={
                                                    type.id
                                                }
                                            >
                                                {
                                                    type.name
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            {/* Company */}
                            <div>
                                <label>
                                    <strong>
                                        Company Name *
                                    </strong>
                                </label>

                                <input
                                    type="text"
                                    name="company_name"
                                    value={
                                        form.company_name
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    style={
                                        inputStyle
                                    }
                                    required
                                />
                            </div>

                            {/* Contact */}
                            <div>
                                <label>
                                    <strong>
                                        Contact Person
                                    </strong>
                                </label>

                                <input
                                    type="text"
                                    name="contact_person"
                                    value={
                                        form.contact_person
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    style={
                                        inputStyle
                                    }
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label>
                                    <strong>
                                        Phone
                                    </strong>
                                </label>

                                <input
                                    type="text"
                                    name="phone"
                                    value={
                                        form.phone
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    style={
                                        inputStyle
                                    }
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label>
                                    <strong>
                                        Email
                                    </strong>
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={
                                        form.email
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    style={
                                        inputStyle
                                    }
                                />
                            </div>

                            {/* Address Line 1 */}
                            <div>
                                <label>
                                    <strong>
                                        Address Line 1
                                    </strong>
                                </label>

                                <input
                                    type="text"
                                    name="address_line1"
                                    value={
                                        form.address_line1
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    style={
                                        inputStyle
                                    }
                                />
                            </div>

                            {/* Address Line 2 */}
                            <div>
                                <label>
                                    <strong>
                                        Address Line 2
                                    </strong>
                                </label>

                                <input
                                    type="text"
                                    name="address_line2"
                                    value={
                                        form.address_line2
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    style={
                                        inputStyle
                                    }
                                />
                            </div>

                            {/* City */}
                            <div>
                                <label>
                                    <strong>
                                        City
                                    </strong>
                                </label>

                                <input
                                    type="text"
                                    name="city"
                                    value={form.city}
                                    onChange={
                                        handleFormChange
                                    }
                                    style={
                                        inputStyle
                                    }
                                />
                            </div>

                            {/* State */}
                            <div>
                                <label>
                                    <strong>
                                        State
                                    </strong>
                                </label>

                                <input
                                    type="text"
                                    name="state"
                                    value={
                                        form.state
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    style={
                                        inputStyle
                                    }
                                />
                            </div>

                            {/* Warehouse Profile */}
                            {Number(
                                form.participant_type_id
                            ) === 2 && (
                                <>
                                    {/* Capacity Units */}
                                    <div>
                                        <label>
                                            <strong>
                                                Capacity
                                                Units
                                            </strong>
                                        </label>

                                        <input
                                            type="number"
                                            name="capacity_units"
                                            value={
                                                form.capacity_units
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            style={
                                                inputStyle
                                            }
                                            min="0"
                                        />
                                    </div>

                                    {/* Available Units */}
                                    <div>
                                        <label>
                                            <strong>
                                                Available
                                                Units
                                            </strong>
                                        </label>

                                        <input
                                            type="number"
                                            name="available_units"
                                            value={
                                                form.available_units
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            style={
                                                inputStyle
                                            }
                                            min="0"
                                        />
                                    </div>

                                    {/* Inventory Notes */}
                                    <div
                                        style={{
                                            gridColumn:
                                                "1 / -1",
                                        }}
                                    >
                                        <label>
                                            <strong>
                                                Inventory
                                                Notes
                                            </strong>
                                        </label>

                                        <textarea
                                            name="inventory_notes"
                                            value={
                                                form.inventory_notes
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            style={{
                                                ...inputStyle,
                                                minHeight:
                                                    "80px",
                                                resize:
                                                    "vertical",
                                            }}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Seller Profile */}
                            {Number(
                                form.participant_type_id
                            ) === 1 && (
                                <>
                                    {/* Business Name */}
                                    <div>
                                        <label>
                                            <strong>
                                                Business
                                                Name
                                            </strong>
                                        </label>

                                        <input
                                            type="text"
                                            name="business_name"
                                            value={
                                                form.business_name
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            style={
                                                inputStyle
                                            }
                                        />
                                    </div>

                                    {/* Tax Identifier */}
                                    <div>
                                        <label>
                                            <strong>
                                                Tax
                                                Identifier
                                            </strong>
                                        </label>

                                        <input
                                            type="text"
                                            name="tax_identifier"
                                            value={
                                                form.tax_identifier
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            style={
                                                inputStyle
                                            }
                                        />
                                    </div>

                                    {/* Retail Enabled */}
                                    <div>
                                        <label>
                                            <strong>
                                                Retail
                                                Enabled
                                            </strong>
                                        </label>

                                        <div
                                            style={{
                                                marginTop:
                                                    "10px",
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                name="retail_enabled"
                                                checked={
                                                    form.retail_enabled
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setForm(
                                                        (
                                                            previous
                                                        ) => ({
                                                            ...previous,
                                                            retail_enabled:
                                                                event
                                                                    .target
                                                                    .checked,
                                                        })
                                                    )
                                                }
                                            />

                                            <span
                                                style={{
                                                    marginLeft:
                                                        "8px",
                                                }}
                                            >
                                                Enable Retail
                                                Sales
                                            </span>
                                        </div>
                                    </div>

                                    {/* Wholesale Enabled */}
                                    <div>
                                        <label>
                                            <strong>
                                                Wholesale
                                                Enabled
                                            </strong>
                                        </label>

                                        <div
                                            style={{
                                                marginTop:
                                                    "10px",
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                name="wholesale_enabled"
                                                checked={
                                                    form.wholesale_enabled
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setForm(
                                                        (
                                                            previous
                                                        ) => ({
                                                            ...previous,
                                                            wholesale_enabled:
                                                                event
                                                                    .target
                                                                    .checked,
                                                        })
                                                    )
                                                }
                                            />

                                            <span
                                                style={{
                                                    marginLeft:
                                                        "8px",
                                                }}
                                            >
                                                Enable
                                                Wholesale
                                                Sales
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Postal Code */}
                            <div>
                                <label>
                                    <strong>
                                        Postal Code
                                    </strong>
                                </label>

                                <input
                                    type="text"
                                    name="postal_code"
                                    value={
                                        form.postal_code
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    style={
                                        inputStyle
                                    }
                                />
                            </div>

                            {/* Country */}
                            <div>
                                <label>
                                    <strong>
                                        Country
                                    </strong>
                                </label>

                                <input
                                    type="text"
                                    name="country"
                                    value={
                                        form.country
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    style={
                                        inputStyle
                                    }
                                />
                            </div>
                        </div>

                        {/* Form Buttons */}
                        <div
                            style={{
                                marginTop: "20px",
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                            }}
                        >
                            <button
                                type="submit"
                                disabled={
                                    creating ||
                                    updating
                                }
                            >
                                {creating
                                    ? "Creating..."
                                    : updating
                                    ? "Updating..."
                                    : editingParticipant
                                    ? "Update Participant"
                                    : "Create Participant"}
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleCancelCreate
                                }
                                disabled={
                                    creating ||
                                    updating
                                }
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Participants List */}
            {loading ? (
                <p>Loading participants...</p>
            ) : participants.length === 0 ? (
                <div
                    style={{
                        padding: "30px",
                        textAlign: "center",
                        border:
                            "1px solid #ddd",
                        borderRadius: "8px",
                    }}
                >
                    No participants found.
                </div>
            ) : (
                <div className="nice-participant-table-scroll">
                    <table
                        style={{
                            width: "100%",
                            minWidth: "1250px",
                            borderCollapse:
                                "collapse",
                            background: "#fff",
                        }}
                    >
                        <thead>
                            <tr>
                                <th style={thStyle}>
                                    ID
                                </th>

                                <th style={thStyle}>
                                    Company
                                </th>

                                <th style={thStyle}>
                                    Contact Person
                                </th>

                                <th style={thStyle}>
                                    Type
                                </th>

                                <th style={thStyle}>
                                    Email
                                </th>

                                <th style={thStyle}>
                                    Phone
                                </th>

                                <th style={thStyle}>
                                    City
                                </th>

                                <th style={thStyle}>
                                    Capacity
                                </th>

                                <th style={thStyle}>
                                    Available
                                </th>

                                <th style={thStyle}>
                                    Inventory Notes
                                </th>

                                <th style={thStyle}>
                                    Business Name
                                </th>

                                <th style={thStyle}>
                                    Tax Identifier
                                </th>

                                <th style={thStyle}>
                                    Retail
                                </th>

                                <th style={thStyle}>
                                    Wholesale
                                </th>

                                <th style={thStyle}>
                                    Status
                                </th>

                                <th style={thStyle}>
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {participants.map(
                                (participant) => (
                                    <tr
                                        key={
                                            participant.id
                                        }
                                    >
                                        <td
                                            style={
                                                tdStyle
                                            }
                                        >
                                            {
                                                participant.id
                                            }
                                        </td>

                                        <td
                                            style={
                                                tdStyle
                                            }
                                        >
                                            {
                                                participant.company_name ||
                                                "-"
                                            }
                                        </td>

                                        <td
                                            style={
                                                tdStyle
                                            }
                                        >
                                            {
                                                participant.contact_person ||
                                                "-"
                                            }
                                        </td>

                                        <td
                                            style={
                                                tdStyle
                                            }
                                        >
                                            {
                                                participant.participant_type_name ||
                                                participant.type_name ||
                                                participant.participant_type ||
                                                "-"
                                            }
                                        </td>

                                        <td
                                            style={
                                                tdStyle
                                            }
                                        >
                                            {
                                                participant.email ||
                                                "-"
                                            }
                                        </td>

                                        <td
                                            style={
                                                tdStyle
                                            }
                                        >
                                            {
                                                participant.phone ||
                                                "-"
                                            }
                                        </td>

                                        <td
                                            style={
                                                tdStyle
                                            }
                                        >
                                            {
                                                participant.city ||
                                                "-"
                                            }
                                        </td>

                                        {/* Warehouse Capacity */}
                                        <td
                                            style={
                                                tdStyle
                                            }
                                        >
                                            {Number(
                                                participant.participant_type_id
                                            ) === 2
                                                ? participant.capacity_units ??
                                                  "-"
                                                : "-"}
                                        </td>

                                        {/* Warehouse Available */}
                                        <td
                                            style={
                                                tdStyle
                                            }
                                        >
                                            {Number(
                                                participant.participant_type_id
                                            ) === 2
                                                ? participant.available_units ??
                                                  "-"
                                                : "-"}
                                        </td>

                                        {/* Warehouse Notes */}
                                        <td
                                            style={
                                                tdStyle
                                            }
                                        >
                                            {Number(
                                                participant.participant_type_id
                                            ) === 2
                                                ? participant.inventory_notes ||
                                                  "-"
                                                : "-"}
                                        </td>

                                        {/* Seller Business Name */}
                                        <td
                                            style={
                                                tdStyle
                                            }
                                        >
                                            {Number(
                                                participant.participant_type_id
                                            ) === 1
                                                ? participant.business_name ??
                                                  "-"
                                                : "-"}
                                        </td>

                                        {/* Seller Tax Identifier */}
                                        <td
                                            style={
                                                tdStyle
                                            }
                                        >
                                            {Number(
                                                participant.participant_type_id
                                            ) === 1
                                                ? participant.tax_identifier ??
                                                  "-"
                                                : "-"}
                                        </td>

                                        {/* Seller Retail */}
                                        <td
                                            style={
                                                tdStyle
                                            }
                                        >
                                            {Number(
                                                participant.participant_type_id
                                            ) === 1
                                                ? participant.retail_enabled
                                                    ? "Yes"
                                                    : "No"
                                                : "-"}
                                        </td>

                                        {/* Seller Wholesale */}
                                        <td
                                            style={
                                                tdStyle
                                            }
                                        >
                                            {Number(
                                                participant.participant_type_id
                                            ) === 1
                                                ? participant.wholesale_enabled
                                                    ? "Yes"
                                                    : "No"
                                                : "-"}
                                        </td>

                                        {/* Status */}
                                        <td
                                            style={
                                                tdStyle
                                            }
                                        >
                                            {
                                                participant.status ||
                                                "-"
                                            }
                                        </td>

                                        {/* Actions */}
                                        <td
                                            style={
                                                tdStyle
                                            }
                                        >
                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    gap:
                                                        "8px",
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEditParticipant(
                                                            participant
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleStatus(
                                                            participant
                                                        )
                                                    }
                                                >
                                                    {participant.status ===
                                                    "Active"
                                                        ? "Deactivate"
                                                        : "Activate"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px",
    marginTop: "6px",
    border: "1px solid #ccc",
    borderRadius: "5px",
};

const thStyle = {
    textAlign: "left",
    padding: "12px",
    borderBottom: "2px solid #ddd",
    whiteSpace: "nowrap",
};

const tdStyle = {
    padding: "12px",
    borderBottom: "1px solid #eee",
    whiteSpace: "nowrap",
};

export default AdminParticipants;