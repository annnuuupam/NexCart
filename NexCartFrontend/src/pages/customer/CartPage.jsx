import React, { useEffect, useMemo, useState } from "react";
import "../../styles/CartPage.css";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { useToast } from "../../components/ui/ToastContext";
import { CardSkeleton } from "../../components/ui/Skeletons";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import API_BASE_URL from '../../config/api';

const formatPrice = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

const ensureRazorpayLoaded = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const CONTACT_STORAGE_KEY = "nexcart-contact";

const getStockValue = (item) => Number(item?.stock ?? item?.stock_quantity ?? 0);

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState(null);
  const [subtotal, setSubtotal] = useState(0);
  const [profileDraft, setProfileDraft] = useState({
    username: "",
    email: "",
    contact: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });
  const [couponCode, setCouponCode] = useState("");
  const [couponInfo, setCouponInfo] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponListLoading, setCouponListLoading] = useState(false);
  const [settings, setSettings] = useState({
    shipping: { freeShippingMin: 999, domesticCharge: 79, internationalCharge: 499, dispatchSlaHours: 24 },
    tax: { gstPercentage: 18, taxEnabled: true },
    payment: { razorpay: true, cod: true, stripe: false, paypal: false },
    store: { storeName: "NexCart" },
  });
  const [paymentMethod, setPaymentMethod] = useState("RAZORPAY");
  const razorpayKeyId = settings?.payment?.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID || "";

  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCartItems = async () => {
      setIsLoadingCart(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/cart/items`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch cart items");
        const data = await response.json();

        setCartItems(
          data?.cart?.products?.map((item) => ({
            ...item,
            stock: Number(item.stock ?? item.stock_quantity ?? 0),
            total_price: parseFloat(item.total_price || 0).toFixed(2),
            price_per_unit: parseFloat(item.price_per_unit || 0).toFixed(2),
          })) || []
        );

        const resolvedUsername = data?.username || data?.user?.username || data?.user?.name || "";
        const resolvedUserId = data?.userId || data?.user?.userId || null;
        setUsername(resolvedUsername);
        setUserId(resolvedUserId);

        setProfileDraft((prev) => ({
          ...prev,
          username: resolvedUsername || prev.username,
        }));
        setIsLoadingCart(false);
      } catch (error) {
        console.error("Error fetching cart items:", error);
        setIsLoadingCart(false);
      }
    };

    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/settings`, { credentials: "include" });
        if (!response.ok) return;
        const data = await response.json();
        setSettings((prev) => ({
          ...prev,
          ...data,
          shipping: { ...prev.shipping, ...(data?.shipping || {}) },
          tax: { ...prev.tax, ...(data?.tax || {}) },
          payment: { ...prev.payment, ...(data?.payment || {}) },
          store: { ...prev.store, ...(data?.store || {}) },
        }));
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    const fetchAvailableCoupons = async () => {
      setCouponListLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/store/coupons`, { credentials: "include" });
        if (!response.ok) {
          setAvailableCoupons([]);
          return;
        }
        const data = await response.json();
        setAvailableCoupons(Array.isArray(data?.coupons) ? data.coupons : []);
      } catch (error) {
        console.error("Error fetching coupons:", error);
        setAvailableCoupons([]);
      } finally {
        setCouponListLoading(false);
      }
    };
    const savedContact = localStorage.getItem(CONTACT_STORAGE_KEY) || "";
    if (savedContact) setProfileDraft((prev) => ({ ...prev, contact: savedContact }));

    fetchCartItems();
    resolveUserContext();
    fetchSettings();
    fetchAvailableCoupons();
  }, []);

  useEffect(() => {
    const total = cartItems.reduce((totalValue, item) => totalValue + parseFloat(item.total_price || 0), 0).toFixed(2);
    setSubtotal(total);
  }, [cartItems]);

  useEffect(() => {
    const enabled = [];
    if (settings.payment?.razorpay) enabled.push("RAZORPAY");
    if (settings.payment?.cod) enabled.push("COD");
    if (settings.payment?.stripe) enabled.push("STRIPE");
    if (settings.payment?.paypal) enabled.push("PAYPAL");

    if (!enabled.includes(paymentMethod)) {
      setPaymentMethod(enabled[0] || "RAZORPAY");
    }
  }, [settings.payment, paymentMethod]);

  const resolveUserContext = async () => {
    const endpoints = [
      `${API_BASE_URL}/api/users/profile`,
      `${API_BASE_URL}/api/users/me`,
      `${API_BASE_URL}/api/auth/me`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, { credentials: "include" });
        if (!response.ok) continue;
        const data = await response.json();
        const user = data?.user || data;

        const resolvedUserId = user?.userId || user?.id || userId;
        const resolvedUsername = user?.username || user?.name || username;
        const resolvedEmail = user?.email || "";

        setUserId(resolvedUserId);
        setUsername(resolvedUsername);
        setProfileDraft((prev) => ({
          ...prev,
          username: resolvedUsername || prev.username,
          email: resolvedEmail || prev.email,
          contact: user?.phone || prev.contact,
          addressLine1: user?.addressLine1 || prev.addressLine1,
          addressLine2: user?.addressLine2 || prev.addressLine2,
          city: user?.city || prev.city,
          state: user?.state || prev.state,
          postalCode: user?.postalCode || prev.postalCode,
          country: user?.country || prev.country,
        }));

        return { userId: resolvedUserId, username: resolvedUsername, email: resolvedEmail };
      } catch {
        // Try next endpoint
      }
    }

    return { userId, username, email: profileDraft.email };
  };

  const saveProfileDraft = async () => {
    try {
      const payload = {
        username: profileDraft.username?.trim(),
        email: profileDraft.email?.trim(),
        phone: profileDraft.contact?.trim(),
        addressLine1: profileDraft.addressLine1?.trim(),
        addressLine2: profileDraft.addressLine2?.trim(),
        city: profileDraft.city?.trim(),
        state: profileDraft.state?.trim(),
        postalCode: profileDraft.postalCode?.trim(),
        country: profileDraft.country?.trim(),
      };

      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Unable to update profile");
      }

      if (profileDraft.contact) localStorage.setItem(CONTACT_STORAGE_KEY, profileDraft.contact);

      toast.success("Checkout profile saved successfully.");
      return true;
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.warning("Unable to save checkout profile right now. You can continue with current values.");
      return false;
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, productId }),
      });
      if (response.ok || response.status === 204) {
        setCartItems((prev) => prev.filter((item) => item.product_id !== productId));
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const handleQuantityChange = async (productId, newQuantity) => {
    try {
      const item = cartItems.find((entry) => entry.product_id === productId);
      const available = item ? getStockValue(item) : 0;

      if (newQuantity <= 0) {
        handleRemoveItem(productId);
        return;
      }

      if (available > 0 && newQuantity > available) {
        toast.warning(`Only ${available} items left in stock.`);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/cart/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, productId, quantity: newQuantity }),
      });

      if (response.ok) {
        setCartItems((prevItems) =>
          prevItems.map((entry) =>
            entry.product_id === productId
              ? { ...entry, quantity: newQuantity, total_price: (entry.price_per_unit * newQuantity).toFixed(2) }
              : entry
          )
        );
      } else if (response.status === 409) {
        const errorData = await response.json().catch(() => ({}));
        toast.warning(errorData?.error || "Only a few items left in stock.");
      } else {
        toast.error("Unable to update quantity.");
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Unable to update quantity.");
    }
  };

  const formatCouponMeta = (coupon) => {
    const type = String(coupon?.discountType || "").toUpperCase();
    const value = Number(coupon?.discountValue || 0);
    const min = Number(coupon?.minimumOrderAmount || 0);
    const max = Number(coupon?.maximumDiscount || 0);
    const discountLabel = type === "PERCENTAGE" ? `${value}% off` : `Rs. ${value} off`;
    const parts = [discountLabel];
    if (min > 0) parts.push(`Min Rs. ${min}`);
    if (max > 0 && type === "PERCENTAGE") parts.push(`Up to Rs. ${max}`);
    return parts.join(" | " );
  };

  const totalProducts = () => cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotalValue = Number(subtotal || 0);
  const freeShippingMin = Number(settings.shipping?.freeShippingMin ?? 0);
  const domesticCharge = Number(settings.shipping?.domesticCharge ?? 0);
  const internationalCharge = Number(settings.shipping?.internationalCharge ?? 0);
  const gstPercentage = Number(settings.tax?.gstPercentage ?? 0);
  const taxEnabled = Boolean(settings.tax?.taxEnabled);
  const discountValue = Number(couponInfo?.discountAmount || 0);
  const remainingForFreeShipping = Math.max(freeShippingMin - subtotalValue, 0);
  const freeShippingUnlocked = remainingForFreeShipping <= 0;

  const isInternational = profileDraft.country && profileDraft.country.trim().toLowerCase() !== "india";
  const shipping = subtotalValue >= freeShippingMin ? 0 : (isInternational ? internationalCharge : domesticCharge);

  const preTaxTotal = Math.max(subtotalValue + shipping - discountValue, 0);
  const tax = taxEnabled ? (preTaxTotal * gstPercentage) / 100 : 0;
  const grandTotal = Math.max(preTaxTotal + tax, 0);

  const hasOutOfStock = cartItems.some((item) => getStockValue(item) <= 0);
  const exceedsStock = cartItems.some((item) => getStockValue(item) > 0 && item.quantity > getStockValue(item));

  const addressText = useMemo(() => {
    return [
      profileDraft.addressLine1,
      profileDraft.addressLine2,
      profileDraft.city,
      profileDraft.state,
      profileDraft.postalCode,
      profileDraft.country,
    ]
      .filter((value) => value && String(value).trim())
      .join(", ");
  }, [profileDraft]);

  const applyCoupon = async (overrideCode) => {
    setCouponInfo(null);
    const codeToApply = String(overrideCode ?? couponCode).trim();
    if (!codeToApply) {
      toast.warning("Please enter a coupon code first.");
      return;
    }

    setCouponLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/coupons/validate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToApply.toUpperCase(), subtotal: subtotalValue + shipping }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Coupon is invalid");

      setCouponInfo(data);
      setCouponCode(String(data.code || codeToApply).toUpperCase());
      toast.success(`Coupon ${(data?.code || couponCode)} applied successfully.`);
    } catch (error) {
      toast.error(error.message || "Unable to apply coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const clearCoupon = () => {
    setCouponInfo(null);
    setCouponCode("");
    toast.info("Coupon removed.");
  };

  const handleCheckout = async () => {
    if (hasOutOfStock || exceedsStock) {
      toast.warning("Please update your cart. Some items are out of stock or exceed available quantity.");
      return;
    }

    try {
      if (!profileDraft.addressLine1 || !profileDraft.city || !profileDraft.postalCode || !profileDraft.country) {
        toast.warning("Please complete your shipping address before checkout.");
        return;
      }

      await saveProfileDraft();
      const resolvedContext = await resolveUserContext();

      const requestBody = {
        userId: resolvedContext.userId,
        user_id: resolvedContext.userId,
        username: resolvedContext.username,
        status: "PENDING",
        currency: "INR",
        discountAmount: discountValue,
        couponCode: couponInfo?.code || null,
        shippingAddress: addressText,
        shippingCountry: profileDraft.country,
        paymentMethod,
        cartItems: cartItems.map((item) => ({
          productId: item.product_id,
          quantity: item.quantity,
          price: Number(item.price_per_unit),
        })),
      };

      if (paymentMethod === "COD") {
        const response = await fetch(`${API_BASE_URL}/api/payment/cod`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(requestBody),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          toast.error(data?.error || "Unable to place COD order.");
          return;
        }

        toast.success("Order placed with Cash on Delivery.");
        navigate("/orders");
        return;
      }

      if (paymentMethod !== "RAZORPAY") {
        toast.warning("This payment method is not available yet. Please choose Razorpay or COD.");
        return;
      }

      if (!razorpayKeyId) {
        toast.error("Razorpay key is not configured. Please contact support.");
        return;
      }

      const sdkLoaded = await ensureRazorpayLoaded();
      if (!sdkLoaded || !window.Razorpay) {
        toast.error("Unable to load the payment gateway. Please check your connection and try again.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/payment/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(await response.text());

      const responseText = await response.text();
      let razorpayOrderId = "";
      let backendAmount = 0;

      try {
        const createData = JSON.parse(responseText);
        razorpayOrderId = createData?.orderId || createData?.order_id || createData?.id || "";
        backendAmount = Number(createData?.amount || 0);
      } catch {
        razorpayOrderId = responseText?.replaceAll('"', "").trim();
      }

      if (!razorpayOrderId) throw new Error("Order ID was not returned by payment create API.");

      const options = {
        key: razorpayKeyId,
        amount: backendAmount > 0 ? backendAmount : Math.round(grandTotal * 100),
        currency: "INR",
        name: "NexCart",
        description: "Order Checkout",
        order_id: razorpayOrderId,
        handler: async (paymentResponse) => {
          try {
            const verifyBody = {
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpaySignature: paymentResponse.razorpay_signature,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            };

            const verifyResponse = await fetch(`${API_BASE_URL}/api/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(verifyBody),
            });

            const verifyText = await verifyResponse.text();

            if (verifyResponse.ok) {
              toast.success("Payment successful. Your order has been placed.");
              navigate("/orders");
            } else {
              toast.error("Payment verification failed. Reason: " + verifyText + ". Payment ID: " + paymentResponse.razorpay_payment_id);
            }
          } catch (error) {
            console.error("Error verifying payment:", error);
            toast.error("Payment verification failed due to a network error. Payment ID: " + (paymentResponse?.razorpay_payment_id || "unknown") + ". Please contact support.");
          }
        },
        prefill: {
          name: profileDraft.username || resolvedContext.username || username,
          email: profileDraft.email || resolvedContext.email || "user@example.com",
          contact: profileDraft.contact || localStorage.getItem(CONTACT_STORAGE_KEY) || "9999999999",
        },
        theme: { color: "#0f766e" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error("Payment failed. " + (error.message || "Please try again."));
      console.error("Error during checkout:", error);
    }
  };

  return (
    <div className="cart-page-shell">
      <Header cartCount={cartItems.length ? totalProducts() : 0} username={username} />
      <main className="cart-main">
        <section className="cart-hero">
          <div>
            <p className="cart-kicker">Secure Checkout</p>
            <h1>Review and place your order</h1>
            <p className="cart-subtext">Apply limited-time coupon, confirm address, and complete payment with your preferred method.</p>
          </div>
          <div className="cart-hero-stats">
            <p>Items: {totalProducts()}</p>
            <p>Subtotal: {formatPrice(subtotalValue)}</p>
            <p>Grand Total: {formatPrice(grandTotal)}</p>
          </div>
        </section>

        {isLoadingCart ? (
          <div className="cart-page">
            <div className="cart-items">
              {Array.from({ length: 3 }).map((_, idx) => (
                <CardSkeleton key={`cart-skeleton-${idx}`} />
              ))}
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="cart-page empty">
            <h2>Your cart is empty</h2>
            <p>Add some items to get started.</p>
            <button type="button" className="checkout-profile-save" onClick={() => navigate("/customerhome")}>Start Shopping</button>
          </div>
        ) : (
          <div className="cart-container">
            <div className="cart-page">
              <button
                type="button"
                className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-indigo-200 bg-indigo-50/50 px-6 py-2.5 text-sm font-bold text-indigo-700 transition-all hover:bg-indigo-100 hover:text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 mb-6"
                onClick={() => navigate("/customerhome")}
              >
                <ArrowLeft size={16} className="text-indigo-500 dark:text-indigo-400" />
                Continue shopping
              </button>

              <div className="cart-header">
                <h2>Shopping Cart</h2>
                <p>You have {cartItems.length} items in your cart</p>
              </div>

              <div className="cart-items">
                {cartItems.map((item) => (
                  <div key={item.product_id} className="cart-item">
                    <img src={item.image_url || "https://via.placeholder.com/80?text=No+Image"} alt={item.name} />
                    <div className="item-details">
                      <div className="item-info">
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                        <p className="item-stock">{getStockValue(item) > 0 ? `Only ${getStockValue(item)} left` : "Out of stock"}</p>
                      </div>
                      <div className="item-actions">
                        <div className="quantity-controls">
                          <button type="button" onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}>-</button>
                          <span className="quantity-display">{item.quantity}</span>
                          <button type="button" onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)} disabled={getStockValue(item) > 0 && item.quantity >= getStockValue(item)}>+</button>
                        </div>
                        <span className="price">{formatPrice(item.total_price)}</span>
                        <button type="button" className="remove-btn" onClick={() => handleRemoveItem(item.product_id)}>Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="checkout-section">
              <h2>Order Summary</h2>

              <div className="checkout-profile-card">
                <h3>Profile + Address for checkout</h3>
                <div className="checkout-profile-grid">
                  <label>Name<input type="text" value={profileDraft.username} onChange={(e) => setProfileDraft((prev) => ({ ...prev, username: e.target.value }))} /></label>
                  <label>Email<input type="email" value={profileDraft.email} onChange={(e) => setProfileDraft((prev) => ({ ...prev, email: e.target.value }))} /></label>
                  <label>Contact<input type="text" value={profileDraft.contact} onChange={(e) => setProfileDraft((prev) => ({ ...prev, contact: e.target.value }))} /></label>
                  <label>Address Line 1<input type="text" value={profileDraft.addressLine1} onChange={(e) => setProfileDraft((prev) => ({ ...prev, addressLine1: e.target.value }))} /></label>
                  <label>Address Line 2<input type="text" value={profileDraft.addressLine2} onChange={(e) => setProfileDraft((prev) => ({ ...prev, addressLine2: e.target.value }))} /></label>
                  <label>City<input type="text" value={profileDraft.city} onChange={(e) => setProfileDraft((prev) => ({ ...prev, city: e.target.value }))} /></label>
                  <label>State<input type="text" value={profileDraft.state} onChange={(e) => setProfileDraft((prev) => ({ ...prev, state: e.target.value }))} /></label>
                  <label>Postal Code<input type="text" value={profileDraft.postalCode} onChange={(e) => setProfileDraft((prev) => ({ ...prev, postalCode: e.target.value }))} /></label>
                  <label>Country<input type="text" value={profileDraft.country} onChange={(e) => setProfileDraft((prev) => ({ ...prev, country: e.target.value }))} /></label>
                </div>
                <button className="checkout-profile-save" type="button" onClick={saveProfileDraft}>Save profile</button>
              </div>

              <div className="checkout-profile-card">
                <h3>Limited-time coupon</h3>
                <div className="checkout-profile-grid">
                  <label>
                    Coupon Code
                    <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter coupon code" />
                  </label>
                </div>
                {couponListLoading ? (
                  <p className="coupon-list-status">Loading available coupons...</p>
                ) : availableCoupons.length ? (
                  <div className="coupon-list">
                    {availableCoupons.map((coupon) => (
                      <button
                        key={coupon.code}
                        type="button"
                        className="coupon-pill"
                        onClick={() => applyCoupon(coupon.code)}
                        title="Apply coupon"
                      >
                        <span className="coupon-code">{coupon.code}</span>
                        <span className="coupon-meta">{formatCouponMeta(coupon)}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="coupon-list-status">No active coupons right now.</p>
                )}
                <div className="profile-edit-actions" style={{ marginTop: 10 }}>
                  <button className="checkout-profile-save" type="button" onClick={applyCoupon} disabled={couponLoading}>{couponLoading ? "Applying..." : "Apply Coupon"}</button>
                  {couponInfo ? <button className="profile-cancel-btn" type="button" onClick={clearCoupon}>Remove</button> : null}
                </div>
              </div>

              <div className="checkout-profile-card">
                <h3>Payment Method</h3>
                <div className="payment-method-grid">
                  {settings.payment?.razorpay ? (
                    <label className="payment-option">
                      <input type="radio" name="paymentMethod" value="RAZORPAY" checked={paymentMethod === "RAZORPAY"} onChange={() => setPaymentMethod("RAZORPAY")} />
                      Razorpay (UPI / Cards / NetBanking)
                    </label>
                  ) : null}
                  {settings.payment?.cod ? (
                    <label className="payment-option">
                      <input type="radio" name="paymentMethod" value="COD" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} />
                      Cash on Delivery
                    </label>
                  ) : null}
                  {settings.payment?.stripe ? (
                    <label className="payment-option payment-disabled">
                      <input type="radio" name="paymentMethod" value="STRIPE" disabled />
                      Stripe (Coming soon)
                    </label>
                  ) : null}
                  {settings.payment?.paypal ? (
                    <label className="payment-option payment-disabled">
                      <input type="radio" name="paymentMethod" value="PAYPAL" disabled />
                      PayPal (Coming soon)
                    </label>
                  ) : null}
                </div>
              </div>

              <div className="checkout-summary">
                <div className="checkout-hint">
                  {freeShippingUnlocked ? (
                    <p>Free shipping unlocked for this order.</p>
                  ) : (
                    <p>Add {formatPrice(remainingForFreeShipping)} more to get free shipping.</p>
                  )}
                </div>
                <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotalValue)}</span></div>
                <div className="summary-row"><span>Shipping</span><span>{formatPrice(shipping)}</span></div>
                <div className="summary-row"><span>GST ({gstPercentage}%)</span><span>{formatPrice(tax)}</span></div>
                <div className="summary-row"><span>Total Products</span><span>{totalProducts()}</span></div>
                <div className="summary-row"><span>Discount</span><span>- {formatPrice(discountValue)}</span></div>
                <div className="summary-row"><span>Payment Mode</span><span>{paymentMethod}</span></div>
                <div className="summary-row total"><span>Total</span><span>{formatPrice(grandTotal)}</span></div>
                <button className="checkout-button" onClick={handleCheckout} disabled={hasOutOfStock || exceedsStock}>{hasOutOfStock || exceedsStock ? "Update cart to continue" : "Proceed to Checkout"}</button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CartPage;






