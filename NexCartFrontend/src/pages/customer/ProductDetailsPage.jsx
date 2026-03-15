import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ShieldCheck, Truck, RotateCcw, Star, Heart, ShoppingCart, ArrowLeft } from "lucide-react";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { useToast } from "../../components/ui/ToastContext";
import "../../styles/styles.css";
import { ProductCardSkeleton } from "../../components/ui/Skeletons";
import API_BASE_URL from '../../config/api';

const WISHLIST_KEY = "nexcart-wishlist";

const getStockValue = (product) => Number(product?.stock ?? product?.stock_quantity ?? 0);

const ProductDetailsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [activeImage, setActiveImage] = useState("");
  const toast = useToast();

  const images = useMemo(() => {
    const list = product?.images || [];
    return list.length ? list : ["https://via.placeholder.com/700x700?text=No+Image"];
  }, [product]);

  const averageRating = useMemo(() => {
    const reviews = product?.reviews || [];
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [product]);

  useEffect(() => {
    if (images.length && !activeImage) {
      setActiveImage(images[0]);
    }
  }, [images, activeImage]);

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

  const fetchProduct = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, { credentials: "include" });
      if (response.status === 401 || response.status === 403) {
        navigate("/");
        return;
      }
      const data = await response.json();
      setProduct(data);
      setIsLoading(false);
      setActiveImage((data.images && data.images.length ? data.images[0] : "") || "");
    } catch (error) {
      console.error("Failed to load product", error);
    }
  };

  useEffect(() => {
    fetchProfileAndCart();
    fetchProduct();
  }, [productId]);

  const addToCart = async () => {
    if (!product) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.productId,
          product_id: product.productId,
          quantity: 1,
        }),
      });

      if (response.ok) {
        await fetchProfileAndCart();
        toast.success("Product added to cart successfully.");
      } else if (response.status === 409) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.error || "Only a few items left in stock.";
        toast.warning(message);
      } else {
        toast.error("Unable to add product to cart. Please try again.");
      }
    } catch (error) {
      toast.error("Unable to add product to cart. Please try again.");
    }
  };

  const addToWishlist = () => {
    if (!product?.productId) return;
    const saved = localStorage.getItem(WISHLIST_KEY);
    const list = saved ? JSON.parse(saved) : [];
    if (!list.some((item) => Number(item.productId) === Number(product.productId))) {
      list.push({
        productId: product.productId,
        name: product.name,
        price: product.price,
        imageUrl: images[0],
      });
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
      toast.success("Added to wishlist successfully.");
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: Number(productId),
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment,
        }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setReviewForm({ rating: 5, comment: "" });
      await fetchProduct();
    } catch (error) {
      toast.error(error.message || "Unable to submit review. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="main-content">
        <div className="product-grid">
          {Array.from({ length: 1 }).map((_, idx) => (
            <ProductCardSkeleton key={`detail-skeleton-${idx}`} />
          ))}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="customer-homepage">
        <Header cartCount={cartCount} username={username} />
        <main className="main-content"><p>Loading product...</p></main>
      <Footer />
      </div>
    );
  }

  return (
    <div className="customer-homepage">
      <Header cartCount={cartCount} username={username} />
      <main className="main-content product-page-main">
        <button
          type="button"
          className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-indigo-200 bg-indigo-50/50 px-6 py-2.5 text-sm font-bold text-indigo-700 transition-all hover:bg-indigo-100 hover:text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 mb-6 mt-4 ml-6"
          onClick={() => navigate("/customerhome")}
        >
          <ArrowLeft size={16} className="text-indigo-500 dark:text-indigo-400" />
          Back to products
        </button>

        <section className="pdp-grid">
          <div className="pdp-gallery-card">
            <div className="pdp-main-image-wrap">
              <img src={activeImage || images[0]} alt={product.name} className="pdp-main-image" />
            </div>
            <div className="pdp-thumbnails">
              {images.map((image) => (
                <button
                  key={image}
                  type="button"
                  className={`pdp-thumb ${activeImage === image ? "active" : ""}`}
                  onClick={() => setActiveImage(image)}
                >
                  <img src={image} alt="Product thumbnail" />
                </button>
              ))}
            </div>
          </div>

          <div className="pdp-info-card">
            <span className="product-badge">Top Pick</span>
            <h1 className="pdp-title">{product.name}</h1>

            <div className="pdp-rating-row">
              <span className="pdp-rating-pill"><Star size={14} /> {averageRating || "0.0"}</span>
              <span className="pdp-rating-count">({(product.reviews || []).length} reviews)</span>
            </div>

            <p className="pdp-price">Rs. {Number(product.price || 0).toLocaleString("en-IN")}</p>
            <p className="pdp-meta">Category: {product.categoryName || "General"}</p>
            <p className="pdp-meta">Stock left: {getStockValue(product)}</p>
            <p className="pdp-description">{product.description}</p>

            <div className="pdp-highlights">
              <p><ShieldCheck size={16} /> 100% Genuine Product</p>
              <p><Truck size={16} /> Fast Delivery Available</p>
              <p><RotateCcw size={16} /> Easy 7-day Returns</p>
            </div>
          </div>

          <aside className="pdp-buy-card">
            <p className="pdp-buy-price">Rs. {Number(product.price || 0).toLocaleString("en-IN")}</p>
            <p className="pdp-buy-stock">{getStockValue(product) > 0 ? "In stock" : "Out of stock"}</p>
            <button className="pdp-cta pdp-cta-cart" onClick={addToCart} disabled={getStockValue(product) <= 0}><ShoppingCart size={16} /> Add to cart</button>
            <button className="pdp-cta pdp-cta-wishlist" onClick={addToWishlist}><Heart size={16} /> Add to wishlist</button>
          </aside>
        </section>

        <section className="pdp-reviews-section">
          <h3>Ratings & Reviews</h3>

          <form onSubmit={submitReview} className="pdp-review-form">
            <div className="checkout-profile-grid">
              <label>
                Rating
                <select value={reviewForm.rating} onChange={(e) => setReviewForm((p) => ({ ...p, rating: Number(e.target.value) }))}>
                  <option value={5}>5</option>
                  <option value={4}>4</option>
                  <option value={3}>3</option>
                  <option value={2}>2</option>
                  <option value={1}>1</option>
                </select>
              </label>
              <label className="pdp-review-comment">
                Comment
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                  rows={3}
                  placeholder="Share your experience with this product"
                />
              </label>
            </div>
            <button type="submit" className="checkout-profile-save">Submit review</button>
          </form>

          <div className="pdp-review-list">
            {(product.reviews || []).length ? (
              (product.reviews || []).map((review) => (
                <article key={review.id} className="pdp-review-item">
                  <p className="pdp-review-head"><b>{review.rating}/5</b> by User #{review.userId}</p>
                  <p>{review.comment}</p>
                </article>
              ))
            ) : (
              <p>No reviews yet.</p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetailsPage;









