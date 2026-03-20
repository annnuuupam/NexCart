import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Users,
  TicketPercent,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Store,
  LifeBuoy,
} from "lucide-react";

import { adminNavItems } from "../config/navItems";

const iconMap = {
  Dashboard: LayoutDashboard,
  Products: Package,
  Categories: Tags,
  Orders: ShoppingCart,
  Customers: Users,
  Coupons: TicketPercent,
  Analytics: BarChart3,
  Support: LifeBuoy,
  Notifications: Bell,
  Settings,
};

const Sidebar = ({ onLogout, mobile = false }) => {
  return (
    <aside
      className={
        mobile
          ? "h-full w-full bg-white"
          : "sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-200 bg-white px-4 py-6 lg:block"
      }
    >
      <div className={mobile ? "mb-6 flex items-center gap-3 rounded-xl bg-slate-50 p-3" : "mb-8 flex items-center gap-3 rounded-xl bg-slate-50 p-3"}>
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-blue-600 text-white">
          <Store className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xl font-bold text-slate-900">NexCart</p>
          <p className="text-sm text-slate-500">Admin Panel</p>
        </div>
      </div>

      <nav className="space-y-1.5">
        {adminNavItems.map((item) => {
          const Icon = iconMap[item.label];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admindashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              {Icon ? <Icon className="h-4 w-4" /> : null}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <button
        onClick={onLogout}
        className="mt-8 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
      >
        <LogOut className="h-4 w-4" />
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;
