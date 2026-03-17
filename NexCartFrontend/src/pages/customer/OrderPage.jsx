import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { useToast } from "../../components/ui/ToastContext";
import "../../styles/styles.css";
import API_BASE_URL from '../../config/api';

const formatPrice = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const normalizeStatus = (value) => {
  if (!value) return "Processing";
  return String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const normalizeReturnStatus = (value) => {
  if (!value || value === "null") return "";
  return String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const ORDER_STEPS = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const getStepIndex = (statusRaw) => {
  if (!statusRaw) return 0;
  const status = String(statusRaw).toUpperCase();
  const index = ORDER_STEPS.indexOf(status);
  if (index !== -1) return index;
  if (status === "SUCCESS") return ORDER_STEPS.indexOf("DELIVERED");
  if (status === "CANCELLED" || status === "FAILED") return 0;
  return 0;
};

const invoiceHtml = (order) => {
  const rows = (order.items || [])
    .map(
      (item, index) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${index + 1}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${item.name || "Product"}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${item.quantity || 1}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${formatPrice(item.price_per_unit)}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${formatPrice(item.total_price)}</td>
        </tr>`
    )
    .join("");

  return `
  <html>
    <head>
      <title>Invoice ${order.orderId}</title>
      <meta charset="utf-8" />
    </head>
    <body style="font-family:Segoe UI,Arial,sans-serif;background:#f8fafc;padding:28px;color:#0f172a;">
      <div style="max-width:900px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
        <div style="padding:22px 24px;background:linear-gradient(135deg,#0f766e,#0ea5a3);color:#fff;display:flex;justify-content:space-between;gap:16px;">
          <div>
            <h2 style="margin:0 0 6px;font-size:24px;">NexCart Invoice</h2>
            <p style="margin:0;opacity:0.9;">Order ID: <b>${order.orderId}</b></p>
          </div>
          <div style="text-align:right;">
            <p style="margin:0 0 4px;">Date</p>
            <p style="margin:0;font-weight:700;">${new Date(order.createdAt).toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div style="padding:20px 24px;display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <div>
            <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;">Ship To</p>
            <p style="margin:0;font-weight:700;">${order.shippingAddress || "Address not available"}</p>
          </div>
          <div>
            <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;">Order Summary</p>
            <p style="margin:0 0 4px;">Items: <b>${order.totalItems}</b></p>
            <p style="margin:0 0 4px;">Coupon: <b>${order.couponCode || "None"}</b></p>
            <p style="margin:0 0 4px;">Payment: <b>${order.paymentMethod || "NA"}</b></p>
            <p style="margin:0;">Discount: <b>${formatPrice(order.discountAmount)}</b></p>
          </div>
        </div>

        <div style="padding:0 24px 20px;">
          <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
            <thead>
              <tr style="background:#f1f5f9;">
                <th style="text-align:left;padding:10px;">#</th>
                <th style="text-align:left;padding:10px;">Product</th>
                <th style="text-align:left;padding:10px;">Qty</th>
                <th style="text-align:left;padding:10px;">Unit Price</th>
                <th style="text-align:left;padding:10px;">Line Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>

        <div style="padding:0 24px 24px;display:flex;justify-content:flex-end;">
          <div style="min-width:280px;border:1px solid #e2e8f0;border-radius:10px;padding:12px;">
            <p style="margin:0 0 8px;display:flex;justify-content:space-between;"><span>Subtotal</span><b>${formatPrice(order.subtotalAmount)}</b></p>
            <p style="margin:0 0 8px;display:flex;justify-content:space-between;"><span>Shipping</span><b>${formatPrice(order.shippingAmount)}</b></p>
            <p style="margin:0 0 8px;display:flex;justify-content:space-between;"><span>GST</span><b>${formatPrice(order.taxAmount)}</b></p>
            <p style="margin:0 0 8px;display:flex;justify-content:space-between;"><span>Discount</span><b>- ${formatPrice(order.discountAmount)}</b></p>
            <p style="margin:0;padding-top:8px;border-top:1px dashed #cbd5e1;display:flex;justify-content:space-between;font-size:18px;"><span>Total</span><b>${formatPrice(order.totalAmount)}</b></p>
          </div>
        </div>
      </div>
    </body>
  </html>`;
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [username, setUsername] = useState("");
  const [cartError, setCartError] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [returnDialog, setReturnDialog] = useState({ open: false, orderId: "", productId: null, productName: "", reason: "", requestType: "RETURN" });
  const [returnLoading, setReturnLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [timeFilter, setTimeFilter] = useState("ALL");
  const [sortFilter, setSortFilter] = useState("NEWEST");

  useEffect(() => {
    fetchOrders();
    fetchCartCount();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();
      setOrders(data.products || []);
      setUsername(data.username || "Guest");
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchCartCount = async () => {
    setIsCartLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/items`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        setCartCount(0);
        setCartError(true);
        return;
      }

      const cartData = await response.json();
      const total = (cartData?.cart?.products || []).reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      );

      setCartCount(total);
      setCartError(false);
    } catch (fetchError) {
      console.error("Error fetching cart count:", fetchError);
      setCartError(true);
      setCartCount(0);
    } finally {
      setIsCartLoading(false);
    }
  };

  const groupedOrders = useMemo(() => {
    const grouped = new Map();

    orders.forEach((item) => {
      const orderId = item.order_id || "UNKNOWN";
      if (!grouped.has(orderId)) {
        grouped.set(orderId, {
          orderId,
          status: normalizeStatus(item.order_status || item.status),
          orderStatus: item.order_status || item.status,
          paymentStatus: item.payment_status || "",
          trackingNumber: item.tracking_number || "",
          createdAt: item.created_at,
          shippingAddress: item.shipping_address,
          couponCode: item.coupon_code,
          discountAmount: Number(item.discount_amount || 0),
          subtotalAmount: Number(item.subtotal_amount || 0),
          shippingAmount: Number(item.shipping_amount || 0),
          taxAmount: Number(item.tax_amount || 0),
          totalAmount: Number(item.total_amount || 0),
          paymentMethod: item.payment_method || "",
          items: [],
        });
      }

      grouped.get(orderId).items.push(item);
    });

    return Array.from(grouped.values()).map((group) => {
      const totalItems = group.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      const lineTotal = group.items.reduce((sum, item) => sum + Number(item.total_price || 0), 0);
      const orderTotal = group.totalAmount > 0 ? group.totalAmount : lineTotal;
      return { ...group, totalItems, totalAmount: orderTotal };
    });
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();

    return groupedOrders
      .filter((order) => {
        const statusLabel = normalizeStatus(order.orderStatus || order.status || "");
        if (statusFilter !== "ALL" && statusLabel.toUpperCase() !== statusFilter) {
          return false;
        }

        if (!order.createdAt) return true;
        const createdAt = new Date(order.createdAt);
        if (Number.isNaN(createdAt.getTime())) return true;

        if (timeFilter === "LAST_30") {
          const cutoff = new Date(now);
          cutoff.setDate(cutoff.getDate() - 30);
          return createdAt >= cutoff;
        }
        if (timeFilter === "LAST_90") {
          const cutoff = new Date(now);
          cutoff.setDate(cutoff.getDate() - 90);
          return createdAt >= cutoff;
        }
        if (timeFilter === "THIS_YEAR") {
          return createdAt.getFullYear() === currentYear;
        }

        return true;
      })
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;

        if (sortFilter === "OLDEST") return aTime - bTime;
        if (sortFilter === "TOTAL_HIGH") return Number(b.totalAmount || 0) - Number(a.totalAmount || 0);
        if (sortFilter === "TOTAL_LOW") return Number(a.totalAmount || 0) - Number(b.totalAmount || 0);
        return bTime - aTime;
      });
  }, [groupedOrders, statusFilter, timeFilter, sortFilter]);

  const summary = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalAmount = filteredOrders.reduce((acc, item) => acc + Number(item.totalAmount || 0), 0);
    const totalItems = filteredOrders.reduce((acc, item) => acc + Number(item.totalItems || 0), 0);
    return { totalOrders, totalAmount, totalItems };
  }, [filteredOrders]);

  const openReturnDialog = (orderId, productId, productName) => {
    setReturnDialog({ open: true, orderId, productId, productName, reason: "", requestType: "RETURN" });
  };

  const openInvoiceView = (order) => {
    const win = window.open("", "_blank", "width=1100,height=760");
    if (!win) {
      toast.error("Popup blocked. Please allow popups to view the invoice.");
      return;
    }
    win.document.write(invoiceHtml(order));
    win.document.close();
  };

  const downloadInvoice = (order) => {
    const blob = new Blob([invoiceHtml(order)], { type: "text/html;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${order.orderId}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast.success("Invoice downloaded successfully.");
  };

  const submitReturnRequest = async () => {
    if (!returnDialog.orderId || !returnDialog.productId) return;

    setReturnLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${encodeURIComponent(returnDialog.orderId)}/return-request`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: returnDialog.reason || `Customer requested ${returnDialog.requestType.toLowerCase()}`,
          requestType: returnDialog.requestType,
          productId: returnDialog.productId,
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(body?.error || "Unable to submit request. Please try again.");
        return;
      }

      toast.success(body?.message || "Request submitted successfully.");
      setReturnDialog({ open: false, orderId: "", productId: null, productName: "", reason: "", requestType: "RETURN" });
      fetchOrders();
    } catch (issue) {
      toast.error("Network error while submitting request. Please try again.");
    } finally {
      setReturnLoading(false);
    }
  };

  const loadingSkeletons = Array.from({ length: 3 }, (_, index) => `order-skeleton-${index}`);

  return (
    <div className="customer-homepage">
      <Header cartCount={isCartLoading ? "..." : cartError ? "0" : cartCount} username={username} />

      <main className="main-content orders-main">
        <section className="orders-hero">
          <div>
            <p className="orders-kicker">Track & Manage</p>
            <h1>Your Orders</h1>
            <p className="orders-subtext">Manage tracking, returns/refunds, and delivery details from one place.</p>
          </div>
          <div className="orders-stats">
            <p>Total Orders: {summary.totalOrders}</p>
            <p>Total Items: {summary.totalItems}</p>
            <p>Total Spent: {formatPrice(summary.totalAmount)}</p>
          </div>
        </section>

        <section className="orders-filters" aria-label="Filter orders">
          <div className="orders-filter-group">
            <label className="orders-filter-label" htmlFor="orders-status-filter">Status</label>
            <select
              id="orders-status-filter"
              className="orders-filter-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="OUT FOR DELIVERY">Out For Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="FAILED">Failed</option>
              <option value="RETURN REQUESTED">Return Requested</option>
              <option value="RETURN APPROVED">Return Approved</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
          <div className="orders-filter-group">
            <label className="orders-filter-label" htmlFor="orders-time-filter">Time</label>
            <select
              id="orders-time-filter"
              className="orders-filter-select"
              value={timeFilter}
              onChange={(event) => setTimeFilter(event.target.value)}
            >
              <option value="ALL">All time</option>
              <option value="LAST_30">Last 30 days</option>
              <option value="LAST_90">Last 90 days</option>
              <option value="THIS_YEAR">This year</option>
            </select>
          </div>
          <div className="orders-filter-group">
            <label className="orders-filter-label" htmlFor="orders-sort-filter">Sort by</label>
            <select
              id="orders-sort-filter"
              className="orders-filter-select"
              value={sortFilter}
              onChange={(event) => setSortFilter(event.target.value)}
            >
              <option value="NEWEST">Newest first</option>
              <option value="OLDEST">Oldest first</option>
              <option value="TOTAL_HIGH">Order total: high to low</option>
              <option value="TOTAL_LOW">Order total: low to high</option>
            </select>
          </div>
          <div className="orders-filter-actions">
            <button
              type="button"
              className="orders-filter-clear"
              onClick={() => {
                setStatusFilter("ALL");
                setTimeFilter("ALL");
                setSortFilter("NEWEST");
              }}
              disabled={statusFilter === "ALL" && timeFilter === "ALL" && sortFilter === "NEWEST"}
            >
              Clear
            </button>
          </div>
        </section>

        {loading && (
          <section className="orders-skeleton-list" aria-label="Loading orders">
            {loadingSkeletons.map((key) => (
              <article key={key} className="order-card-upgraded order-card-skeleton">
                <div className="order-card-top">
                  <div>
                    <p className="order-id-label skeleton-box skeleton-line-xs" />
                    <p className="skeleton-box skeleton-line-md" />
                  </div>
                  <span className="order-status-pill skeleton-box skeleton-pill" />
                </div>
                <div className="order-card-body-upgraded">
                  <div className="order-product-image-upgraded skeleton-box" />
                  <div className="order-details-upgraded">
                    <p className="skeleton-box skeleton-line-lg" />
                    <p className="skeleton-box skeleton-line-md" />
                    <p className="skeleton-box skeleton-line-sm" />
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        {error && <p className="error-message">{error}</p>}

        {!loading && !error && groupedOrders.length === 0 && (
          <section className="orders-empty">
            <h2>No orders yet</h2>
            <p>Start shopping to see your orders appear here in real time.</p>
          </section>
        )}

        {!loading && !error && groupedOrders.length > 0 && filteredOrders.length === 0 && (
          <section className="orders-empty">
            <h2>No orders in this filter</h2>
            <p>Try adjusting the filters to see more results.</p>
          </section>
        )}

        {!loading && !error && filteredOrders.length > 0 && (
          <section className="orders-list-upgraded">
            {filteredOrders.map((order) => {
              const activeStep = getStepIndex(order.orderStatus);
              return (
                <article key={order.orderId} className="order-card-upgraded order-card-market">
                  <div className="order-card-top">
                    <div>
                      <p className="order-id-label">Order ID</p>
                      <h3>{order.orderId}</h3>
                    </div>
                    <div className="order-status-stack">
                      <span className={`order-status-pill status-${order.status.toLowerCase().replace(/\s+/g, "-")}`}>{order.status}</span>
                      {order.paymentStatus ? (
                        <span className="order-return-pill">Payment: {normalizeStatus(order.paymentStatus)}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="order-meta-grid order-meta-grid-main">
                    <p><span>Items</span><strong>{order.totalItems}</strong></p>
                    <p><span>Order Total</span><strong>{formatPrice(order.totalAmount)}</strong></p>
                    <p><span>Coupon</span><strong>{order.couponCode || "None"}</strong></p>
                    <p><span>Discount</span><strong>{formatPrice(order.discountAmount)}</strong></p>
                    <p><span>Shipping</span><strong>{formatPrice(order.shippingAmount)}</strong></p>
                    <p><span>Payment</span><strong>{order.paymentMethod || "NA"}</strong></p>
                  <p><span>Tracking</span><strong>{order.trackingNumber || "-"}</strong></p>
                  </div>

                  <ol className="order-timeline" aria-label="Order status">
                    {ORDER_STEPS.map((step, index) => {
                      const isComplete = index < activeStep;
                      const isCurrent = index === activeStep;
                      const isUpcoming = index > activeStep;

                      return (
                        <li
                          key={step}
                          className={`order-timeline-step ${isComplete ? "is-complete" : ""} ${isCurrent ? "is-current" : ""} ${isUpcoming ? "is-upcoming" : ""}`}
                          aria-current={isCurrent ? "step" : undefined}
                          aria-disabled={isUpcoming ? true : undefined}
                        >
                          <span className="order-timeline-node" aria-hidden="true" />
                          <span className="order-timeline-label">{normalizeStatus(step)}</span>
                        </li>
                      );
                    })}
                  </ol>

                  <p className="order-desc"><strong>Shipping Address:</strong> {order.shippingAddress || "Not available"}</p>

                  <div className="order-items-grid">
                    {order.items.map((item, index) => (
                      <article key={`${order.orderId}-${item.product_id}-${index}`} className="order-item-compact">
                        <img
                          src={item.image_url || "https://via.placeholder.com/300x300?text=Product"}
                          alt={item.name || "Product"}
                          className="order-product-image-upgraded"
                        />
                        <div className="order-details-upgraded">
                          <h4>{item.name || "Product item"}</h4>
                          <p className="order-desc">Qty {item.quantity || 1} | {formatPrice(item.price_per_unit)}</p>
                          <p className="order-desc"><strong>Line Total:</strong> {formatPrice(item.total_price)}</p>
                          {item.return_status ? (
                            <p className="order-desc"><strong>{item.return_type || "RETURN"}:</strong> {normalizeReturnStatus(item.return_status)}</p>
                          ) : null}
                          {item.refund_amount || item.refund_reference ? (
                            <div className="order-status-stack">
                              {item.refund_amount ? (
                                <span className="order-return-pill refund-amount">Refund {formatPrice(item.refund_amount)}</span>
                              ) : null}
                              {item.refund_reference ? (
                                <span className="order-return-pill refund-ref">Refund Ref {item.refund_reference}</span>
                              ) : null}
                            </div>
                          ) : null}
                          <div className="order-item-actions">
                            <button
                              type="button"
                              className="order-action-btn order-action-return"
                              onClick={() => openReturnDialog(order.orderId, item.product_id, item.name)}
                              disabled={Boolean(item.return_status)}
                            >
                              {item.return_status ? `${item.return_type || "RETURN"} ${normalizeReturnStatus(item.return_status)}` : "Return / Refund"}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="order-actions-row">
                    <button
                      type="button"
                      className="order-action-btn order-action-track"
                      onClick={() => navigate(`/support/track-order?orderId=${encodeURIComponent(order.orderId)}`)}
                    >
                      Track Order
                    </button>

                    <button
                      type="button"
                      className="order-action-btn order-action-invoice"
                      onClick={() => openInvoiceView(order)}
                    >
                      View Invoice
                    </button>

                    <button
                      type="button"
                      className="order-action-btn order-action-download"
                      onClick={() => downloadInvoice(order)}
                    >
                      Download Invoice
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {returnDialog.open ? (
        <div className="support-modal-backdrop" onClick={() => setReturnDialog({ open: false, orderId: "", productId: null, productName: "", reason: "", requestType: "RETURN" })}>
          <div className="support-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Request Return / Refund</h3>
            <div className="return-type-toggle">
              <button
                type="button"
                className={`return-type-btn ${returnDialog.requestType === "RETURN" ? "active" : ""}`}
                onClick={() => setReturnDialog((prev) => ({ ...prev, requestType: "RETURN" }))}
              >
                Return
              </button>
              <button
                type="button"
                className={`return-type-btn ${returnDialog.requestType === "REFUND" ? "active" : ""}`}
                onClick={() => setReturnDialog((prev) => ({ ...prev, requestType: "REFUND" }))}
              >
                Refund
              </button>
            </div>
            <p>Order ID: <strong>{returnDialog.orderId}</strong></p>
            <p>Product: <strong>{returnDialog.productName}</strong></p>
            <textarea
              rows={4}
              placeholder={`Tell us reason for ${returnDialog.requestType.toLowerCase()}`}
              value={returnDialog.reason}
              onChange={(event) => setReturnDialog((prev) => ({ ...prev, reason: event.target.value }))}
            />
            <div className="support-modal-actions">
              <button type="button" onClick={() => setReturnDialog({ open: false, orderId: "", productId: null, productName: "", reason: "", requestType: "RETURN" })}>Cancel</button>
              <button type="button" onClick={submitReturnRequest} disabled={returnLoading}>
                {returnLoading ? "Submitting..." : `Submit ${returnDialog.requestType}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Footer />
    </div>
  );
}






