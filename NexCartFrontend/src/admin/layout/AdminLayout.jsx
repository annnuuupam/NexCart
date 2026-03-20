import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import API_BASE_URL from '../../config/api';

const THEME_KEY = "nexcart-admin-theme";

const titleMap = {
  "/admindashboard": "Dashboard",
  "/admindashboard/products": "Products Management",
  "/admindashboard/categories": "Categories Management",
  "/admindashboard/orders": "Orders Management",
  "/admindashboard/customers": "Customers Management",
  "/admindashboard/coupons": "Coupons & Discounts",
  "/admindashboard/analytics": "Analytics",
  "/admindashboard/support": "Support Tickets",
  "/admindashboard/notifications": "Notifications",
  "/admindashboard/settings": "Settings",
};

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (_) {
      // ignore
    }
  }, [theme]);

  const title = useMemo(() => titleMap[location.pathname] || "Admin Panel", [location.pathname]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout request failed", error);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      navigate("/admin", { replace: true });
    }
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "admin-theme-dark" : "admin-theme-light"}`}>
      <div className="mx-auto flex w-full max-w-[1800px]">
        <Sidebar onLogout={handleLogout} theme={theme} />

        {openMobileMenu ? (
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpenMobileMenu(false)}>
            <div className="h-full w-72 bg-white p-4" onClick={(event) => event.stopPropagation()}>
              <Sidebar onLogout={handleLogout} mobile theme={theme} />
            </div>
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <Navbar
            title={title}
            onMenuToggle={() => setOpenMobileMenu((prev) => !prev)}
            theme={theme}
            onThemeToggle={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          />
          <main className="px-4 pb-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
