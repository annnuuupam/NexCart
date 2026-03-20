import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Search, RefreshCw, Power } from "lucide-react";
import DataTable from "../components/DataTable";
import AdminSelect from "../components/AdminSelect";
import { adminApi } from "../services/adminApi";
import { useToast } from "../../components/ui/ToastContext";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const getCouponStatus = (coupon) => {
  if (coupon?.active === false) return "Disabled";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(coupon.expiryDate);
  expiry.setHours(0, 0, 0, 0);

  if (!Number.isNaN(expiry.getTime()) && expiry < today) return "Expired";
  if (Number(coupon.usedCount || 0) >= Number(coupon.usageLimit || 0)) return "Limit Reached";
  return "Active";
};

const CouponsPage = () => {
  const toast = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minimumOrderAmount: "",
    maximumDiscount: "",
    expiryDate: "",
    usageLimit: "",
    active: true,
  });

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCoupons();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Unable to load coupons.", error);
      toast.error(error.message || "Unable to load coupons. Please try again.");
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const createCoupon = async (event) => {
    event.preventDefault();

    const code = form.code.toUpperCase().trim();
    if (!code) {
      toast.warning("Please enter a coupon code.");
      return;
    }

    const payload = {
      code,
      discountType: form.discountType,
      discountValue: Number(form.discountValue || 0),
      minimumOrderAmount: Number(form.minimumOrderAmount || 0),
      maximumDiscount: Number(form.maximumDiscount || 0),
      expiryDate: form.expiryDate,
      usageLimit: Number(form.usageLimit || 0),
      active: Boolean(form.active),
    };

    if (payload.discountValue <= 0 || payload.usageLimit <= 0 || !payload.expiryDate) {
      toast.warning("Please enter valid discount, expiry, and usage limit values.");
      return;
    }

    try {
      await adminApi.addCoupon(payload);
      setForm({
        code: "",
        discountType: "PERCENTAGE",
        discountValue: "",
        minimumOrderAmount: "",
        maximumDiscount: "",
        expiryDate: "",
        usageLimit: "",
        active: true,
      });
      setOpenCreate(false);
      toast.success("Coupon created successfully.");
      await loadCoupons();
    } catch (error) {
      toast.error(error.message || "Unable to create coupon. Please try again.");
    }
  };

  const removeCoupon = async (id) => {
    try {
      await adminApi.deleteCoupon(id);
      setPendingDelete(null);
      toast.success("Coupon deleted successfully.");
      await loadCoupons();
    } catch (error) {
      toast.error(error.message || "Unable to delete coupon. Please try again.");
    }
  };

  const toggleCoupon = async (row) => {
    try {
      await adminApi.updateCouponStatus(row.id, !row.active);
      toast.success(`Coupon ${row.code} ${row.active ? "disabled" : "enabled"}.`);
      await loadCoupons();
    } catch (error) {
      toast.error(error.message || "Unable to update coupon status.");
    }
  };

  const filteredCoupons = useMemo(() => {
    const q = query.trim().toLowerCase();

    return coupons.filter((coupon) => {
      const status = getCouponStatus(coupon);
      const matchesStatus = statusFilter === "ALL" ? true : status.toUpperCase() === statusFilter;
      const matchesQuery = q
        ? String(coupon.code || "").toLowerCase().includes(q) || String(coupon.discountType || "").toLowerCase().includes(q)
        : true;
      return matchesStatus && matchesQuery;
    });
  }, [coupons, query, statusFilter]);

  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((item) => getCouponStatus(item) === "Active").length;
    const expired = coupons.filter((item) => getCouponStatus(item) === "Expired").length;
    const used = coupons.reduce((sum, item) => sum + Number(item.usedCount || 0), 0);
    return { total, active, expired, used };
  }, [coupons]);

  const columns = [
    {
      key: "code",
      label: "Coupon",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.code}</p>
          <p className="text-xs text-slate-500">{String(row.discountType || "").toUpperCase()}</p>
        </div>
      ),
    },
    {
      key: "discount",
      label: "Discount",
      render: (row) =>
        String(row.discountType).toUpperCase() === "PERCENTAGE" ? `${row.discountValue}%` : `INR ${row.discountValue}`,
    },
    { key: "minimumOrderAmount", label: "Min Order", render: (row) => `INR ${Number(row.minimumOrderAmount || 0)}` },
    { key: "maximumDiscount", label: "Max Discount", render: (row) => `INR ${Number(row.maximumDiscount || 0)}` },
    {
      key: "usage",
      label: "Usage",
      render: (row) => (
        <span>{Number(row.usedCount || 0)}/{Number(row.usageLimit || 0)}</span>
      ),
    },
    { key: "expiryDate", label: "Expiry", render: (row) => formatDate(row.expiryDate) },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const status = getCouponStatus(row);
        const className =
          status === "Active"
            ? "bg-emerald-100 text-emerald-700"
            : status === "Expired"
              ? "bg-rose-100 text-rose-700"
              : status === "Disabled"
                ? "bg-slate-100 text-slate-600"
                : "bg-amber-100 text-amber-700";
        return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{status}</span>;
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleCoupon(row)}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            aria-label={`Toggle coupon ${row.code}`}
          >
            <Power className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPendingDelete(row)}
            className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
            aria-label={`Delete coupon ${row.code}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Coupons & Promotions</h2>
            <p className="text-sm text-slate-600">Create and monitor promotional campaigns with clear usage visibility.</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button
              type="button"
              onClick={loadCoupons}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button
              onClick={() => setOpenCreate(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
            >
              <Plus className="h-4 w-4" /> Create Coupon
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Coupons</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.active}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Expired</p>
          <p className="mt-1 text-2xl font-bold text-rose-700">{stats.expired}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Redemptions</p>
          <p className="mt-1 text-2xl font-bold text-indigo-700">{stats.used}</p>
        </article>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_220px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by coupon code or type"
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-sm"
          />
        </label>

        <AdminSelect
          value={statusFilter}
          onChange={(next) => setStatusFilter(next)}
          options={[
            { value: "ALL", label: "All statuses" },
            { value: "ACTIVE", label: "Active" },
            { value: "EXPIRED", label: "Expired" },
            { value: "LIMIT REACHED", label: "Limit Reached" },
            { value: "DISABLED", label: "Disabled" },
          ]}
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading coupons...</div>
      ) : (
        <DataTable columns={columns} data={filteredCoupons} emptyText="No coupons found. Create a new coupon to start promotions." />
      )}

      {openCreate ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4">
          <form onSubmit={createCoupon} className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-xl font-bold text-slate-900">Create Coupon</h3>
            <p className="mb-4 text-sm text-slate-600">Configure code, discount, validity, and usage controls.</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                Coupon Code
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 uppercase"
                  placeholder="WELCOME10"
                  value={form.code}
                  onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                  required
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Discount Type
                <AdminSelect
                  className="mt-1"
                  value={form.discountType}
                  onChange={(next) => setForm((prev) => ({ ...prev, discountType: next }))}
                  options={[
                    { value: "PERCENTAGE", label: "Percentage" },
                    { value: "FLAT", label: "Flat (INR)" },
                  ]}
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Discount Value
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={form.discountValue}
                  onChange={(event) => setForm((prev) => ({ ...prev, discountValue: event.target.value }))}
                  required
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Min Order Amount
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={form.minimumOrderAmount}
                  onChange={(event) => setForm((prev) => ({ ...prev, minimumOrderAmount: event.target.value }))}
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Max Discount
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={form.maximumDiscount}
                  onChange={(event) => setForm((prev) => ({ ...prev, maximumDiscount: event.target.value }))}
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Expiry Date
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={form.expiryDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, expiryDate: event.target.value }))}
                  required
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Usage Limit
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={form.usageLimit}
                  onChange={(event) => setForm((prev) => ({ ...prev, usageLimit: event.target.value }))}
                  required
                />
              </label>

              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                Status
                <AdminSelect
                  className="mt-1"
                  value={form.active ? "ACTIVE" : "DISABLED"}
                  onChange={(next) => setForm((prev) => ({ ...prev, active: next === "ACTIVE" }))}
                  options={[
                    { value: "ACTIVE", label: "Active" },
                    { value: "DISABLED", label: "Disabled" },
                  ]}
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 font-semibold" onClick={() => setOpenCreate(false)}>
                Cancel
              </button>
              <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white">
                Create Coupon
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Delete coupon?</h3>
            <p className="mt-2 text-sm text-slate-600">
              This will permanently remove coupon <b>{pendingDelete.code}</b>.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-4 py-2 font-semibold"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white"
                onClick={() => removeCoupon(pendingDelete.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default CouponsPage;
