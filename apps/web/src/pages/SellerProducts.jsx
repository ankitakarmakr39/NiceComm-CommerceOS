import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE_URL = "http://localhost:4000";

const INITIAL_FORM = {
    name: "",
    sku: "",
    description: "",
    category: "",
    retail_price: "",
    wholesale_price: "",
    stock_quantity: "",
    status: "Active",
};

function SellerProducts() {
    const { token } = useAuth();

    const [products, setProducts] = useState([]);
    const [form, setForm] = useState(INITIAL_FORM);
    const [editingProductId, setEditingProductId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_BASE_URL}/api/products`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to fetch products"
                );
            }

            setProducts(data.products || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchProducts();
        }
    }, [token]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const resetForm = () => {
        setForm(INITIAL_FORM);
        setEditingProductId(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const payload = {
                name: form.name.trim(),
                sku: form.sku.trim(),
                description: form.description.trim(),
                category: form.category.trim(),
                retail_price: Number(form.retail_price),
                wholesale_price:
                    form.wholesale_price === ""
                        ? null
                        : Number(form.wholesale_price),
                stock_quantity: Number(form.stock_quantity),
                status: form.status,
            };

            const url = editingProductId
                ? `${API_BASE_URL}/api/products/${editingProductId}`
                : `${API_BASE_URL}/api/products`;

            const method = editingProductId ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to save product"
                );
            }

            setSuccess(
                editingProductId
                    ? "Product updated successfully."
                    : "Product created successfully."
            );

            resetForm();
            await fetchProducts();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (product) => {
        setError("");
        setSuccess("");

        setEditingProductId(product.id);

        setForm({
            name: product.name || "",
            sku: product.sku || "",
            description: product.description || "",
            category: product.category || "",
            retail_price: product.retail_price ?? "",
            wholesale_price: product.wholesale_price ?? "",
            stock_quantity: product.stock_quantity ?? "",
            status: product.status || "Active",
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const handleDelete = async (productId) => {
        const confirmed = window.confirm(
            "Are you sure you want to deactivate this product?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_BASE_URL}/api/products/${productId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to deactivate product"
                );
            }

            setSuccess(
                "Product deactivated successfully."
            );

            if (editingProductId === productId) {
                resetForm();
            }

            await fetchProducts();
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return <p>Loading seller products...</p>;
    }

    return (
        <div>
            <h1>Seller Products</h1>

            <p>
                Manage products belonging to your Seller
                participant.
            </p>

            {error && <p>{error}</p>}
            {success && <p>{success}</p>}

            <hr />

            <h2>
                {editingProductId
                    ? "Edit Product"
                    : "Create Product"}
            </h2>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name">
                        Product Name
                    </label>
                    <br />

                    <input
                        id="name"
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <br />

                <div>
                    <label htmlFor="sku">
                        SKU
                    </label>
                    <br />

                    <input
                        id="sku"
                        name="sku"
                        type="text"
                        value={form.sku}
                        onChange={handleChange}
                        required
                    />
                </div>

                <br />

                <div>
                    <label htmlFor="description">
                        Description
                    </label>
                    <br />

                    <textarea
                        id="description"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                    />
                </div>

                <br />

                <div>
                    <label htmlFor="category">
                        Category
                    </label>
                    <br />

                    <input
                        id="category"
                        name="category"
                        type="text"
                        value={form.category}
                        onChange={handleChange}
                    />
                </div>

                <br />

                <div>
                    <label htmlFor="retail_price">
                        Retail Price
                    </label>
                    <br />

                    <input
                        id="retail_price"
                        name="retail_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.retail_price}
                        onChange={handleChange}
                        required
                    />
                </div>

                <br />

                <div>
                    <label htmlFor="wholesale_price">
                        Wholesale Price
                    </label>
                    <br />

                    <input
                        id="wholesale_price"
                        name="wholesale_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.wholesale_price}
                        onChange={handleChange}
                    />
                </div>

                <br />

                <div>
                    <label htmlFor="stock_quantity">
                        Stock Quantity
                    </label>
                    <br />

                    <input
                        id="stock_quantity"
                        name="stock_quantity"
                        type="number"
                        min="0"
                        step="1"
                        value={form.stock_quantity}
                        onChange={handleChange}
                        required
                    />
                </div>

                <br />

                <div>
                    <label htmlFor="status">
                        Status
                    </label>
                    <br />

                    <select
                        id="status"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
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

                <button
                    type="submit"
                    disabled={saving}
                >
                    {saving
                        ? "Saving..."
                        : editingProductId
                        ? "Update Product"
                        : "Create Product"}
                </button>

                {editingProductId && (
                    <>
                        {" "}

                        <button
                            type="button"
                            onClick={resetForm}
                            disabled={saving}
                        >
                            Cancel Edit
                        </button>
                    </>
                )}
            </form>

            <hr />

            <h2>My Products</h2>

            {products.length === 0 ? (
                <p>No products found.</p>
            ) : (
                <div>
                    {products.map((product) => (
                        <div key={product.id}>
                            <h3>{product.name}</h3>

                            <p>
                                <strong>SKU:</strong>{" "}
                                {product.sku}
                            </p>

                            <p>
                                <strong>Category:</strong>{" "}
                                {product.category || "-"}
                            </p>

                            <p>
                                <strong>Retail Price:</strong>{" "}
                                ₹{product.retail_price}
                            </p>

                            <p>
                                <strong>Wholesale Price:</strong>{" "}
                                {product.wholesale_price ===
                                    null ||
                                product.wholesale_price ===
                                    undefined
                                    ? "-"
                                    : `₹${product.wholesale_price}`}
                            </p>

                            <p>
                                <strong>Stock:</strong>{" "}
                                {product.stock_quantity}
                            </p>

                            <p>
                                <strong>Status:</strong>{" "}
                                {product.status}
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    handleEdit(product)
                                }
                            >
                                Edit
                            </button>

                            {" "}

                            <button
                                type="button"
                                onClick={() =>
                                    handleDelete(product.id)
                                }
                            >
                                Deactivate
                            </button>

                            <hr />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SellerProducts;