import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Box,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  PieChart,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";

import logo from "../../assets/images/logo.png";
import { ThemeToggle } from "../../components/layout/ThemeToggle";
import CustomModal from "../../components/ui/CustomModal";
import AdminSelect from "../../admin/components/AdminSelect";

import "../../styles/AdminDashboard.css";
import API_BASE_URL from '../../config/api';

const PIE_COLORS = ["#0ea5e9", "#14b8a6", "#22c55e", "#f59e0b", "#f97316", "#8b5cf6", "#ec4899", "#ef4444"];

const formatCompactNumber = (value) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));

const readResponsePayload = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text || "No data returned" };
  }
};

const buildLinePoints = (series) => {
  if (!series.length) return "";
  const width = 560;
  const height = 220;
  const topPadding = 14;
  const bottomPadding = 20;
  const drawableHeight = height - topPadding - bottomPadding;
  const max = Math.max(...series.map((item) => item.value), 1);

  if (series.length === 1) {
    const y = height - bottomPadding - (series[0].value / max) * drawableHeight;
    return `14,${y} ${width - 14},${y}`;
  }

  return series
    .map((item, index) => {
      const x = 14 + (index / Math.max(series.length - 1, 1)) * (width - 28);
      const y = height - bottomPadding - (item.value / max) * drawableHeight;
      return `${x},${y}`;
    })
    .join(" ");
};

const buildPieBackground = (series) => {
  const total = series.reduce((sum, item) => sum + item.value, 0) || 1;
  let start = 0;
  const chunks = series.map((item, index) => {
    const portion = (item.value / total) * 100;
    const end = start + portion;
    const color = PIE_COLORS[index % PIE_COLORS.length];
    const segment = `${color} ${start}% ${end}%`;
    start = end;
    return segment;
  });
  return `conic-gradient(${chunks.join(", ")})`;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [modalType, setModalType] = useState(null);
  const [modalInitialData, setModalInitialData] = useState(null);
  const [response, setResponse] = useState(null);
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [teamFilter, setTeamFilter] = useState("All");

  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const [analyticsData, setAnalyticsData] = useState({ monthly: null, daily: null, yearly: null, overall: null, updatedAt: null });

  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState("");
  const [overviewData, setOverviewData] = useState({ metrics: {}, products: [], users: [], analytics: { categorySales: {}, monthlyRevenue: [] } });

  const isAuthError = (status) => status === 401 || status === 403;
  const redirectToAdminLogin = (message = "Session expired. Please login again.") => {
    navigate("/admin", { replace: true, state: { message } });
  };

  const guardedFetch = async (url, options = {}) => {
    const apiResponse = await fetch(url, { credentials: "include", ...options });
    if (isAuthError(apiResponse.status)) {
      redirectToAdminLogin();
      throw new Error("SESSION_EXPIRED");
    }
    return apiResponse;
  };

  const cardData = [
    { title: "Add Product", description: "Create new product listings with pricing and stock.", team: "Product", modalType: "addProduct" },
    { title: "Delete Product", description: "Remove discontinued or invalid products.", team: "Product", modalType: "deleteProduct" },
    { title: "Modify User", description: "Edit user profile details and access roles.", team: "Users", modalType: "modifyUser" },
    { title: "View User Details", description: "Inspect user information by user ID.", team: "Users", modalType: "viewUser" },
    { title: "Monthly Business", description: "Analyze month-wise business performance.", team: "Analytics", modalType: "monthlyBusiness" },
    { title: "Day Business", description: "Track day-level revenue and category sales.", team: "Analytics", modalType: "dailyBusiness" },
    { title: "Yearly Business", description: "Measure annual revenue and growth signals.", team: "Analytics", modalType: "yearlyBusiness" },
    { title: "Overall Business", description: "Review lifetime business totals and category contribution.", team: "Analytics", modalType: "overallBusiness" },
  ];

  const teams = ["All", ...Array.from(new Set(cardData.map((item) => item.team)))];

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "management", label: "Management", icon: ShieldCheck },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "system", label: "System", icon: Settings },
  ];

  const filteredCards = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return cardData.filter((card) => {
      const matchesTeam = teamFilter === "All" || card.team === teamFilter;
      const matchesQuery =
        !normalized ||
        card.title.toLowerCase().includes(normalized) ||
        card.description.toLowerCase().includes(normalized) ||
        card.team.toLowerCase().includes(normalized);
      return matchesTeam && matchesQuery;
    });
  }, [query, teamFilter]);

  const sectionCards = useMemo(() => {
    if (activeSection === "management") return filteredCards.filter((card) => card.team === "Product" || card.team === "Users");
    if (activeSection === "analytics") return filteredCards.filter((card) => card.team === "Analytics");
    if (activeSection === "system") return filteredCards;
    return [];
  }, [activeSection, filteredCards]);

  const kpis = [
    { label: "Products", value: overviewData.metrics.totalProducts || 0, icon: Box },
    { label: "Users", value: overviewData.metrics.totalUsers || 0, icon: Users },
    { label: "Sold Items", value: overviewData.metrics.totalSoldItems || 0, icon: ShoppingBag },
    { label: "Remaining Items", value: overviewData.metrics.totalRemainingItems || 0, icon: BarChart3 },
    { label: "Successful Orders", value: overviewData.metrics.totalSuccessfulOrders || 0, icon: Activity },
    { label: "Revenue", value: formatCurrency(overviewData.metrics.totalRevenue || 0), icon: TrendingUp, isText: true },
  ];

  const lineSeries = useMemo(() => {
    const monthlySeries = Array.isArray(overviewData.analytics?.monthlyRevenue)
      ? overviewData.analytics.monthlyRevenue
          .map((point) => ({ label: point?.label || "", value: Number(point?.value || 0) }))
          .filter((point) => point.label && Number.isFinite(point.value) && point.value >= 0)
      : [];

    if (monthlySeries.length) {
      return monthlySeries.slice(-8);
    }

    const fallback = [
      { label: "Daily", value: Number(analyticsData.daily?.totalBusiness || 0) },
      { label: "Monthly", value: Number(analyticsData.monthly?.totalBusiness || 0) },
      { label: "Yearly", value: Number(analyticsData.yearly?.totalBusiness || 0) },
      { label: "Overall", value: Number(analyticsData.overall?.totalBusiness || 0) },
    ];

    return fallback.filter((item) => Number.isFinite(item.value) && item.value > 0);
  }, [overviewData.analytics, analyticsData]);

  const barSeries = useMemo(() => {
    if (!overviewData.products?.length) return [];
    return overviewData.products
      .map((p) => ({ label: p.name, value: Number(p.soldUnits || 0) }))
      .filter((p) => p.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [overviewData.products]);

  const pieSeries = useMemo(() => {
    const categorySales = overviewData.analytics?.categorySales || {};
    return Object.entries(categorySales)
      .map(([label, value]) => ({ label, value: Number(value || 0) }))
      .filter((item) => Number.isFinite(item.value) && item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [overviewData.analytics]);

  const hasAnalyticsData = lineSeries.length > 0 || barSeries.length > 0 || pieSeries.length > 0;

  const analyticsStats = useMemo(() => {
    const revenueTrend = lineSeries.reduce((sum, item) => sum + item.value, 0);
    const topProductSales = Math.max(...barSeries.map((item) => item.value), 0);
    const categoryUnits = pieSeries.reduce((sum, item) => sum + item.value, 0);
    return [
      { label: "Revenue Trend", value: Math.round(revenueTrend), icon: TrendingUp },
      { label: "Top Product Units", value: Math.round(topProductSales), icon: BarChart3 },
      { label: "Category Units", value: Math.round(categoryUnits), icon: PieChart },
    ];
  }, [lineSeries, barSeries, pieSeries]);

  const fetchOverview = async () => {
    setOverviewLoading(true);
    setOverviewError("");
    try {
      const apiResponse = await guardedFetch(`${API_BASE_URL}/admin/dashboard/overview`, { method: "GET" });
      if (!apiResponse.ok) throw new Error(await apiResponse.text());
      setOverviewData(await apiResponse.json());
    } catch (error) {
      if (error.message !== "SESSION_EXPIRED") setOverviewError("Unable to load dashboard data");
    } finally {
      setOverviewLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    setAnalyticsLoading(true);
    setAnalyticsError("");

    try {
      const [monthlyRes, dailyRes, yearlyRes, overallRes] = await Promise.all([
        guardedFetch(`${API_BASE_URL}/admin/business/monthly?month=${month}&year=${year}`, { method: "GET" }),
        guardedFetch(`${API_BASE_URL}/admin/business/daily?date=${date}`, { method: "GET" }),
        guardedFetch(`${API_BASE_URL}/admin/business/yearly?year=${year}`, { method: "GET" }),
        guardedFetch(`${API_BASE_URL}/admin/business/overall`, { method: "GET" }),
      ]);

      const payloads = await Promise.all([readResponsePayload(monthlyRes), readResponsePayload(dailyRes), readResponsePayload(yearlyRes), readResponsePayload(overallRes)]);
      if (!monthlyRes.ok || !dailyRes.ok || !yearlyRes.ok || !overallRes.ok) throw new Error("Failed analytics APIs");

      setAnalyticsData({ monthly: payloads[0], daily: payloads[1], yearly: payloads[2], overall: payloads[3], updatedAt: new Date().toLocaleString() });
    } catch (error) {
      if (error.message !== "SESSION_EXPIRED") setAnalyticsError("Unable to load analytics endpoints.");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchAnalyticsData();
  }, []);

  const handleLogout = async () => {
    try {
      await guardedFetch(`${API_BASE_URL}/api/auth/logout`, { method: "POST" });
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      navigate("/admin", { replace: true });
    }
  };

  const handleAddProductSubmit = async (productData) => {
    try {
      const apiResponse = await guardedFetch(`${API_BASE_URL}/admin/products/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      const payloadText = await apiResponse.text();
      let payload = {};
      try {
        payload = payloadText ? JSON.parse(payloadText) : {};
      } catch {
        payload = { message: payloadText };
      }

      if (!apiResponse.ok) {
        setResponse({ message: payload?.message || payloadText || "Failed to add product" });
        setModalType("response");
        return;
      }

      await fetchOverview();
      setResponse({ product: payload, imageUrl: productData.imageUrl });
      setModalType("addProduct");
    } catch {
      setResponse({ message: "Error adding product" });
      setModalType("response");
    }
  };

  const handleDeleteProductSubmit = async ({ productId }) => {
    try {
      const apiResponse = await guardedFetch(`${API_BASE_URL}/admin/products/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (apiResponse.ok) {
        await fetchOverview();
        setResponse({ message: "Product deleted successfully" });
      } else {
        setResponse({ message: `Error: ${await apiResponse.text()}` });
      }
      setModalType("response");
    } catch {
      setResponse({ message: "Error deleting product" });
      setModalType("response");
    }
  };

  const handleViewUserSubmit = async ({ userId }) => {
    try {
      const apiResponse = await guardedFetch(`${API_BASE_URL}/admin/user/getbyid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (apiResponse.ok) setResponse({ user: await apiResponse.json() });
      else setResponse({ message: `Error: ${await apiResponse.text()}` });
      setModalType("response");
    } catch {
      setResponse({ message: "Error: Something went wrong" });
      setModalType("response");
    }
  };

  const handleMonthlyBusiness = async (data) => {
    try {
      const apiResponse = await guardedFetch(`${API_BASE_URL}/admin/business/monthly?month=${data?.month}&year=${data?.year}`, { method: "GET" });
      if (apiResponse.ok) setResponse({ monthlyBusiness: await apiResponse.json() });
      else setResponse({ message: `Error: ${await apiResponse.text()}` });
      setModalType("monthlyBusiness");
    } catch {
      setResponse({ message: "Error: Something went wrong" });
      setModalType("monthlyBusiness");
    }
  };

  const handleDailyBusiness = async (data) => {
    try {
      const apiResponse = await guardedFetch(`${API_BASE_URL}/admin/business/daily?date=${data?.date}`, { method: "GET" });
      if (apiResponse.ok) setResponse({ dailyBusiness: await apiResponse.json() });
      else setResponse({ message: `Error: ${await apiResponse.text()}` });
      setModalType("dailyBusiness");
    } catch {
      setResponse({ message: "Error: Something went wrong" });
      setModalType("dailyBusiness");
    }
  };

  const handleYearlyBusiness = async (data) => {
    try {
      const apiResponse = await guardedFetch(`${API_BASE_URL}/admin/business/yearly?year=${data?.year}`, { method: "GET" });
      if (apiResponse.ok) setResponse({ yearlyBusiness: await apiResponse.json() });
      else setResponse({ message: `Error: ${await apiResponse.text()}` });
      setModalType("yearlyBusiness");
    } catch {
      setResponse({ message: "Error: Something went wrong" });
      setModalType("yearlyBusiness");
    }
  };

  const handleOverallBusiness = async () => {
    try {
      const apiResponse = await guardedFetch(`${API_BASE_URL}/admin/business/overall`, { method: "GET" });
      if (apiResponse.ok) setResponse({ overallBusiness: await apiResponse.json() });
      else setResponse({ message: `Error: ${await apiResponse.text()}` });
      setModalType("overallBusiness");
    } catch {
      setResponse({ message: "Error: Something went wrong" });
      setModalType("overallBusiness");
    }
  };

  const shouldShowManagement = activeSection === "dashboard" || activeSection === "management";
  const shouldShowAnalytics = activeSection === "dashboard" || activeSection === "analytics";

  return (
    <div className="nex-admin-shell">
      <aside className="nex-admin-sidebar">
        <div className="nex-admin-brand">
          <img src={logo} alt="NexCart" />
          <div><h2>NexCart</h2><p>Admin Panel</p></div>
        </div>

        <nav className="nex-admin-nav">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button type="button" key={item.id} className={`nex-admin-nav-item ${activeSection === item.id ? "active" : ""}`} onClick={() => setActiveSection(item.id)}>
                <Icon size={18} /><span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button type="button" className="nex-admin-logout" onClick={handleLogout}><LogOut size={18} /><span>Logout</span></button>
      </aside>

      <main className="nex-admin-main">
        <header className="nex-admin-topbar">
          <div className="nex-admin-search">
            <Search size={17} />
            <input type="search" placeholder="Search actions" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className="nex-admin-topbar-right">
            <AdminSelect
              value={teamFilter}
              onChange={(next) => setTeamFilter(next)}
              options={teams.map((team) => ({ value: team, label: team }))}
              className="min-w-[140px]"
              size="sm"
            />
            <ThemeToggle />
          </div>
        </header>

        <section className="nex-admin-hero">
          <h1>Welcome back, Admin</h1>
          <p>Operate products, users, inventory, orders, and revenue insights from one dashboard.</p>
        </section>

        {overviewLoading && <p className="nex-admin-updated-at">Loading dashboard data...</p>}
        {overviewError && <p className="nex-admin-analytics-error">{overviewError}</p>}

        <section className="nex-admin-kpis">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <article key={kpi.label} className="nex-admin-kpi-card">
                <div>
                  <h4>{kpi.label}</h4>
                  <p>{kpi.isText ? kpi.value : formatCompactNumber(kpi.value)}</p>
                </div>
                <span><Icon size={18} /></span>
              </article>
            );
          })}
        </section>

        {shouldShowManagement && (
          <section className="nex-admin-project-grid">
            <article className="nex-admin-project-card">
              <div className="nex-admin-project-head">
                <h3>Products Inventory</h3>
                <p>{overviewData.products.length} items</p>
              </div>
              <div className="nex-admin-table-wrap">
                <table className="nex-admin-table">
                  <thead>
                    <tr>
                      <th>ID</th><th>Name</th><th>Category</th><th>Sold</th><th>Remaining</th><th>Price</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overviewData.products.map((product) => (
                      <tr key={product.productId}>
                        <td>{product.productId}</td>
                        <td>{product.name}</td>
                        <td>{product.category}</td>
                        <td>{product.soldUnits}</td>
                        <td>{product.remainingStock}</td>
                        <td>{formatCurrency(product.price)}</td>
                        <td>
                          <button
                            type="button"
                            className="nex-admin-inline-btn danger"
                            onClick={() => handleDeleteProductSubmit({ productId: product.productId })}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="nex-admin-project-card">
              <div className="nex-admin-project-head">
                <h3>User Insights</h3>
                <p>{overviewData.users.length} users</p>
              </div>
              <div className="nex-admin-table-wrap">
                <table className="nex-admin-table">
                  <thead>
                    <tr>
                      <th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Orders</th><th>Total Spent</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overviewData.users.map((user) => (
                      <tr key={user.userId}>
                        <td>{user.userId}</td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>{user.successfulOrders ?? 0}</td>
                        <td>{formatCurrency(user.totalSpent || 0)}</td>
                        <td className="nex-admin-actions-cell">
                          <button type="button" className="nex-admin-inline-btn" onClick={() => handleViewUserSubmit({ userId: user.userId })}>View</button>
                          <button
                            type="button"
                            className="nex-admin-inline-btn"
                            onClick={() => {
                              setModalInitialData({ userId: user.userId });
                              setModalType("modifyUser");
                              setResponse(null);
                            }}
                          >
                            Modify
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        )}

        {shouldShowAnalytics && (
          <section className="nex-admin-analytics-wrap">
            <div className="nex-admin-analytics-head">
              <h2>Analytics Center</h2>
              <button type="button" onClick={fetchAnalyticsData} disabled={analyticsLoading}>
                {analyticsLoading ? <LoaderCircle size={16} className="spin" /> : <RefreshCcw size={16} />}
                <span>{analyticsLoading ? "Refreshing..." : "Refresh Analytics"}</span>
              </button>
            </div>

            {analyticsError && <p className="nex-admin-analytics-error">{analyticsError}</p>}
            {analyticsData.updatedAt && <p className="nex-admin-updated-at">Last updated: {analyticsData.updatedAt}</p>}
            {!analyticsLoading && !analyticsError && !hasAnalyticsData && (
              <p className="nex-admin-updated-at">No business data available yet. Complete some orders to see real analytics.</p>
            )}

            <div className="nex-admin-mini-kpis">
              {analyticsStats.map((item) => {
                const Icon = item.icon;
                return <article key={item.label} className="nex-admin-mini-card"><Icon size={16} /><div><h4>{item.label}</h4><p>{formatCompactNumber(item.value)}</p></div></article>;
              })}
            </div>

            <div className="nex-admin-chart-grid">
              <article className="nex-admin-chart-card">
                <h3>Top Sold Products</h3>
                <div className="nex-admin-bar-chart">
                  {barSeries.length ? barSeries.map((item, index) => {
                    const max = Math.max(...barSeries.map((entry) => entry.value), 1);
                    const barHeightPx = Math.max((item.value / max) * 160, 14);
                    return <div key={`${item.label}-${index}`} className="nex-admin-bar-col"><div className="nex-admin-bar" style={{ height: `${barHeightPx}px` }} /><span title={item.label}>{item.label}</span></div>;
                  }) : <p className="nex-admin-updated-at">No sold products yet</p>}
                </div>
              </article>

              <article className="nex-admin-chart-card">
                <h3>Revenue Trend</h3>
                <div className="nex-admin-line-wrap">
                  <svg viewBox="0 0 560 220" preserveAspectRatio="none" role="img" aria-label="Line chart">
                    <polyline points={buildLinePoints(lineSeries)} fill="none" stroke="url(#lineGradient)" strokeWidth="4" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#14b8a6" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="nex-admin-chart-labels">
                  {lineSeries.length ? lineSeries.slice(-6).map((item) => <span key={item.label}>{item.label}</span>) : <span>No revenue data</span>}
                </div>
              </article>

              <article className="nex-admin-chart-card">
                <h3>Category Sales Mix</h3>
                <div className="nex-admin-pie-layout">
                  {pieSeries.length ? <div className="nex-admin-pie" style={{ background: buildPieBackground(pieSeries) }} /> : <p className="nex-admin-updated-at">No category sales yet</p>}
                  <div className="nex-admin-legend">
                    {pieSeries.map((item, index) => (
                      <div key={`${item.label}-${index}`} className="nex-admin-legend-item">
                        <span style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                        <p>{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </div>
          </section>
        )}

        {sectionCards.length > 0 && (
          <section className="nex-admin-actions">
            {sectionCards.map((card) => (
              <button
                type="button"
                key={card.modalType}
                className="nex-admin-action-card"
                onClick={() => {
                  setModalType(card.modalType);
                  setModalInitialData(null);
                  setResponse(null);
                }}
              >
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <small>{card.team}</small>
              </button>
            ))}

            {sectionCards.length === 0 && (
              <div className="nex-admin-empty">
                <p>No admin actions match this search/filter.</p>
              </div>
            )}
          </section>
        )}
      </main>

      {modalType && (
        <CustomModal
          modalType={modalType}
          initialData={modalInitialData}
          onClose={() => {
            setModalType(null);
            setResponse(null);
            setModalInitialData(null);
            fetchOverview();
          }}
          onSubmit={(data) => {
            switch (modalType) {
              case "addProduct":
                handleAddProductSubmit(data);
                break;
              case "deleteProduct":
                handleDeleteProductSubmit(data);
                break;
              case "viewUser":
                handleViewUserSubmit(data);
                break;
              case "modifyUser":
                setModalType("modifyUser");
                break;
              case "monthlyBusiness":
                handleMonthlyBusiness(data);
                break;
              case "dailyBusiness":
                handleDailyBusiness(data);
                break;
              case "yearlyBusiness":
                handleYearlyBusiness(data);
                break;
              case "overallBusiness":
                handleOverallBusiness();
                break;
              default:
                break;
            }
          }}
          response={response}
        />
      )}
    </div>
  );
};

export default AdminDashboard;




