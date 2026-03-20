import React, { useEffect, useMemo, useState } from "react";
import { Eye, KeyRound, Trash2 } from "lucide-react";
import DataTable from "../components/DataTable";
import AdminSelect from "../components/AdminSelect";
import { adminApi } from "../services/adminApi";
import { formatCurrency, formatDate } from "../utils/format";
import { useToast } from "../../components/ui/ToastContext";

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("registration_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");
  const [pagination, setPagination] = useState({ page: 1, size: 10, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingReset, setPendingReset] = useState(null);

  const loadCustomers = async ({ page = currentPage, size = pageSize, q = search, status = statusFilter } = {}) => {
    setLoading(true);
    try {
      const sizeValue = size === "ALL" ? 0 : Number(size);
      const response = await adminApi.getUsers({ q: q.trim(), status, page, size: sizeValue });

      const data = Array.isArray(response) ? response : response?.data || [];
      const mapped = data.map((user) => ({
        ...user,
        totalOrders: Number(user.totalOrders || 0),
        totalSpending: Number(user.totalSpending || 0),
      }));
      setCustomers(mapped);

      if (Array.isArray(response)) {
        setPagination({ page: 1, size: mapped.length || 1, totalPages: 1, totalItems: mapped.length });
        setCurrentPage(1);
      } else {
        const nextPagination = response?.pagination || {};
        setPagination({
          page: Number(nextPagination.page || page || 1),
          size: Number(nextPagination.size || sizeValue || mapped.length || 1),
          totalPages: Number(nextPagination.totalPages || 1),
          totalItems: Number(nextPagination.totalItems || mapped.length),
        });
        setCurrentPage(Number(nextPagination.page || page || 1));
      }
    } catch (error) {
      console.error("Failed to load customers", error);
      toast.error(error.message || "Unable to load customers. Please try again.");
      setCustomers([]);
      setPagination({ page: 1, size: 1, totalPages: 1, totalItems: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [currentPage, pageSize, statusFilter, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, search, pageSize]);

  const refreshCustomerDetails = async (customer) => {
    if (!customer) return;
    try {
      const [profile, orders] = await Promise.all([
        adminApi.getUserById(customer.userId),
        adminApi.getOrdersByUser(customer.userId),
      ]);
      setSelectedCustomer(profile);
      setCustomerOrders(orders || []);
    } catch (error) {
      toast.error(error.message || "Unable to load customer details. Please try again.");
    }
  };

  const toggleBlock = async (customer) => {
    try {
      if (customer.blocked) {
        await adminApi.unblockUser(customer.userId);
        toast.success(`Customer ${customer.username} unblocked successfully.`);
      } else {
        await adminApi.blockUser(customer.userId);
        toast.warning(`Customer ${customer.username} blocked successfully.`);
      }
      await loadCustomers({ page: currentPage });
      if (selectedCustomer?.userId === customer.userId) {
        await refreshCustomerDetails(customer);
      }
    } catch (error) {
      toast.error(error.message || "Unable to update customer status. Please try again.");
    }
  };

  const deleteUser = async (customer) => {
    try {
      await adminApi.deleteUser(customer.userId);
      setPendingDelete(null);
      toast.success(`Customer ${customer.username} deleted successfully.`);
      await loadCustomers({ page: currentPage });
      if (selectedCustomer?.userId === customer.userId) {
        setSelectedCustomer(null);
        setCustomerOrders([]);
      }
    } catch (error) {
      toast.error(error.message || "Unable to delete customer. Please try again.");
    }
  };

  const resetUserPassword = async (customer) => {
    try {
      const response = await adminApi.resetUserPassword(customer.userId);
      toast.success("Password reset link sent.");
      if (response?.resetToken) {
        window.prompt("Local reset token (copy and send to user):", response.resetToken);
      }
    } catch (error) {
      toast.error(error.message || "Unable to send reset link. Please try again.");
    } finally {
      setPendingReset(null);
    }
  };

  const sortedCustomers = useMemo(() => {
    const rows = [...customers];
    rows.sort((a, b) => {
      if (sortBy === "registration_asc") {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === "orders_desc") {
        return Number(b.totalOrders || 0) - Number(a.totalOrders || 0);
      }
      if (sortBy === "orders_asc") {
        return Number(a.totalOrders || 0) - Number(b.totalOrders || 0);
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    return rows;
  }, [customers, sortBy]);

  const columns = [
    { key: "userId", label: "User ID" },
    { key: "username", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "totalOrders", label: "Total Orders" },
    { key: "totalSpending", label: "Total Spending", render: (row) => formatCurrency(row.totalSpending) },
    {
      key: "status",
      label: "Account Status",
      render: (row) => (
        <button
          onClick={() => toggleBlock(row)}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            row.blocked ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {row.blocked ? "Blocked" : "Active"}
        </button>
      ),
    },
    { key: "createdAt", label: "Registration Date", render: (row) => formatDate(row.createdAt) },
    { key: "lastLoginAt", label: "Last Login", render: (row) => (row.lastLoginAt ? formatDate(row.lastLoginAt) : "-") },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={() => refreshCustomerDetails(row)} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50">
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPendingReset(row)}
            className="rounded-lg border border-amber-200 p-2 text-amber-700 hover:bg-amber-50"
            aria-label={`Reset password for ${row.username}`}
          >
            <KeyRound className="h-4 w-4" />
          </button>
          <button onClick={() => setPendingDelete(row)} className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const totalCustomerSpend = customerOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const showPager = pageSize !== "ALL" && pagination.totalPages > 1;

  return (
    <section className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:col-span-2 lg:col-span-2 w-full rounded-lg border border-slate-200 px-3 py-2"
          placeholder="Search by name, email, or phone"
        />

        <AdminSelect
          value={statusFilter}
          onChange={(next) => setStatusFilter(next)}
          options={[
            { value: "ALL", label: "All Status" },
            { value: "ACTIVE", label: "Active" },
            { value: "BLOCKED", label: "Blocked" },
          ]}
        />

        <AdminSelect
          value={sortBy}
          onChange={(next) => setSortBy(next)}
          options={[
            { value: "registration_desc", label: "Newest Registration" },
            { value: "registration_asc", label: "Oldest Registration" },
            { value: "orders_desc", label: "Most Orders" },
            { value: "orders_asc", label: "Least Orders" },
          ]}
        />

        <AdminSelect
          value={pageSize}
          onChange={(next) => setPageSize(next)}
          options={[
            { value: "10", label: "10 / page" },
            { value: "25", label: "25 / page" },
            { value: "50", label: "50 / page" },
            { value: "ALL", label: "Show All" },
          ]}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        Total users found: <b>{pagination.totalItems}</b> | Showing <b>{sortedCustomers.length}</b> on this page
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading customers...</div>
      ) : (
        <DataTable columns={columns} data={sortedCustomers} />
      )}

      {showPager ? (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={pagination.page <= 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
              {pagination.page}
            </span>
            <button
              onClick={() => setCurrentPage((page) => Math.min(pagination.totalPages, page + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {selectedCustomer ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900">Customer Detail View</h3>
            <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
              <p><b>Name:</b> {selectedCustomer.username}</p>
              <p><b>Email:</b> {selectedCustomer.email}</p>
              <p><b>Phone:</b> {selectedCustomer.phone || "-"}</p>
              <p><b>User ID:</b> {selectedCustomer.userId}</p>
              <p><b>Status:</b> {selectedCustomer.blocked ? "Blocked" : "Active"}</p>
              <p><b>Registration Date:</b> {formatDate(selectedCustomer.createdAt)}</p>
              <p><b>Last Login:</b> {selectedCustomer.lastLoginAt ? formatDate(selectedCustomer.lastLoginAt) : "-"}</p>
              <p><b>Total Orders:</b> {customerOrders.length}</p>
              <p className="md:col-span-2"><b>Total Spending:</b> {formatCurrency(totalCustomerSpend)}</p>
              <p className="md:col-span-2"><b>Address:</b> Not available in current schema</p>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-semibold text-slate-900">Order History</h4>
              <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-[640px] text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Order ID</th>
                      <th className="px-3 py-2">Products</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerOrders.length ? customerOrders.map((order) => (
                      <tr key={order.orderId} className="border-t border-slate-100">
                        <td className="px-3 py-2">{order.orderId}</td>
                        <td className="px-3 py-2">{(order.products || []).join(", ") || "-"}</td>
                        <td className="px-3 py-2">{formatCurrency(order.totalAmount)}</td>
                        <td className="px-3 py-2">{order.status}</td>
                        <td className="px-3 py-2">{formatDate(order.createdAt)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-3 py-5 text-center text-slate-500">No order history found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button onClick={() => setSelectedCustomer(null)} className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white">Close</button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Delete customer?</h3>
            <p className="mt-2 text-sm text-slate-600">
              This will remove <b>{pendingDelete.username}</b> from the system. This action cannot be undone.
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
                onClick={() => deleteUser(pendingDelete)}
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingReset ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Reset password?</h3>
            <p className="mt-2 text-sm text-slate-600">
              This will send a reset link to <b>{pendingReset.email || "the user"}</b>. Continue?
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-4 py-2 font-semibold"
                onClick={() => setPendingReset(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-amber-600 px-4 py-2 font-semibold text-white"
                onClick={() => resetUserPassword(pendingReset)}
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default CustomersPage;
