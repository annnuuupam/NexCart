import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import "../../styles/styles.css";

const WISHLIST_KEY = "nexcart-wishlist";

const WishlistPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(WISHLIST_KEY);
    setItems(saved ? JSON.parse(saved) : []);
    setLoading(false);
  }, []);

  const totalValue = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0), 0),
    [items]
  );

  const removeItem = (productId) => {
    const next = items.filter((item) => Number(item.productId) !== Number(productId));
    setItems(next);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
  };

  return (
    <div className="customer-homepage">
      <Header cartCount={0} username="Customer" />

      <main className="main-content wishlist-main">
        <section className="wishlist-hero">
          <div>
            <p className="wishlist-kicker">Saved For Later</p>
            <h1>My Wishlist</h1>
            <p className="wishlist-subtext">Track your favorite products and move them to cart anytime.</p>
          </div>
          <div className="wishlist-stats">
            <p><Heart size={16} /> {items.length} items</p>
            <p><ShoppingBag size={16} /> Rs. {totalValue.toLocaleString("en-IN")}</p>
          </div>
        </section>

        {loading ? (
          <section className="wishlist-grid wishlist-skeleton-grid" aria-label="Loading wishlist">
            {Array.from({ length: 6 }, (_, index) => (
              <article key={`wishlist-skeleton-${index}`} className="wishlist-card wishlist-card-skeleton">
                <div className="wishlist-image skeleton-box" />
                <div className="wishlist-info">
                  <p className="skeleton-box skeleton-line-lg" />
                  <p className="skeleton-box skeleton-line-md" />
                  <div className="wishlist-actions">
                    <p className="skeleton-box skeleton-btn" />
                    <p className="skeleton-box skeleton-btn" />
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : items.length === 0 ? (
          <section className="wishlist-empty">
            <Heart size={26} />
            <h2>Your wishlist is empty</h2>
            <p>Browse products and save items you love.</p>
            <button className="add-to-cart-btn" onClick={() => navigate("/customerhome")}>Continue shopping</button>
          </section>
        ) : (
          <section className="wishlist-grid">
            {items.map((item) => (
              <article key={item.productId} className="wishlist-card">
                <img
                  src={item.imageUrl || "https://via.placeholder.com/300x300?text=No+Image"}
                  alt={item.name}
                  className="wishlist-image"
                  onClick={() => navigate(`/product/${item.productId}`)}
                />

                <div className="wishlist-info">
                  <h3>{item.name}</h3>
                  <p className="wishlist-price">Rs. {Number(item.price || 0).toLocaleString("en-IN")}</p>

                  <div className="wishlist-actions">
                    <button className="product-btn product-btn-secondary" onClick={() => navigate(`/product/${item.productId}`)}>
                      View Product
                    </button>
                    <button className="product-btn product-btn-wishlist" onClick={() => removeItem(item.productId)}>
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default WishlistPage;
