import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

import { adminApi } from "../services/adminApi";
import { formatCurrency, formatNumber } from "../utils/format";
import { useToast } from "../../components/ui/toastContext";

const COLORS = ["#2563eb", "#0ea5e9", "#14b8a6", "#22c55e", "#f59e0b", "#8b5cf6"];

const monthKey = (value) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const AnalyticsPage = () => {
  const toast = useToast();
  const [overview, setOverview] = useState({
    analytics: { monthlyRevenue: [], dailyRevenue: [], categorySales: {} },
    metrics: {},
    products: [],
    users: [],
  });
  const [lastUpdated, setLastUpdated] = useState("-");
  const [selectedDays, setSelectedDays] = useState(14);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await adminApi.getOverview(selectedDays);
        setOverview(data || { analytics: { monthlyRevenue: [], dailyRevenue: [], categorySales: {} }, metrics: {}, products: [], users: [] });
        setLastUpdated(new Date().toLocaleString("en-IN"));
      } catch (error) {
        console.error("Failed to load analytics", error);
        toast.error("Unable to load analytics. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedDays, toast]);

  const dailyRevenue = useMemo(() => {
    return (overview?.analytics?.dailyRevenue || overview?.analytics?.monthlyRevenue || []).map((item) => ({
      day: item.label,
      revenue: Number(item.value || 0),
    }));
  }, [overview]);

  const revenueKpis = useMemo(() => {
    const series = dailyRevenue.map((point) => Number(point.revenue || 0));
    if (!series.length) {
      return { weekTotal: 0, priorWeek: 0, delta: 0 };
    }

    const last7 = series.slice(-7);
    const prev7 = series.slice(-14, -7);
    const weekTotal = last7.reduce((sum, value) => sum + value, 0);
    const priorWeek = prev7.reduce((sum, value) => sum + value, 0);
    const delta = priorWeek > 0 ? ((weekTotal - priorWeek) / priorWeek) * 100 : 0;

    return { weekTotal, priorWeek, delta };
  }, [dailyRevenue]);

  const bestSelling = useMemo(() => {
    return (overview?.products || [])
      .map((item) => ({ name: item.name, sold: Number(item.soldUnits || 0) }))
      .filter((item) => item.sold > 0)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 6);
  }, [overview]);

  const customerGrowth = useMemo(() => {
    const buckets = new Map();

    (overview?.users || []).forEach((user) => {
      if (!user.createdAt) return;
      const key = monthKey(user.createdAt);
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });

    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, customers]) => {
        const [year, month] = key.split("-");
        const label = new Date(Number(year), Number(month) - 1, 1).toLocaleString("en-IN", {
          month: "short",
          year: "2-digit",
        });
        return { month: label, customers };
      });
  }, [overview]);

  const pieData = useMemo(() => {
    return (overview?.analytics?.categorySales && Object.keys(overview.analytics.categorySales).length)
      ? Object.entries(overview.analytics.categorySales).map(([name, value]) => ({ name, value: Number(value || 0) }))
      : bestSelling.map((item) => ({ name: item.name, value: item.sold }));
  }, [overview, bestSelling]);

  const metrics = overview?.metrics || {};
  const returnRate = Number(metrics.returnRate || 0) * 100;
  const conversionRate = Number(metrics.conversionRate || 0) * 100;
  const fulfillmentActive = Number(metrics.processingOrders || 0) + Number(metrics.shippedOrders || 0) + Number(metrics.outForDeliveryOrders || 0);

  return (
    <section className="space-y-6">
      <div className="admin-analytics-hero rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Analytics Center</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Performance pulse for NexCart</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Real-time revenue, customer momentum, and category demand signals powered by your live store data.
            </p>
          </div>
          <div className="admin-analytics-badge rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-xs font-semibold text-slate-500">
            Last refreshed: <span className="text-slate-700">{lastUpdated}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-400">Total Revenue</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(metrics.totalRevenue || 0)}</p>
            <p className="mt-1 text-xs text-slate-500">Last 7 days: {formatCurrency(revenueKpis.weekTotal || 0)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-400">Order Volume</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{formatNumber(metrics.totalSuccessfulOrders || 0)}</p>
            <p className="mt-1 text-xs text-slate-500">Items sold: {formatNumber(metrics.totalSoldItems || 0)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-400">Customers</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{formatNumber(metrics.totalUsers || 0)}</p>
            <p className="mt-1 text-xs text-slate-500">Growth tracking across months</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-400">Inventory</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{formatNumber(metrics.totalRemainingItems || 0)}</p>
            <p className="mt-1 text-xs text-slate-500">Active SKUs: {formatNumber(metrics.totalProducts || 0)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">Average Order Value</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(metrics.averageOrderValue || 0)}</p>
          <p className="mt-1 text-xs text-slate-500">Orders per customer: {formatNumber(metrics.totalSuccessfulOrders || 0)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">Return Rate</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{returnRate.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-slate-500">Return requests: {formatNumber(metrics.totalReturnRequests || 0)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">Fulfillment In Progress</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatNumber(fulfillmentActive)}</p>
          <p className="mt-1 text-xs text-slate-500">Pending: {formatNumber(metrics.pendingOrders || 0)} | Delivered: {formatNumber(metrics.deliveredOrders || 0)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">Conversion</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{conversionRate.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-slate-500">Based on registered shoppers</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Revenue Trend</h3>
              <p className="text-xs text-slate-500">Last {selectedDays} days performance snapshot</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[7, 14, 30].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDays(day)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    selectedDays === day
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  Last {day}d
                </button>
              ))}
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                {revenueKpis.delta >= 0 ? "UP" : "DOWN"} {Math.abs(revenueKpis.delta).toFixed(1)}% vs prior week
              </div>
            </div>
          </div>
          <div className="h-80">
            {loading ? (
              <div className="grid h-full place-items-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
                Loading revenue trend...
              </div>
            ) : dailyRevenue.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyRevenue} margin={{ top: 12, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} tickMargin={10} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatNumber(value)} width={70} />
                  <Tooltip formatter={(value) => [formatCurrency(value), "Revenue"]} />
                  <Line dataKey="revenue" type="monotone" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
                No revenue trend data yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Category Sales Mix</h3>
          <div className="h-72">
            {loading ? (
              <div className="grid h-full place-items-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
                Loading category mix...
              </div>
            ) : pieData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={105} innerRadius={55} paddingAngle={2}>
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatNumber(value), "Units"]} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
                No product/category mix data yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Customer Growth</h3>
          <div className="h-72">
            {loading ? (
              <div className="grid h-full place-items-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
                Loading customer growth...
              </div>
            ) : customerGrowth.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerGrowth} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip formatter={(value) => [formatNumber(value), "Customers"]} />
                  <Legend />
                  <Bar dataKey="customers" fill="#14b8a6" radius={[8, 8, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
                No customer growth data yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Best Selling Products</h3>
              <p className="text-xs text-slate-500">Top 6 products by units sold</p>
            </div>
          </div>
          <div className="h-72">
            {loading ? (
              <div className="grid h-full place-items-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
                Loading product performance...
              </div>
            ) : bestSelling.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bestSelling} layout="vertical" margin={{ top: 8, right: 24, left: 24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} />
                  <Tooltip formatter={(value) => [formatNumber(value), "Units"]} />
                  <Bar dataKey="sold" fill="#0ea5e9" radius={[0, 8, 8, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
                No product sales data yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnalyticsPage;










