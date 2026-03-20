import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../services/adminApi";
import API_BASE_URL from "../../config/api";
import { useToast } from "../../components/ui/ToastContext";

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

const notificationColors = {
  ORDER: "bg-indigo-500",
  STOCK: "bg-rose-500",
  RETURN: "bg-amber-500",
  SYSTEM: "bg-slate-400"
};

const NotificationsPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const wsClientRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  const loadNotifications = async ({ nextPage = page, nextQuery = query, nextSize = size } = {}) => {
    setLoading(true);
    try {
      const data = await adminApi.getNotifications({ q: nextQuery, page: nextPage, size: nextSize });
      setNotifications(Array.isArray(data?.items) ? data.items : []);
      setUnreadCount(Number(data?.unreadCount || 0));
      setTotalPages(Number(data?.totalPages || 1));
      setTotalItems(Number(data?.totalItems || 0));
      setPage(Number(data?.page || nextPage));
    } catch (error) {
      toast.error(error.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
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
              setUnreadCount((count) => count + (payload.read ? 0 : 1));
              if (page !== 1 || query) return;
              setNotifications((prev) => {
                if (prev.some((item) => item.id === payload.id)) return prev;
                return [payload, ...prev].slice(0, size);
              });
              setTotalItems((count) => count + 1);
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
  }, [page, query, size]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadNotifications({ nextPage: 1, nextQuery: query, nextSize: size });
  };

  const handleMarkAllRead = async () => {
    try {
      await adminApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read.");
    } catch (error) {
      toast.error(error.message || "Failed to mark notifications.");
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await adminApi.markNotificationRead(id);
      setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      toast.error(error.message || "Failed to update notification.");
    }
  };

  const statsLabel = useMemo(() => {
    if (totalItems === 0) return "No notifications yet";
    return `${totalItems} notification${totalItems === 1 ? "" : "s"} total`;
  }, [totalItems]);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Notifications</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{statsLabel} • {unreadCount} unread</p>
          </div>
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
          >
            Mark all as read
          </button>
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search notifications..."
          className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-900/30"
        />
        <select
          value={size}
          onChange={(event) => {
            const nextSize = Number(event.target.value || 10);
            setSize(nextSize);
            loadNotifications({ nextPage: 1, nextQuery: query, nextSize });
          }}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          Search
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">No notifications found.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((item) => (
              <div key={item.id} className="flex items-start gap-4 px-6 py-4">
                <span className={`mt-2 h-2.5 w-2.5 rounded-full ${item.read ? "bg-slate-300 dark:bg-slate-700" : (notificationColors[item.type] || "bg-slate-300")}`} />
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className={`text-sm ${item.read ? "font-medium text-slate-600 dark:text-slate-300" : "font-semibold text-slate-900 dark:text-white"}`}>
                      {item.title}
                    </p>
                    <span className="text-xs text-slate-400">{formatTimeAgo(item.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.message}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    {item.link ? (
                      <button
                        type="button"
                        onClick={() => navigate(item.link)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        View details
                      </button>
                    ) : null}
                    {!item.read ? (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(item.id)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        Mark as read
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const nextPage = Math.max(1, page - 1);
              setPage(nextPage);
              loadNotifications({ nextPage });
            }}
            disabled={!canGoPrev}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => {
              const nextPage = Math.min(totalPages, page + 1);
              setPage(nextPage);
              loadNotifications({ nextPage });
            }}
            disabled={!canGoNext}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
};

export default NotificationsPage;
