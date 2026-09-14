import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE_URL = "https://nicecomm-api-gateway.onrender.com";

const ROLES = [
"Customer",
"Seller",
"Warehouse Provider",
"Logistics Provider",
"Packaging Provider",
"Marketing Agency",
"Affiliate Partner",
"Inspection Partner",
"Repair Partner",
"Installation Partner",
"Participant",
"Platform Admin",
];

const INITIAL_CREATE_FORM = {
full_name: "",
email: "",
password: "",
phone: "",
role: "Customer",
};

const INITIAL_EDIT_FORM = {
full_name: "",
email: "",
phone: "",
password: "",
role: "Customer",
status: "Active",
};

function AdminUsers() {
const { token } = useAuth();


const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(true);

const [error, setError] = useState("");
const [success, setSuccess] = useState("");

const [showCreateForm, setShowCreateForm] = useState(false);
const [showEditForm, setShowEditForm] = useState(false);

const [editingUser, setEditingUser] = useState(null);

const [formData, setFormData] = useState(
    INITIAL_CREATE_FORM
);

const [editFormData, setEditFormData] = useState(
    INITIAL_EDIT_FORM
);

const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
});

const clearMessages = () => {
    setError("");
    setSuccess("");
};

const fetchUsers = async () => {
    try {
        setLoading(true);
        setError("");

        const response = await fetch(
            `${API_BASE_URL}/api/auth/users`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to fetch users"
            );
        }

        setUsers(data.users || []);
    } catch (err) {
        console.error("Fetch Users Error:", err);

        setError(
            err.message || "Failed to load users"
        );
    } finally {
        setLoading(false);
    }
};

useEffect(() => {
    if (token) {
        fetchUsers();
    }
}, [token]);

const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
        ...previous,
        [name]: value,
    }));
};

const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditFormData((previous) => ({
        ...previous,
        [name]: value,
    }));
};

const handleCreateUser = async (event) => {
    event.preventDefault();

    try {
        clearMessages();

        const response = await fetch(
            `${API_BASE_URL}/api/auth/users`,
            {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(formData),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to create user"
            );
        }

        setSuccess(
            data.message || "User created successfully"
        );

        setFormData(INITIAL_CREATE_FORM);
        setShowCreateForm(false);

        await fetchUsers();
    } catch (err) {
        console.error("Create User Error:", err);

        setError(
            err.message || "Failed to create user"
        );
    }
};

const handleEditUser = (user) => {
    clearMessages();

    setEditingUser(user);

    setEditFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        password: "",
        role:
            user.roles && user.roles.length > 0
                ? user.roles[0]
                : "Customer",
        status: user.status || "Active",
    });

    setShowEditForm(true);
    setShowCreateForm(false);
};

const handleCancelEdit = () => {
    setEditingUser(null);
    setShowEditForm(false);
    setEditFormData(INITIAL_EDIT_FORM);
    setError("");
};

const handleUpdateUser = async (event) => {
    event.preventDefault();

    if (!editingUser) {
        return;
    }

    try {
        clearMessages();

        const response = await fetch(
            `${API_BASE_URL}/api/auth/users/${editingUser.id}`,
            {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(editFormData),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to update user"
            );
        }

        setSuccess(
            data.message || "User updated successfully"
        );

        setEditingUser(null);
        setShowEditForm(false);
        setEditFormData(INITIAL_EDIT_FORM);

        await fetchUsers();
    } catch (err) {
        console.error("Update User Error:", err);

        setError(
            err.message || "Failed to update user"
        );
    }
};

const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(
        `Are you sure you want to deactivate user "${user.full_name}" (ID: ${user.id})?`
    );

    if (!confirmed) {
        return;
    }

    try {
        clearMessages();

        const response = await fetch(
            `${API_BASE_URL}/api/auth/users/${user.id}`,
            {
                method: "DELETE",
                headers: getAuthHeaders(),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                    "Failed to deactivate user"
            );
        }

        setSuccess(
            data.message ||
                "User deactivated successfully"
        );

        if (
            editingUser &&
            editingUser.id === user.id
        ) {
            handleCancelEdit();
        }

        await fetchUsers();
    } catch (err) {
        console.error(
            "Delete User Error:",
            err
        );

        setError(
            err.message ||
                "Failed to deactivate user"
        );
    }
};

const handleToggleCreateForm = () => {
    clearMessages();

    setShowCreateForm(
        (previous) => !previous
    );

    setShowEditForm(false);
    setEditingUser(null);
};

if (loading) {
    return (
        <div>
            <h1>Admin Users</h1>
            <p>Loading users...</p>
        </div>
    );
}

return (
    <div>
        <h1>Admin Users</h1>

        {error && (
            <p style={{ color: "red" }}>
                {error}
            </p>
        )}

        {success && (
            <p style={{ color: "green" }}>
                {success}
            </p>
        )}

        <div>
            <p>
                Total Users:{" "}
                <strong>{users.length}</strong>
            </p>

            <button
                type="button"
                onClick={handleToggleCreateForm}
            >
                {showCreateForm
                    ? "Cancel"
                    : "Create User"}
            </button>
        </div>

        {showCreateForm && (
            <div>
                <h2>Create New User</h2>

                <form onSubmit={handleCreateUser}>
                    <div>
                        <label>
                            Full Name
                        </label>

                        <br />

                        <input
                            type="text"
                            name="full_name"
                            value={
                                formData.full_name
                            }
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <br />

                    <div>
                        <label>
                            Email
                        </label>

                        <br />

                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <br />

                    <div>
                        <label>
                            Password
                        </label>

                        <br />

                        <input
                            type="password"
                            name="password"
                            value={
                                formData.password
                            }
                            onChange={handleChange}
                            minLength="6"
                            required
                        />
                    </div>

                    <br />

                    <div>
                        <label>
                            Phone
                        </label>

                        <br />

                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>

                    <br />

                    <div>
                        <label>
                            Role
                        </label>

                        <br />

                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                        >
                            {ROLES.map((role) => (
                                <option
                                    key={role}
                                    value={role}
                                >
                                    {role}
                                </option>
                            ))}
                        </select>
                    </div>

                    <br />

                    <button type="submit">
                        Create User
                    </button>
                </form>
            </div>
        )}

        {showEditForm && editingUser && (
            <div>
                <h2>Edit User</h2>

                <p>
                    Editing User ID:{" "}
                    <strong>
                        {editingUser.id}
                    </strong>
                </p>

                <form onSubmit={handleUpdateUser}>
                    <div>
                        <label>
                            Full Name
                        </label>

                        <br />

                        <input
                            type="text"
                            name="full_name"
                            value={
                                editFormData.full_name
                            }
                            onChange={
                                handleEditChange
                            }
                            required
                        />
                    </div>

                    <br />

                    <div>
                        <label>
                            Email
                        </label>

                        <br />

                        <input
                            type="email"
                            name="email"
                            value={
                                editFormData.email
                            }
                            onChange={
                                handleEditChange
                            }
                            required
                        />
                    </div>

                    <br />

                    <div>
                        <label>
                            Phone
                        </label>

                        <br />

                        <input
                            type="text"
                            name="phone"
                            value={
                                editFormData.phone
                            }
                            onChange={
                                handleEditChange
                            }
                        />
                    </div>

                    <br />

                    <div>
                        <label>
                            New Password
                        </label>

                        <br />

                        <input
                            type="password"
                            name="password"
                            value={
                                editFormData.password
                            }
                            onChange={
                                handleEditChange
                            }
                            minLength="6"
                            placeholder="Leave blank to keep current password"
                        />
                    </div>

                    <br />

                    <div>
                        <label>
                            Role
                        </label>

                        <br />

                        <select
                            name="role"
                            value={
                                editFormData.role
                            }
                            onChange={
                                handleEditChange
                            }
                            required
                        >
                            {ROLES.map((role) => (
                                <option
                                    key={role}
                                    value={role}
                                >
                                    {role}
                                </option>
                            ))}
                        </select>
                    </div>

                    <br />

                    <div>
                        <label>
                            Status
                        </label>

                        <br />

                        <select
                            name="status"
                            value={
                                editFormData.status
                            }
                            onChange={
                                handleEditChange
                            }
                            required
                        >
                            <option value="Active">
                                Active
                            </option>

                            <option value="Inactive">
                                Inactive
                            </option>
                        </select>
                    </div>

                    <br />

                    <button type="submit">
                        Update User
                    </button>

                    <button
                        type="button"
                        onClick={
                            handleCancelEdit
                        }
                        style={{
                            marginLeft: "10px",
                        }}
                    >
                        Cancel
                    </button>
                </form>
            </div>
        )}

        <hr />

        <h2>All Users</h2>
<div className="nice-table-scroll">
    <table
            border="1"
            cellPadding="8"
            cellSpacing="0"
        >
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Roles</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Actions</th>
                </tr>
            </thead>

            <tbody>
                {users.length === 0 ? (
                    <tr>
                        <td colSpan="8">
                            No users found.
                        </td>
                    </tr>
                ) : (
                    users.map((user) => (
                        <tr key={user.id}>
                            <td>
                                {user.id}
                            </td>

                            <td>
                                {user.full_name}
                            </td>

                            <td>
                                {user.email}
                            </td>

                            <td>
                                {user.phone || "-"}
                            </td>

                            <td>
                                {user.roles &&
                                user.roles.length > 0
                                    ? user.roles.join(
                                          ", "
                                      )
                                    : "-"}
                            </td>

                            <td>
                                {user.status}
                            </td>

                            <td>
                                {user.created_at
                                    ? new Date(
                                          user.created_at
                                      ).toLocaleString()
                                    : "-"}
                            </td>

                            <td>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleEditUser(
                                            user
                                        )
                                    }
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDeleteUser(
                                            user
                                        )
                                    }
                                    disabled={
                                        user.status ===
                                        "Inactive"
                                    }
                                    style={{
                                        marginLeft:
                                            "10px",
                                    }}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
</div>
        
    </div>
);


}

export default AdminUsers;

