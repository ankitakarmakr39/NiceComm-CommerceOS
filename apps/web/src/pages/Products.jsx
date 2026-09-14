import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE_URL = "https://nicecomm-api-gateway.onrender.com";

function Products() {
  const { token } = useAuth();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [addingProductId, setAddingProductId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/products`,
          {
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

    if (token) {
      fetchProducts();
    }
  }, [token]);

  const filteredProducts = products.filter((product) => {
    const searchText = search.toLowerCase();

    return (
      product.name?.toLowerCase().includes(searchText) ||
      product.sku?.toLowerCase().includes(searchText) ||
      product.seller_company_name
        ?.toLowerCase()
        .includes(searchText)
    );
  });

  const handleQuantityChange = (productId, value, stock) => {
    const quantity = Number(value);

    if (quantity < 1) {
      setQuantities((previous) => ({
        ...previous,
        [productId]: 1,
      }));
      return;
    }

    if (quantity > stock) {
      setQuantities((previous) => ({
        ...previous,
        [productId]: stock,
      }));
      return;
    }

    setQuantities((previous) => ({
      ...previous,
      [productId]: quantity,
    }));
  };

  const handleAddToCart = async (product) => {
    const quantity = quantities[product.id] || 1;

    if (quantity > product.stock_quantity) {
      setError("Quantity cannot exceed available stock.");
      return;
    }

    try {
      setAddingProductId(product.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_BASE_URL}/api/cart/items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            product_id: product.id,
            quantity,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to add product to cart"
        );
      }

      setSuccess(
        `${product.name} added to cart successfully.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingProductId(null);
    }
  };

  if (loading) {
    return <p>Loading products...</p>;
  }

  if (error && products.length === 0) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h1>Products</h1>

      <div>
        <label htmlFor="productSearch">
          Search Products
        </label>

        <br />

        <input
          id="productSearch"
          type="text"
          placeholder="Search by product, SKU or seller..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <br />

      {error && <p>{error}</p>}
      {success && <p>{success}</p>}

      {filteredProducts.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div>
          {filteredProducts.map((product) => {
            const quantity = quantities[product.id] || 1;

            return (
              <div key={product.id}>
                <h2>{product.name}</h2>

                <p>SKU: {product.sku}</p>

                <p>
                  Seller: {product.seller_company_name}
                </p>

                <p>
                  Price: ₹{product.retail_price}
                </p>

                <p>
                  Stock: {product.stock_quantity}
                </p>

                <label htmlFor={`quantity-${product.id}`}>
                  Quantity:
                </label>

                <input
                  id={`quantity-${product.id}`}
                  type="number"
                  min="1"
                  max={product.stock_quantity}
                  value={quantity}
                  onChange={(event) =>
                    handleQuantityChange(
                      product.id,
                      event.target.value,
                      product.stock_quantity
                    )
                  }
                />

                <button
                  type="button"
                  onClick={() => handleAddToCart(product)}
                  disabled={
                    addingProductId === product.id ||
                    product.stock_quantity < 1
                  }
                >
                  {addingProductId === product.id
                    ? "Adding..."
                    : "Add to Cart"}
                </button>

                <hr />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Products;
