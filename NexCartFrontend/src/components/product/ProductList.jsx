import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Eye, Heart } from "lucide-react";
import "../../styles/styles.css";

const WISHLIST_KEY = "nexcart-wishlist";

const formatPrice = (value) => {
  const numeric = Number(value || 0);
  return `Rs. ${numeric.toLocaleString("en-IN")}`;
};

const getProductImage = (product) => {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0];
  }
  return product.image_url || product.imageUrl || "https://via.placeholder.com/300x300?text=No+Image";
};

const getRating = (product) => {
  const seeded = Number(product.product_id || product.productId || 0) % 20;
  return (3 + seeded / 10).toFixed(1);
};

const getStock = (product) => Number(product.stock ?? product.stock_quantity ?? 0);

export function ProductList({ products, onAddToCart, onNotify }) {
  const navigate = useNavigate();

  const addToWishlist = (product) => {
    const saved = localStorage.getItem(WISHLIST_KEY);
    const list = saved ? JSON.parse(saved) : [];
    const productId = product.product_id || product.productId;

    if (!list.some((item) => Number(item.productId) === Number(productId))) {
      list.push({
        productId,
        name: product.name,
        price: product.price,
        imageUrl: getProductImage(product),
      });
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
      if (onNotify) onNotify("Added to wishlist", "success");
      return;
    }

    if (onNotify) onNotify("Already in wishlist", "info");
  };

  if (!products || products.length === 0) {
    return <p className="no-products">No products found. Try another category or search keyword.</p>;
  }

  return (
    <div className="product-list">
      <div className="product-grid">
        {products.map((product, index) => {
          const stock = getStock(product);
          const outOfStock = stock <= 0;
          const lowStock = !outOfStock && stock <= 10;

          return (
            <div key={product.product_id || product.productId || index} className="product-card">
              <img
                src={getProductImage(product)}
                alt={product.name}
                className="product-image"
                loading="lazy"
                onClick={() => navigate(`/product/${product.product_id || product.productId}`)}
                style={{ cursor: "pointer" }}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/300x300?text=Unavailable";
                }}
              />
              <div className="product-info">
                <span className={`product-badge ${outOfStock ? "badge-muted" : ""}`}>
                  {outOfStock ? "Out of stock" : lowStock ? `Only ${stock} left` : "Limited deal"}
                </span>
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <p className="product-meta">Rating {getRating(product)} / 5 | Free delivery</p>
                <p className="product-price">{formatPrice(product.price)}</p>

                <div className="product-actions">
                  <button
                    className="product-btn product-btn-primary"
                    onClick={() => onAddToCart(product.product_id || product.productId)}
                    disabled={outOfStock}
                  >
                    <ShoppingCart size={16} />
                    <span>{outOfStock ? "Unavailable" : "Add to cart"}</span>
                  </button>
                  <button className="product-btn product-btn-secondary" onClick={() => navigate(`/product/${product.product_id || product.productId}`)}>
                    <Eye size={16} />
                    <span>View details</span>
                  </button>
                  <button className="product-btn product-btn-wishlist" onClick={() => addToWishlist(product)}>
                    <Heart size={16} />
                    <span>Add to wishlist</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
