import React, { useState, useRef, useEffect } from "react";
import { Bell, Menu, Moon, Sun } from "lucide-react";
import { useToast } from "../../components/ui/ToastContext";
import API_BASE_URL from "../../config/api";
import useravatar from "../../assets/images/useravatar.png";

const Navbar = ({ title, onMenuToggle, theme, onThemeToggle }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(useravatar);
  const bellRef = useRef(null);
  const { addToast } = useToast();

  const [notifications, setNotifications] = useState([
    { id: 1, title: "New order #1024 placed", desc: "John Doe purchased 2 items totaling $140.00.", time: "2 minutes ago", read: false, color: "bg-indigo-500" },
    { id: 2, title: "Low stock alert", desc: "Product 'Wireless Headphones' is running low on stock (2 remaining).", time: "1 hour ago", read: false, color: "bg-rose-500" },
    { id: 3, title: "System maintenance", desc: "Scheduled maintenance will occur tonight at 2:00 AM UTC.", time: "5 hours ago", read: true, color: "bg-slate-300 dark:bg-slate-600" }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    addToast("All notifications marked as read.", "success");
  };

  const handleViewAll = () => {
    setIsNotificationsOpen(false);
    addToast("Opening Notification Center...", "info");
  };

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/profile`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
        }
      } catch (e) {}
    }
    fetchAvatar();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 mb-6 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
      <div className="grid grid-cols-1 gap-3 px-4 py-4 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
        <div className="flex min-w-0 items-center justify-between lg:justify-start gap-4 flex-1">
          <button
            type="button"
            onClick={onMenuToggle}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-none mr-2">
            <h1 className="truncate text-xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Manage your store operations</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3.5 mt-2 lg:mt-0">
          <button
            type="button"
            onClick={onThemeToggle}
            className="relative grid h-[42px] w-[42px] place-items-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm"
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" strokeWidth={2} /> : <Moon className="h-5 w-5" strokeWidth={2} />}
          </button>

          <div className="relative" ref={bellRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative grid h-[42px] w-[42px] place-items-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/20"
            >
              <Bell className="h-5 w-5" strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="absolute right-[9px] top-[9px] h-[10px] w-[10px] rounded-full ring-2 ring-white dark:ring-slate-800 bg-rose-500" />
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800 animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 px-4 py-3">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">Mark all as read</button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length > 0 ? notifications.map((n) => (
                    <div key={n.id} onClick={() => {
                        if (!n.read) {
                           setNotifications(notifications.map(x => x.id === n.id ? { ...x, read: true } : x));
                        }
                    }} className={`flex gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer ${n.read ? 'opacity-70' : ''}`}>
                      <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-slate-300 dark:bg-slate-600' : n.color}`} />
                      <div>
                        <p className={`text-[13px] ${n.read ? 'font-medium text-slate-600 dark:text-slate-300' : 'font-semibold text-slate-800 dark:text-slate-100'}`}>{n.title}</p>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{n.desc}</p>
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">{n.time}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="px-4 py-6 text-center text-sm text-slate-500">No new notifications</div>
                  )}
                </div>
                <div className="border-t border-slate-100 dark:border-slate-700/50 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 text-center">
                  <button onClick={handleViewAll} className="text-[13px] font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">View all notifications</button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <div
               className="flex h-[44px] items-center gap-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-1.5 pr-4 shadow-sm"
            >
              {avatarUrl && avatarUrl !== useravatar ? (
                <img
                  src={avatarUrl}
                  alt="Admin"
                  className="h-[34px] w-[34px] rounded-full object-cover ring-1 ring-slate-100 dark:ring-slate-700"
                  onError={(e) => { e.target.src = useravatar; }}
                />
              ) : (
                <div className="h-[34px] w-[34px] shrink-0 rounded-full overflow-hidden ring-[1.5px] ring-slate-100 dark:ring-slate-700 bg-indigo-50/30 dark:bg-slate-800 flex items-center justify-center relative">
                  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 h-full w-full">
                    <circle cx="18" cy="14" r="5.5" fill="#fabc41" />
                    <path d="M7 33C7 26.5 11.5 22.5 18 22.5C24.5 22.5 29 26.5 29 33" fill="#5f7782" />
                  </svg>
                </div>
              )}
              <div className="hidden md:flex flex-col items-start -space-y-0.5">
                <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 tracking-tight">Store Admin</p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">admin@nexcart.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
