import React, { useState, useRef, useEffect } from "react";
import { Bell, Menu, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/ui/ToastContext";
import API_BASE_URL from "../../config/api";
import useravatar from "../../assets/images/useravatar.png";

const Navbar = ({ title, onMenuToggle, theme, onThemeToggle }) => {
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(useravatar);
  const bellRef = useRef(null);
  const wsClientRef = useRef(null);
  const toast = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);

  const notificationColors = {
    ORDER: "bg-indigo-500",
    STOCK: "bg-rose-500",
    RETURN: "bg-amber-500",
    SYSTEM: "bg-slate-400"
  };

  const formatTimeAgo = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSeconds < 60) return "Just now";
    const minutes = Math.floor(diffSeconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  };

  const fetchNotifications = async () => {
    setIsNotificationsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/notifications?limit=10`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(Array.isArray(data.items) ? data.items : []);
      setUnreadCount(Number(data.unreadCount || 0));
    } catch (e) {
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  const handleMarkAllRead = () => {
    fetch(`${API_BASE_URL}/admin/notifications/mark-all-read`, {
      method: "POST",
      credentials: "include"
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read.");
      })
      .catch(() => {
        toast.error("Failed to mark notifications as read.");
      });
  };

  const handleViewAll = () => {
    setIsNotificationsOpen(false);
    navigate("/admindashboard/notifications");
  };

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/profile`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.avatarUrl && String(data.avatarUrl).trim()) setAvatarUrl(String(data.avatarUrl).trim());
        }
      } catch (e) {}
    }
    fetchAvatar();
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const connect = async () => {
      try {
        const [{ Client }, sockjs] = await Promise.all([
          import("@stomp/stompjs"),
          import("sockjs-client"),
        ]);

        if (cancelled) return;
        const SockJS = sockjs.default;
        const client = new Client({
          webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
          reconnectDelay: 5000,
        });

        client.onConnect = () => {
          client.subscribe("/topic/admin-notifications", (message) => {
            try {
              const payload = JSON.parse(message.body);
              if (!payload?.id) return;
              setNotifications((prev) => {
                if (prev.some((item) => item.id === payload.id)) return prev;
                const next = [payload, ...prev];
                return next.slice(0, 10);
              });
              if (!payload.read) {
                setUnreadCount((count) => count + 1);
              }
            } catch (e) {}
          });
        };

        client.activate();
        wsClientRef.current = client;
      } catch (e) {
        // ignore websocket errors
      }
    };

    connect();

    return () => {
      cancelled = true;
      try {
        wsClientRef.current?.deactivate();
      } catch (e) {}
    };
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
            className="admin-icon-btn"
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" strokeWidth={2} /> : <Moon className="h-5 w-5" strokeWidth={2} />}
          </button>

          <div className="relative" ref={bellRef}>
            <button 
              onClick={() => {
                const nextOpen = !isNotificationsOpen;
                setIsNotificationsOpen(nextOpen);
                if (nextOpen) {
                  fetchNotifications();
                }
              }}
              className="admin-icon-btn focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/20"
            >
              <Bell className="h-5 w-5" strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="absolute right-[9px] top-[9px] h-[10px] w-[10px] rounded-full ring-2 ring-white dark:ring-slate-800 bg-rose-500" />
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 max-sm:fixed max-sm:left-[50%] max-sm:right-auto max-sm:-translate-x-1/2 max-sm:top-[70px] top-[calc(100%+8px)] w-[92vw] sm:w-80 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800 animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 px-4 py-3">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">Mark all as read</button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {isNotificationsLoading ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-500">Loading notifications...</div>
                  ) : notifications.length > 0 ? notifications.map((n) => (
                    <div key={n.id} onClick={() => {
                        if (!n.read) {
                           fetch(`${API_BASE_URL}/admin/notifications/${n.id}/read`, {
                             method: "PATCH",
                             credentials: "include"
                           }).then(() => {
                             setNotifications((prev) => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
                             setUnreadCount((count) => Math.max(0, count - 1));
                           });
                        }
                        if (n.link) {
                          setIsNotificationsOpen(false);
                          navigate(n.link);
                        }
                    }} className={`flex gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer ${n.read ? 'opacity-70' : ''}`}>
                      <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-slate-300 dark:bg-slate-600' : (notificationColors[n.type] || 'bg-slate-300')}`} />
                      <div>
                        <p className={`text-[13px] ${n.read ? 'font-medium text-slate-600 dark:text-slate-300' : 'font-semibold text-slate-800 dark:text-slate-100'}`}>{n.title}</p>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">{formatTimeAgo(n.createdAt)}</p>
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
              <img
                src={(avatarUrl && String(avatarUrl).trim()) ? avatarUrl : useravatar}
                alt="Admin"
                className="admin-avatar-img h-[34px] w-[34px] rounded-full object-cover ring-1 ring-slate-100 dark:ring-slate-700"
                onError={() => { setAvatarUrl(useravatar); }}
              />
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
