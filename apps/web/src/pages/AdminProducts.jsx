import { useEffect, useState } from "react";

const API_BASE = "http://localhost:4000";

const initialForm = {
    seller_participant_id: "",
    name: "",
    sku: "",
    description: "",
    category: "",
    retail_price: "",
    wholesale_price: "",
    stock_quantity: "",
    status: "Active",
};

function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [sellers, setSellers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null);

    const [form, setForm] = useState(initialForm);

    const token = localStorage.getItem("nicecomm_token");

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const [productsResponse, participantsResponse] =
                await Promise.all([
                    fetch(`${API_BASE}/api/products`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),

                    fetch(`${API_BASE}/api/participants`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                ]);

            const productsData =
                await productsResponse.json();

            const participantsData =
                await participantsResponse.json();

            if (!productsResponse.ok) {
                throw new Error(
                    productsData.message ||
                    "Failed to load products"
                );
            }

            if (!participantsResponse.ok) {
                throw new Error(
                    participantsData.message ||
                    "Failed to load sellers"
                );
            }

            setProducts(productsData.products || []);

            const sellerParticipants = (
                participantsData.participants || []
            ).filter(
                (participant) =>
                    participant.participant_type_name === "Seller" &&
                    participant.status === "Active"
            );

            setSellers(sellerParticipants);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previousForm) => ({
            ...previousForm,
            [name]: value,
        }));
    };

    const handleOpenCreateForm = () => {
        setError("");
        setSuccess("");
        setEditingProductId(null);
        setForm(initialForm);
        setShowCreateForm(true);
    };

    const handleCloseForm = () => {
        setShowCreateForm(false);
        setEditingProductId(null);
        setForm(initialForm);
        setError("");
    };

    const handleEdit = (product) => {
        setError("");
        setSuccess("");

        setEditingProductId(product.id);

        setForm({
            seller_participant_id:
                product.seller_participant_id ||
                product.participant_id ||
                "",

            name: product.name || "",

            sku: product.sku || "",

            description:
                product.description || "",

            category:
                product.category || "",

            retail_price:
                product.retail_price ?? "",

            wholesale_price:
                product.wholesale_price ?? "",

            stock_quantity:
                product.stock_quantity ??
                product.stock ??
                "",

            status:
                product.status || "Active",
        });

        setShowCreateForm(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        try {
            if (!form.seller_participant_id) {
                throw new Error(
                    "Please select a seller participant."
                );
            }

            if (!form.name.trim()) {
                throw new Error(
                    "Product name is required."
                );
            }

            if (!form.sku.trim()) {
                throw new Error(
                    "SKU is required."
                );
            }

            const retailPrice =
                Number(form.retail_price);

            const wholesalePrice =
                Number(form.wholesale_price);

            const stockQuantity =
                Number(form.stock_quantity);

            if (
                Number.isNaN(retailPrice) ||
                retailPrice < 0
            ) {
                throw new Error(
                    "Retail price must be a valid non-negative number."
                );
            }

            if (
                Number.isNaN(wholesalePrice) ||
                wholesalePrice < 0
            ) {
                throw new Error(
                    "Wholesale price must be a valid non-negative number."
                );
            }

            if (
                Number.isNaN(stockQuantity) ||
                stockQuantity < 0 ||
                !Number.isInteger(stockQuantity)
            ) {
                throw new Error(
                    "Stock quantity must be a valid non-negative integer."
                );
            }

            const isEditing =
                editingProductId !== null;

            const url = isEditing
                ? `${API_BASE}/api/products/${editingProductId}`
                : `${API_BASE}/api/products`;

            const method = isEditing
                ? "PUT"
                : "POST";

            const requestBody = {
                name: form.name.trim(),

                sku: form.sku.trim(),

                description:
                    form.description.trim(),

                category:
                    form.category.trim(),

                retail_price: retailPrice,

                wholesale_price: wholesalePrice,

                stock_quantity: stockQuantity,

                status: form.status,
            };

            /*
             * Seller participant is required when creating.
             * During editing, backend preserves the existing
             * seller ownership, so we do not change it.
             */
            if (!isEditing) {
                requestBody.seller_participant_id =
                    Number(
                        form.seller_participant_id
                    );
            }

            const response = await fetch(
                url,
                {
                    method,

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify(
                        requestBody
                    ),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    (
                        isEditing
                            ? "Product update failed"
                            : "Product creation failed"
                    )
                );
            }

            setSuccess(
                isEditing
                    ? "Product updated successfully."
                    : "Product created successfully."
            );

            setForm(initialForm);
            setShowCreateForm(false);
            setEditingProductId(null);

            await fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeactivate = async (productId) => {
        try {
            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_BASE}/api/products/${productId}`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to deactivate product"
                );
            }

            setSuccess(
                "Product deactivated successfully."
            );

            await fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="nice-content">

            {/* =========================
                PAGE HEADER
            ========================== */}

            <div className="nice-page-header">

                <div>
                    <div className="nice-page-kicker">
                        ADMINISTRATION
                    </div>

                    <h1>
                        Product Management
                    </h1>

                    <p>
                        Manage seller products across
                        the NiceComm Commerce OS.
                    </p>
                </div>

                {!showCreateForm && (
                    <button
                        type="button"
                        className="nice-create-button"
                        onClick={
                            handleOpenCreateForm
                        }
                    >
                        + Create Product
                    </button>
                )}

            </div>


            {/* =========================
                ERROR
            ========================== */}

            {error && (
                <div className="nice-auth-error">
                    {error}
                </div>
            )}


            {/* =========================
                SUCCESS
            ========================== */}

            {success && (
                <div className="nice-auth-success">

                    <span className="nice-auth-success-icon">
                        ✓
                    </span>

                    <span>
                        {success}
                    </span>

                </div>
            )}


            {/* =========================
                CREATE / EDIT FORM
            ========================== */}

            {showCreateForm && (
                <div className="nice-card nice-admin-product-create-card">

                    <div className="nice-card-header">

                        <div>
                            <h2>
                                {editingProductId !== null
                                    ? "Edit Product"
                                    : "Create Product"}
                            </h2>

                            <p>
                                {editingProductId !== null
                                    ? "Update product information for this seller product."
                                    : "Create a product for an active seller participant."}
                            </p>
                        </div>

                    </div>


                    <form
                        className="nice-auth-form"
                        onSubmit={handleSubmit}
                    >

                        <div className="nice-form-grid">

                            {/* Seller */}

                            <div className="nice-auth-field">

                                <label htmlFor="seller_participant_id">
                                    Seller Participant
                                </label>

                                <select
                                    id="seller_participant_id"
                                    name="seller_participant_id"
                                    value={
                                        form.seller_participant_id
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                    disabled={
                                        editingProductId !== null
                                    }
                                >

                                    <option value="">
                                        Select Seller
                                    </option>

                                    {sellers.map(
                                        (seller) => (
                                            <option
                                                key={
                                                    seller.id
                                                }
                                                value={
                                                    seller.id
                                                }
                                            >
                                                {
                                                    seller.company_name
                                                }{" "}
                                                — ID{" "}
                                                {
                                                    seller.id
                                                }
                                            </option>
                                        )
                                    )}

                                </select>

                                {editingProductId !== null && (
                                    <small
                                        style={{
                                            color: "#64748b",
                                            fontSize: "12px",
                                            marginTop: "6px",
                                        }}
                                    >
                                        Seller ownership cannot be changed
                                        while editing a product.
                                    </small>
                                )}

                            </div>


                            {/* Product Name */}

                            <div className="nice-auth-field">

                                <label htmlFor="name">
                                    Product Name
                                </label>

                                <input
                                    id="name"
                                    name="name"
                                    value={form.name}
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter product name"
                                    required
                                />

                            </div>


                            {/* SKU */}

                            <div className="nice-auth-field">

                                <label htmlFor="sku">
                                    SKU
                                </label>

                                <input
                                    id="sku"
                                    name="sku"
                                    value={form.sku}
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter SKU"
                                    required
                                />

                            </div>


                            {/* Category */}

                            <div className="nice-auth-field">

                                <label htmlFor="category">
                                    Category
                                </label>

                                <input
                                    id="category"
                                    name="category"
                                    value={
                                        form.category
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Electronics"
                                    required
                                />

                            </div>


                            {/* Retail Price */}

                            <div className="nice-auth-field">

                                <label htmlFor="retail_price">
                                    Retail Price
                                </label>

                                <input
                                    id="retail_price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    name="retail_price"
                                    value={
                                        form.retail_price
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="0.00"
                                    required
                                />

                            </div>


                            {/* Wholesale Price */}

                            <div className="nice-auth-field">

                                <label htmlFor="wholesale_price">
                                    Wholesale Price
                                </label>

                                <input
                                    id="wholesale_price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    name="wholesale_price"
                                    value={
                                        form.wholesale_price
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="0.00"
                                    required
                                />

                            </div>


                            {/* Stock */}

                            <div className="nice-auth-field">

                                <label htmlFor="stock_quantity">
                                    Stock Quantity
                                </label>

                                <input
                                    id="stock_quantity"
                                    type="number"
                                    min="0"
                                    name="stock_quantity"
                                    value={
                                        form.stock_quantity
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="0"
                                    required
                                />

                            </div>


                            {/* Status */}

                            <div className="nice-auth-field">

                                <label htmlFor="status">
                                    Status
                                </label>

                                <select
                                    id="status"
                                    name="status"
                                    value={
                                        form.status
                                    }
                                    onChange={
                                        handleChange
                                    }
                                >

                                    <option value="Active">
                                        Active
                                    </option>

                                    <option value="Inactive">
                                        Inactive
                                    </option>

                                </select>

                            </div>

                        </div>


                        {/* Description */}

                        <div className="nice-auth-field">

                            <label htmlFor="description">
                                Description
                            </label>

                            <textarea
                                id="description"
                                name="description"
                                value={
                                    form.description
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Enter product description"
                                rows="4"
                            />

                        </div>


                        {/* Actions */}

                        <div className="nice-form-actions">

                            <button
                                type="button"
                                className="nice-secondary-button"
                                onClick={
                                    handleCloseForm
                                }
                            >
                                Cancel
                            </button>

                            <button
                                className="nice-auth-submit"
                                type="submit"
                            >
                                {editingProductId !== null
                                    ? "Update Product →"
                                    : "Create Product →"}
                            </button>

                        </div>

                    </form>

                </div>
            )}


            {/* =========================
                PRODUCTS
            ========================== */}

            <div className="nice-card nice-admin-products-card">

                <div className="nice-card-header">

                    <div>
                        <h2>
                            Products
                        </h2>

                        <p>
                            All products currently
                            available in the Commerce OS.
                        </p>
                    </div>

                    <div className="nice-product-count">
                        {products.length} Products
                    </div>

                </div>


                {loading ? (
                    <div className="nice-empty-state">
                        Loading products...
                    </div>
                ) : products.length === 0 ? (
                    <div className="nice-empty-state">
                        No products found.
                    </div>
                ) : (
                    <div className="nice-table-wrap nice-admin-products-table-wrap">

                        <table className="nice-table nice-admin-products-table">

                            <thead>

                                <tr>
                                    <th>ID</th>
                                    <th>Product</th>
                                    <th>SKU</th>
                                    <th>Seller</th>
                                    <th>Retail</th>
                                    <th>Wholesale</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>

                            </thead>


                            <tbody>

                                {products.map(
                                    (product) => (
                                        <tr
                                            key={
                                                product.id
                                            }
                                        >

                                            <td>
                                                {
                                                    product.id
                                                }
                                            </td>


                                            <td>
                                                <strong>
                                                    {
                                                        product.name
                                                    }
                                                </strong>
                                            </td>


                                            <td>
                                                {
                                                    product.sku
                                                }
                                            </td>


                                            <td>
                                                {
                                                    product.company_name ||
                                                    product.seller_name ||
                                                    product.seller_participant_id ||
                                                    "—"
                                                }
                                            </td>


                                            <td>
                                                ₹
                                                {Number(
                                                    product.retail_price
                                                ).toFixed(2)}
                                            </td>


                                            <td>
                                                ₹
                                                {Number(
                                                    product.wholesale_price
                                                ).toFixed(2)}
                                            </td>


                                            <td>
                                                {
                                                    product.stock_quantity ??
                                                    product.stock ??
                                                    0
                                                }
                                            </td>


                                            <td>

                                                <span
                                                    className={
                                                        product.status ===
                                                            "Active"
                                                            ? "nice-status-active"
                                                            : "nice-status-inactive"
                                                    }
                                                >
                                                    {
                                                        product.status
                                                    }
                                                </span>

                                            </td>


                                            <td>

                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: "8px",
                                                        alignItems: "center",
                                                        flexWrap: "wrap",
                                                    }}
                                                >

                                                    {/* Edit */}

                                                    <button
                                                        type="button"
                                                        className="nice-secondary-button"
                                                        onClick={() =>
                                                            handleEdit(
                                                                product
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>


                                                    {/* Deactivate */}

                                                    {product.status ===
                                                        "Active" ? (
                                                        <button
                                                            type="button"
                                                            className="nice-danger-button"
                                                            onClick={() =>
                                                                handleDeactivate(
                                                                    product.id
                                                                )
                                                            }
                                                        >
                                                            Deactivate
                                                        </button>
                                                    ) : (
                                                        <span className="nice-inactive-label">
                                                            Inactive
                                                        </span>
                                                    )}

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

        </div>
    );
}

export default AdminProducts;