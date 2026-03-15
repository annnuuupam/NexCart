import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, ShoppingBag, Users, Package } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import { adminApi } from "../services/adminApi";
import { formatCurrency, formatNumber, formatDate } from "../utils/format";
import { useToast } from "../../components/ui/ToastContext";
import { CardSkeleton } from "../../components/ui/Skeletons";

const formatCompact = (value) => {
  const amount = Number(value || 0);
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return `${Math.round(amount)}`;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [overview, setOverview] = useState({ metrics: {}, products: [], users: [], analytics: { dailyRevenue: [], monthlyRevenue: [] } });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, orders] = await Promise.all([adminApi.getOverview(), adminApi.getOrders()]);
      setOverview(overviewData || { metrics: {}, products: [], users: [], analytics: { dailyRevenue: [], monthlyRevenue: [] } });
      const recent = [...(orders || [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 8);
      setRecentOrders(recent);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Dashboard load failed", error);
      toast.error(error.message || "Unable to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const salesSeries = useMemo(() => {
    const source = overview?.analytics?.dailyRevenue?.length
      ? overview.analytics.dailyRevenue
      : (overview?.analytics?.monthlyRevenue || []);

    return source.map((point) => ({ name: point.label, value: Number(point.value || 0) }));
  }, [overview]);

  const bestSellingProducts = useMemo(() => {
    return (overview?.products || [])
      .map((item) => ({ id: item.productId, name: item.name, sold: Number(item.soldUnits || 0) }))
      .filter((item) => item.sold > 0)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }, [overview]);

  const lowStockProducts = useMemo(() => {
    return (overview?.products || [])
      .filter((item) => Number(item.remainingStock || 0) <= 10)
      .sort((a, b) => Number(a.remainingStock || 0) - Number(b.remainingStock || 0))
      .slice(0, 5);
  }, [overview]);

  const inventoryStats = useMemo(() => {
    const products = overview?.products || [];
    const total = products.length;
    const critical = products.filter((item) => Number(item.remainingStock || 0) <= 3).length;
    const warning = products.filter((item) => {
      const stock = Number(item.remainingStock || 0);
      return stock > 3 && stock <= 10;
    }).length;
    const healthy = Math.max(0, total - critical - warning);
    return { total, critical, warning, healthy };
  }, [overview]);

  const openLowStockProducts = (product) => {
    const search = new URLSearchParams();
    search.set("stock", "low");
    if (product?.productId) {
      search.set("focus", String(product.productId));
      if (product?.name) search.set("q", product.name);
    }
    navigate(`/admindashboard/products?${search.toString()}`);
  };

  const getOrderStatusClass = (status) => {
    const key = String(status || "").toUpperCase();
    if (key === "SUCCESS") return "bg-emerald-100 text-emerald-700";
    if (key === "DELIVERED") return "bg-emerald-100 text-emerald-700";
    if (key === "CONFIRMED") return "bg-blue-100 text-blue-700";
    if (key === "PROCESSING") return "bg-indigo-100 text-indigo-700";
    if (key === "SHIPPED" || key === "OUT_FOR_DELIVERY") return "bg-sky-100 text-sky-700";
    if (key === "RETURN_REQUESTED") return "bg-amber-100 text-amber-700";
    if (key === "RETURN_APPROVED") return "bg-violet-100 text-violet-700";
    if (key === "REFUNDED") return "bg-violet-100 text-violet-700";
    if (key === "FAILED") return "bg-rose-100 text-rose-700";
    if (key === "PENDING") return "bg-amber-100 text-amber-700";
    if (key === "CANCELLED") return "bg-slate-200 text-slate-700";
    return "bg-slate-100 text-slate-700";
  };

  const orderColumns = [
    { key: "orderId", label: "Order ID" },
    { key: "userId", label: "Customer ID" },
    {
      key: "products",
      label: "Products",
      render: (row) => (
        <span className="line-clamp-2 max-w-xs text-xs text-slate-600">{(row.products || []).join(", ")}</span>
      ),
    },
    { key: "totalAmount", label: "Total", render: (row) => <span className="font-semibold">{formatCurrency(row.totalAmount)}</span> },
    { key: "createdAt", label: "Date", render: (row) => formatDate(row.createdAt) },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getOrderStatusClass(row.orderStatus || row.status)}`}>
          {row.orderStatus || row.status || "-"}
        </span>
      ),
    },
    {
      key: "paymentStatus",
      label: "Payment",
      render: (row) => (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {row.paymentStatus || "-"}
        </span>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Revenue" value={formatCurrency(overview.metrics.totalRevenue)} icon={DollarSign} />
        <StatCard title="Total Orders" value={formatNumber(overview.metrics.totalSuccessfulOrders)} icon={ShoppingBag} />
        <StatCard title="Total Customers" value={formatNumber(overview.metrics.totalUsers)} icon={Users} />
        <StatCard title="Total Products" value={formatNumber(overview.metrics.totalProducts)} icon={Package} />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Support Open</p>
          <p className="mt-1 text-2xl font-bold text-rose-600">{formatNumber(overview.metrics.supportOpenTickets)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Support In Progress</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{formatNumber(overview.metrics.supportInProgressTickets)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Support Resolved</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{formatNumber(overview.metrics.supportResolvedTickets)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Support Closed</p>
          <p className="mt-1 text-2xl font-bold text-slate-700">{formatNumber(overview.metrics.supportClosedTickets)}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Sales Overview</h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Not updated yet"}
              <button onClick={loadData} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">Refresh</button>
            </div>
          </div>

          <div className="h-80">
            {salesSeries.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesSeries} margin={{ top: 16, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} tickMargin={10} interval="preserveStartEnd" />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} tickFormatter={formatCompact} width={55} />
                  <Tooltip formatter={(value) => [formatCurrency(value), "Revenue"]} />
                  <Area type="monotone" dataKey="value" stroke="#2563eb" fill="url(#salesGradient)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
                No revenue trend data yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-full">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Low Stock Alerts</h3>
              <p className="text-xs text-slate-500">Live inventory risk monitor</p>
            </div>
            <button
              type="button"
              onClick={() => openLowStockProducts()}
              className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${lowStockProducts.length ? "bg-rose-100 text-rose-700 hover:bg-rose-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}
            >
              {lowStockProducts.length ? `${lowStockProducts.length} Alerts` : "Healthy"}
            </button>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-center">
              <p className="text-[11px] font-semibold text-slate-500">Critical</p>
              <p className="text-lg font-bold text-rose-600">{inventoryStats.critical}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-center">
              <p className="text-[11px] font-semibold text-slate-500">Warning</p>
              <p className="text-lg font-bold text-amber-600">{inventoryStats.warning}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-center">
              <p className="text-[11px] font-semibold text-slate-500">Healthy</p>
              <p className="text-lg font-bold text-emerald-600">{inventoryStats.healthy}</p>
            </div>
          </div>

          <div className="space-y-3">
            {lowStockProducts.length ? lowStockProducts.map((item) => (
              <button
                type="button"
                key={item.productId}
                onClick={() => openLowStockProducts(item)}
                className="w-full rounded-xl border border-amber-200 bg-amber-50 p-3 text-left transition hover:bg-amber-100"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-amber-700">
                    Stock {item.remainingStock}
                  </span>
                </div>
                <p className="mt-1 text-xs text-amber-700">Click to open this product in low-stock view.</p>
              </button>
            )) : (
              <button
                type="button"
                onClick={() => openLowStockProducts()}
                className="w-full rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-left transition hover:bg-emerald-100"
              >
                <p className="text-sm font-semibold text-emerald-700">Inventory looks healthy</p>
                <p className="mt-1 text-xs text-emerald-700">
                  No items are under threshold right now. Click to open product inventory view.
                </p>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Recent Orders</h3>
          <DataTable columns={orderColumns} data={recentOrders} emptyText={loading ? "Loading orders..." : "No orders yet"} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-full">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Best Selling Products</h3>
              <p className="text-xs text-slate-500">Top movers by units sold</p>
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
              {bestSellingProducts.length} Ranked
            </span>
          </div>

          <div className="h-52">
            {bestSellingProducts.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bestSellingProducts} margin={{ left: 0, right: 10, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-8} textAnchor="end" height={44} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip formatter={(value) => [formatNumber(value), "Units Sold"]} />
                  <Bar dataKey="sold" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
                No best-selling data yet.
              </div>
            )}
          </div>

          {bestSellingProducts.length ? (
            <div className="mt-4 space-y-2">
              {bestSellingProducts.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs font-semibold text-slate-700">
                    #{index + 1} {item.name}
                  </p>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600">
                    {formatNumber(item.sold)} units
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default DashboardPage;
