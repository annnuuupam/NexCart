import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingBag, Trash2, ShoppingCart, Eye } from "lucide-react";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { useToast } from "../../components/ui/ToastContext";
import API_BASE_URL from "../../config/api";
import "../../styles/styles.css";

const WISHLIST_KEY = "nexcart-wishlist";

const WishlistPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("Customer");
  const [cartCount, setCartCount] = useState(0);
  const toast = useToast();

  const fetchProfileAndCart = async () => {
    try {
      const profileRes = await fetch(`${API_BASE_URL}/api/users/profile`, { credentials: "include" });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setUsername(profile.username || "Guest");
      }

      const cartRes = await fetch(`${API_BASE_URL}/api/cart/items`, { credentials: "include" });
      if (cartRes.ok) {
        const cartData = await cartRes.json();
        setCartCount((cartData?.cart?.products || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0));
      }
    } catch (error) {
      console.error("Failed to fetch profile/cart", error);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem(WISHLIST_KEY);
    setItems(saved ? JSON.parse(saved) : []);
    setLoading(false);
    fetchProfileAndCart();
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

  const addToCart = async (productId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: productId,
          product_id: productId,
          quantity: 1,
        }),
      });

      if (response.ok) {
        await fetchProfileAndCart();
        toast.success("Product added to cart successfully.");
      } else if (response.status === 409) {
        const errorData = await response.json().catch(() => ({}));
        toast.warning(errorData?.error || "Only a few items left in stock.");
      } else {
        toast.error("Unable to add product to cart. Please try again.");
      }
    } catch (error) {
      toast.error("Unable to add product to cart. Please try again.");
    }
  };

  return (
    <div className="customer-homepage">
      <Header cartCount={cartCount} username={username} />

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

                <div className="p-4 flex flex-col items-start bg-white rounded-b-2xl">
                  <h3 className="text-base font-bold text-slate-900 mb-1">{item.name}</h3>
                  <p className="text-xl font-bold text-[#4f46e5] mb-4">Rs. {Number(item.price || 0).toLocaleString("en-IN")}</p>

                  <div className="flex flex-col w-full gap-3">
                    <div className="flex gap-2 w-full">
                      <button className="flex-1 rounded-[24px] bg-[#f8f9fa] border border-slate-100 px-2 py-3 text-[15px] font-medium text-slate-700 transition hover:bg-slate-100 flex items-center justify-center gap-2" onClick={() => navigate(`/product/${item.productId}`)}>
                        <Eye size={18} className="text-slate-700" /> View
                      </button>
                      <button className="flex-1 rounded-[24px] bg-[#4f46e5] px-2 py-2 text-[15px] font-medium text-white transition hover:bg-[#4338ca] flex items-center justify-center gap-2 shadow-sm text-center leading-tight" onClick={() => addToCart(item.productId)}>
                        <ShoppingCart size={16} className="shrink-0" />
                        <span className="text-left font-medium">Add to<br/>cart</span>
                      </button>
                    </div>
                    <button className="w-full rounded-xl bg-[#00bcd4] px-4 py-3 text-[15px] font-bold text-white transition hover:bg-[#00acc1] flex items-center justify-center gap-2 shadow-sm" onClick={() => removeItem(item.productId)}>
                      <Trash2 size={18} /> Remove from Wishlist
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
