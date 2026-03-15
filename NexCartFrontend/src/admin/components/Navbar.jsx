import React from "react";
import { Bell, Search, Menu, Moon, Sun } from "lucide-react";

const Navbar = ({ title, onMenuToggle, theme, onThemeToggle }) => {
  return (
    <header className="sticky top-0 z-30 mb-6 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="grid grid-cols-1 gap-3 px-4 py-4 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold text-slate-900">{title}</h1>
            <p className="text-xs text-slate-500">Manage your store operations</p>
          </div>

          <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="text"
              placeholder="Search products, orders, customers..."
              className="w-full bg-transparent text-sm text-slate-700 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onThemeToggle}
            className="relative grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button className="relative grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-2.5 py-1.5">
            <img
              src="https://i.pravatar.cc/80?img=12"
              alt="Admin"
              className="h-8 w-8 rounded-full object-cover"
            />
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-slate-800">Store Admin</p>
              <p className="text-xs text-slate-500">admin@nexcart.com</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
