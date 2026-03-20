import React, { useEffect, useMemo, useState } from "react";
import { Eye, RefreshCw, PackageCheck, PackageX, Truck, BadgeDollarSign } from "lucide-react";
import DataTable from "../components/DataTable";
import AdminSelect from "../components/AdminSelect";
import { adminApi } from "../services/adminApi";
import { formatCurrency, formatDate } from "../utils/format";
import { useToast } from "../../components/ui/ToastContext";

const statuses = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "SUCCESS",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURN_APPROVED",
  "REFUNDED",
  "FAILED",
];

const statusTone = (value = "") => {
  const key = String(value).toUpperCase();
  if (["SUCCESS", "DELIVERED"].includes(key)) return "bg-emerald-100 text-emerald-700";
  if (["CONFIRMED"].includes(key)) return "bg-blue-100 text-blue-700";
  if (["PROCESSING"].includes(key)) return "bg-indigo-100 text-indigo-700";
  if (["SHIPPED", "OUT_FOR_DELIVERY"].includes(key)) return "bg-sky-100 text-sky-700";
  if (["RETURN_REQUESTED"].includes(key)) return "bg-amber-100 text-amber-700";
  if (["RETURN_APPROVED", "REFUNDED"].includes(key)) return "bg-violet-100 text-violet-700";
  if (["FAILED"].includes(key)) return "bg-rose-100 text-rose-700";
  if (["CANCELLED"].includes(key)) return "bg-slate-200 text-slate-700";
  if (["PENDING"].includes(key)) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
};

const formatStatusLabel = (value) => {
  if (value === "ALL") return "All Orders";
  return String(value)
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [refundInputs, setRefundInputs] = useState({});
  const [updatingReturnFor, setUpdatingReturnFor] = useState("");
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [timeFilter, setTimeFilter] = useState("ALL");
  const [sortFilter, setSortFilter] = useState("NEWEST");

  const loadOrders = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const response = await adminApi.getOrders();
      const data = Array.isArray(response) ? response : response?.data || [];
      setOrders(data || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Unable to load orders. Please try again.", error);
      toast.error(error.message || "Unable to load orders. Please try again.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    const timer = setInterval(() => {
      loadOrders({ silent: true });
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    const currentYear = now.getFullYear();

    const filtered = orders.filter((row) => {
      const currentStatus = String(row.orderStatus || row.status || "").toUpperCase();
      const matchesOrderStatus = statusFilter === "ALL" ? true : currentStatus === statusFilter;
      if (!matchesOrderStatus) return false;

      if (timeFilter !== "ALL" && row.createdAt) {
        const createdAt = new Date(row.createdAt);
        if (!Number.isNaN(createdAt.getTime())) {
          if (timeFilter === "LAST_7") {
            const cutoff = new Date(now);
            cutoff.setDate(cutoff.getDate() - 7);
            if (createdAt < cutoff) return false;
          }
          if (timeFilter === "LAST_30") {
            const cutoff = new Date(now);
            cutoff.setDate(cutoff.getDate() - 30);
            if (createdAt < cutoff) return false;
          }
          if (timeFilter === "LAST_90") {
            const cutoff = new Date(now);
            cutoff.setDate(cutoff.getDate() - 90);
            if (createdAt < cutoff) return false;
          }
          if (timeFilter === "THIS_YEAR" && createdAt.getFullYear() !== currentYear) return false;
        }
      }

      if (!q) return true;
      return (
        String(row.orderId || "").toLowerCase().includes(q) ||
        String(row.userId || "").toLowerCase().includes(q) ||
        String((row.products || []).join(" ")).toLowerCase().includes(q)
      );
    });

    return filtered.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (sortFilter === "OLDEST") return aTime - bTime;
      if (sortFilter === "TOTAL_HIGH") return Number(b.totalAmount || 0) - Number(a.totalAmount || 0);
      if (sortFilter === "TOTAL_LOW") return Number(a.totalAmount || 0) - Number(b.totalAmount || 0);
      return bTime - aTime;
    });
  }, [orders, search, statusFilter, timeFilter, sortFilter]);

  const orderStats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => String(o.orderStatus || o.status).toUpperCase() === "PENDING").length;
    const returnRequested = orders.filter((o) => String(o.orderStatus || o.status).toUpperCase() === "RETURN_REQUESTED").length;
    const refunded = orders.filter((o) => String(o.orderStatus || o.status).toUpperCase() === "REFUNDED").length;
    return { total, pending, returnRequested, refunded };
  }, [orders]);

  const updateStatus = async (id, status) => {
    try {
      await adminApi.updateOrderStatus(id, status);
      toast.success(`Order ${id} updated to ${status} successfully.`);
      await loadOrders({ silent: true });
    } catch (error) {
      toast.error(error.message || "Unable to update order status. Please try again.");
    }
  };

  const updateReturnStatus = async (orderId, productId, status, refundAmount, refundReference) => {
    setUpdatingReturnFor(`${orderId}-${productId}`);
    try {
      await adminApi.updateReturnStatus(orderId, productId, status, `Updated by admin from Orders panel to ${status}`, refundAmount, refundReference);
      toast.success(`Request for ${orderId} updated to ${status}.`);
      await loadOrders({ silent: true });
      if (selectedOrder?.orderId === orderId) {
        const refreshed = await adminApi.getOrders();
        const updated = refreshed.find((item) => item.orderId === orderId);
        setSelectedOrder(updated || null);
      }
    } catch (error) {
      toast.error(error.message || "Unable to update return/refund status. Please try again.");
    } finally {
      setUpdatingReturnFor("");
    }
  };

  const saveTracking = async () => {
    if (!selectedOrder) return;
    const status = selectedOrder.orderStatus || selectedOrder.status;
    try {
      await adminApi.updateOrderStatus(selectedOrder.orderId, status, trackingInput);
      toast.success("Tracking number updated.");
      await loadOrders({ silent: true });
      const refreshed = await adminApi.getOrders();
      const updated = refreshed.find((item) => item.orderId === selectedOrder.orderId);
      setSelectedOrder(updated || null);
    } catch (error) {
      toast.error(error.message || "Unable to update tracking number. Please try again.");
    }
  };

  const openDetails = (row) => {
    setSelectedOrder(row);
    setTrackingInput(row?.trackingNumber || "");
  };

  const badgeClassForType = (type) => {
    if (type === "REFUND") return "bg-violet-100 text-violet-700";
    if (type === "RETURN") return "bg-sky-100 text-sky-700";
    return "bg-slate-100 text-slate-500";
  };

  const badgeClassForStatus = (status) => {
    if (status === "REQUESTED") return "bg-amber-100 text-amber-700";
    if (status === "APPROVED") return "bg-emerald-100 text-emerald-700";
    if (status === "REJECTED") return "bg-rose-100 text-rose-700";
    if (status === "REFUNDED") return "bg-indigo-100 text-indigo-700";
    return "bg-slate-100 text-slate-500";
  };

  const columns = [
    { key: "orderId", label: "Order ID" },
    { key: "userId", label: "Customer ID" },
    { key: "products", label: "Product List", render: (row) => <span className="text-xs">{(row.products || []).join(", ")}</span> },
    { key: "couponCode", label: "Coupon", render: (row) => row.couponCode || "-" },
    { key: "totalAmount", label: "Total Amount", render: (row) => formatCurrency(row.totalAmount) },
    { key: "createdAt", label: "Date", render: (row) => formatDate(row.createdAt) },
    {
      key: "returnSummary",
      label: "Return/Refund",
      render: (row) => {
        const returnRequests = Array.isArray(row.returnRequests) ? row.returnRequests : [];
        if (!returnRequests.length) return "-";
        return <span className="text-xs font-semibold text-slate-700">{returnRequests.length} request(s)</span>;
      },
    },
    {
      key: "orderStatus",
      label: "Status",
      render: (row) => (
        <AdminSelect
          value={row.orderStatus || row.status}
          onChange={(next) => updateStatus(row.orderId, next)}
          options={statuses.filter((s) => s !== "ALL").map((status) => ({ value: status, label: formatStatusLabel(status) }))}
          size="sm"
          className="min-w-[160px]"
        />
      ),
    },
    {
      key: "details",
      label: "Details",
      render: (row) => (
        <button
          onClick={() => openDetails(row)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Eye className="h-4 w-4" />
          View
        </button>
      ),
    },
  ];

  return (
    <section className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="text-xs text-slate-500">Total Orders</p>
          <p className="text-lg font-bold text-slate-900">{orderStats.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-amber-50 p-3 text-sm">
          <p className="text-xs text-amber-700">Pending</p>
          <p className="text-lg font-bold text-amber-800">{orderStats.pending}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-violet-50 p-3 text-sm">
          <p className="text-xs text-violet-700">Return Requested</p>
          <p className="text-lg font-bold text-violet-800">{orderStats.returnRequested}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-emerald-50 p-3 text-sm">
          <p className="text-xs text-emerald-700">Refunded</p>
          <p className="text-lg font-bold text-emerald-800">{orderStats.refunded}</p>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search order id, customer, product"
          className="sm:col-span-2 lg:col-span-2 w-full rounded-lg border border-slate-200 px-3 py-2"
        />
        <AdminSelect
          value={statusFilter}
          onChange={(next) => setStatusFilter(next)}
          placeholder="Order Status"
          options={statuses.map((status) => ({ value: status, label: formatStatusLabel(status) }))}
        />
        <AdminSelect
          value={timeFilter}
          onChange={(next) => setTimeFilter(next)}
          placeholder="Time Range"
          options={[
            { value: "ALL", label: "All time" },
            { value: "LAST_7", label: "Last 7 days" },
            { value: "LAST_30", label: "Last 30 days" },
            { value: "LAST_90", label: "Last 90 days" },
            { value: "THIS_YEAR", label: "This year" },
          ]}
        />
        <AdminSelect
          value={sortFilter}
          onChange={(next) => setSortFilter(next)}
          placeholder="Sort By"
          options={[
            { value: "NEWEST", label: "Newest first" },
            { value: "OLDEST", label: "Oldest first" },
            { value: "TOTAL_HIGH", label: "Total high to low" },
            { value: "TOTAL_LOW", label: "Total low to high" },
          ]}
        />
        <button onClick={() => loadOrders()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50 sm:col-span-2 lg:col-span-1">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Orders
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Live updates every 15s{lastUpdated ? ` | Last updated ${lastUpdated.toLocaleTimeString()}` : ""}
      </p>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading orders...</div>
      ) : (
        <DataTable columns={columns} data={filteredOrders} emptyText="No orders found." />
      )}

      {selectedOrder ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Order Details - {selectedOrder.orderId}</h3>
                <p className="text-xs text-slate-500">Placed on {formatDate(selectedOrder.createdAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(selectedOrder.orderStatus || selectedOrder.status)}`}>
                  {selectedOrder.orderStatus || selectedOrder.status}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {selectedOrder.paymentStatus || "-"}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 md:grid-cols-2">
              <div className="space-y-2">
                <p><b>Customer ID:</b> {selectedOrder.userId}</p>
                <p><b>Coupon:</b> {selectedOrder.couponCode || "N/A"}</p>
                <p><b>Discount:</b> {selectedOrder.discountAmount ? formatCurrency(selectedOrder.discountAmount) : "INR 0.00"}</p>
                <p><b>Total:</b> {formatCurrency(selectedOrder.totalAmount)}</p>
              </div>
              <div className="space-y-2">
                <p><b>Address:</b> {selectedOrder.shippingAddress || "N/A"}</p>
                <p><b>Payment:</b> {selectedOrder.paymentStatus || "-"}</p>
                <p><b>Tracking:</b> {selectedOrder.trackingNumber || "Not set"}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">Tracking</span>
              <input
                value={trackingInput}
                onChange={(event) => setTrackingInput(event.target.value)}
                placeholder="Enter tracking number"
                className="min-w-[220px] rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
              />
              <button
                onClick={saveTracking}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Save Tracking
              </button>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-700">Line Items</h4>
              <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-[640px] text-xs">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Unit Price</th>
                      <th className="px-3 py-2">Total</th>
                      <th className="px-3 py-2">Return/Refund</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).length ? selectedOrder.items.map((item) => (
                      <tr key={`${selectedOrder.orderId}-${item.productId}`} className="border-t border-slate-100">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700">{item.productName || `Product #${item.productId}`}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">{item.quantity}</td>
                        <td className="px-3 py-2">{formatCurrency(item.pricePerUnit)}</td>
                        <td className="px-3 py-2">{formatCurrency(item.totalPrice)}</td>
                        <td className="px-3 py-2">
                          {item.returnStatus ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${badgeClassForStatus(String(item.returnStatus || ""))}`}>
                                {item.returnStatus}
                              </span>
                              {item.returnType ? (
                                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${badgeClassForType(String(item.returnType || ""))}`}>
                                  {item.returnType}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-3 py-5 text-center text-slate-500">No line items found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-emerald-600" />
                <h4 className="text-sm font-semibold text-slate-700">Return/Refund Requests</h4>
              </div>
              {Array.isArray(selectedOrder.returnRequests) && selectedOrder.returnRequests.length ? (
                <div className="space-y-2">
                  {selectedOrder.returnRequests.map((req) => (
                    <div key={`${req.orderId}-${req.productId}`} className="rounded-xl border border-slate-200 p-3 text-xs text-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${badgeClassForType(String(req.requestType || "RETURN"))}`}>
                            {String(req.requestType || "RETURN")}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${badgeClassForStatus(String(req.status || ""))}`}>
                            {String(req.status || "")}
                          </span>
                          {req.refundStatus ? (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{req.refundStatus}</span>
                          ) : null}
                        </div>
                        {String(req.status || "").toUpperCase() === "APPROVED" ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              value={refundInputs[`${req.orderId}-${req.productId}`]?.amount || ""}
                              onChange={(event) =>
                                setRefundInputs((prev) => ({
                                  ...prev,
                                  [`${req.orderId}-${req.productId}`]: {
                                    ...prev[`${req.orderId}-${req.productId}`],
                                    amount: event.target.value,
                                  },
                                }))
                              }
                              placeholder="Refund amount"
                              className="min-w-[120px] rounded-md border border-slate-200 px-2 py-1 text-[11px]"
                            />
                            <input
                              value={refundInputs[`${req.orderId}-${req.productId}`]?.ref || ""}
                              onChange={(event) =>
                                setRefundInputs((prev) => ({
                                  ...prev,
                                  [`${req.orderId}-${req.productId}`]: {
                                    ...prev[`${req.orderId}-${req.productId}`],
                                    ref: event.target.value,
                                  },
                                }))
                              }
                              placeholder="Refund ref"
                              className="min-w-[140px] rounded-md border border-slate-200 px-2 py-1 text-[11px]"
                            />
                          </div>
                        ) : null}
                        <div className="flex flex-wrap gap-2">
                          {String(req.status || "").toUpperCase() === "REQUESTED" ? (
                            <>
                              <button
                                onClick={() => updateReturnStatus(req.orderId, req.productId, "APPROVED")}
                                disabled={updatingReturnFor === `${req.orderId}-${req.productId}`}
                                className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateReturnStatus(req.orderId, req.productId, "REJECTED")}
                                disabled={updatingReturnFor === `${req.orderId}-${req.productId}`}
                                className="rounded-md bg-rose-600 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                              >
                                Reject
                              </button>
                            </>
                          ) : null}

                          {String(req.status || "").toUpperCase() === "APPROVED" ? (
                            <button
                              onClick={() => updateReturnStatus(req.orderId, req.productId, "REFUNDED", refundInputs[`${req.orderId}-${req.productId}`]?.amount, refundInputs[`${req.orderId}-${req.productId}`]?.ref)}
                              disabled={updatingReturnFor === `${req.orderId}-${req.productId}`}
                              className="rounded-md bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                            >
                              Mark Refunded
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <PackageX className="h-3 w-3" /> Product ID: {req.productId}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Truck className="h-3 w-3" /> Reason: {req.reason || "-"}
                        </span>
                        {req.refundAmount ? (
                          <span className="inline-flex items-center gap-1">
                            <BadgeDollarSign className="h-3 w-3" /> Refund: INR {req.refundAmount}
                          </span>
                        ) : null}
                        {req.refundReference ? (
                          <span className="inline-flex items-center gap-1">
                            <PackageCheck className="h-3 w-3" /> Ref: {req.refundReference}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No return requests yet.</p>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setSelectedOrder(null)} className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white">Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default OrdersPage;
