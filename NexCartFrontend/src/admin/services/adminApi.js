import API_BASE_URL from '../../config/api';
const BASE = API_BASE_URL;

const request = async (path, options = {}) => {
  const response = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    const message = typeof payload === "string" ? payload : payload?.message || payload?.error || "Request failed";
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;

    if (response.status === 401 || response.status === 403) {
      localStorage.clear();
      sessionStorage.clear();
      if (typeof window !== "undefined") {
        window.location.href = "/admin";
      }
    }

    throw error;
  }

  return payload;
};

const requestWithFallback = async (paths, options = {}) => {
  let lastError = null;
  for (const path of paths) {
    try {
      return await request(path, options);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Request failed");
};

export const adminApi = {
  getOverview: (days = 14) => request(`/admin/dashboard/overview?days=${encodeURIComponent(days)}`),
  getNotifications: ({ q = "", page = 1, size = 10 } = {}) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(page));
    params.set("size", String(size));
    const path = params.toString() ? `/admin/notifications?${params.toString()}` : "/admin/notifications";
    return request(path);
  },
  markAllNotificationsRead: () => request("/admin/notifications/mark-all-read", { method: "POST" }),
  markNotificationRead: (id) => request(`/admin/notifications/${id}/read`, { method: "PATCH" }),
  getOrders: () => request("/admin/orders"),
  getOrdersByUser: (userId) => request(`/admin/users/${userId}/orders`),
  updateOrderStatus: (orderId, status, trackingNumber = "") =>
    request("/admin/orders/status", { method: "PUT", body: JSON.stringify({ orderId, status, trackingNumber }) }),
  updateReturnStatus: (orderId, productId, status, adminNote = "", refundAmount = null, refundReference = "") =>
    request("/admin/orders/return-status", {
      method: "PUT",
      body: JSON.stringify({ orderId, productId, status, adminNote, refundAmount, refundReference }),
    }),

  getProductsFromOverview: async () => {
    const overview = await request("/admin/dashboard/overview");
    return overview?.products || [];
  },
  addProduct: (payload) => request("/admin/products/add", { method: "POST", body: JSON.stringify(payload) }),
  updateProduct: (payload) => request("/admin/products/update", { method: "PUT", body: JSON.stringify(payload) }),
  deleteProduct: (productId) => request("/admin/products/delete", { method: "DELETE", body: JSON.stringify({ productId }) }),

  getCategories: () => request("/admin/categories"),
  addCategory: (payload) => request("/admin/categories", { method: "POST", body: JSON.stringify(payload) }),
  updateCategory: (payload) => request("/admin/categories", { method: "PUT", body: JSON.stringify(payload) }),
  deleteCategory: (categoryId) => request("/admin/categories", { method: "DELETE", body: JSON.stringify({ categoryId }) }),

  getUsers: ({ q = "", status = "ALL", page = 1, size = 10 } = {}) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status && status !== "ALL") params.set("status", status);
    if (typeof size === "number") {
      params.set("page", String(page));
      params.set("size", String(size));
    }

    const path = params.toString() ? `/admin/users?${params.toString()}` : "/admin/users";
    return requestWithFallback([
      path,
      "/admin/user/all",
    ]);
  },
  getUserById: async (userId) => {
    try {
      return await request(`/admin/users/${userId}`);
    } catch {
      return request("/admin/user/getbyid", {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
    }
  },
  updateUser: (payload) => request("/admin/user/modify", { method: "PUT", body: JSON.stringify(payload) }),
  resetUserPassword: (userId) => request(`/admin/users/${userId}/reset-password`, { method: "POST" }),
  blockUser: (userId) => requestWithFallback([
    `/admin/users/${userId}/block`,
    "/admin/user/block",
  ], {
    method: "PUT",
    body: JSON.stringify({ userId, blocked: true }),
  }),
  unblockUser: (userId) => requestWithFallback([
    `/admin/users/${userId}/unblock`,
    "/admin/user/block",
  ], {
    method: "PUT",
    body: JSON.stringify({ userId, blocked: false }),
  }),
  deleteUser: (userId) => request(`/admin/users/${userId}`, { method: "DELETE" }),

  getCoupons: () => request("/admin/coupons"),
  addCoupon: (payload) => request("/admin/coupons", { method: "POST", body: JSON.stringify(payload) }),
  updateCoupon: (id, payload) => request(`/admin/coupons/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  updateCouponStatus: (id, active) => request(`/admin/coupons/${id}/status`, { method: "PATCH", body: JSON.stringify({ active }) }),
  deleteCoupon: (id) => requestWithFallback([
    `/admin/coupons/${id}`,
    "/admin/coupons",
  ], {
    method: "DELETE",
    body: JSON.stringify({ id }),
  }),

  getSettings: () => request("/admin/settings"),
  updateSettings: (payload) => request("/admin/settings", { method: "PUT", body: JSON.stringify(payload) }),
  getResetEmailTemplate: () => request("/admin/settings/email-templates/reset"),
  updateResetEmailTemplate: (template) => request("/admin/settings/email-templates/reset", { method: "PUT", body: JSON.stringify({ template }) }),

  getSupportTickets: ({ status = "ALL", q = "" } = {}) => request(`/admin/support/tickets?status=${encodeURIComponent(status)}&q=${encodeURIComponent(q)}`),
  getSupportOverview: () => request("/admin/support/overview"),
  updateSupportTicket: (ticketNumber, payload) => request(`/admin/support/tickets/${encodeURIComponent(ticketNumber)}`, { method: "PUT", body: JSON.stringify(payload) }),

  getResetLogs: ({ q = "", action = "", from = "", to = "" } = {}) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (action) params.set("action", action);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const path = params.toString() ? `/admin/support/reset-logs?${params.toString()}` : "/admin/support/reset-logs";
    return request(path);
  },
  exportResetLogs: ({ q = "", action = "", from = "", to = "" } = {}) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (action) params.set("action", action);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const path = params.toString() ? `/admin/support/reset-logs/export?${params.toString()}` : "/admin/support/reset-logs/export";
    return `${BASE}${path}`;
  },

  getProductDetails: (id) => request(`/api/products/${id}`),
  getReviews: (productId) => request(`/api/reviews/${productId}`),
  addReview: (payload) => request("/api/reviews", { method: "POST", body: JSON.stringify(payload) }),
};
