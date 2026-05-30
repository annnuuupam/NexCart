import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, MapPin } from "lucide-react";
import API_BASE_URL from "../../config/api";
import { useToast } from "../ui/ToastContext";
import { CartIcon } from "../cart/CartIcon";
import { ProfileDropdown } from "../profile/ProfileDropdown";
import { ThemeToggle } from "./ThemeToggle";
import Logo from "./Logo";
import "../../styles/styles.css";

const LOCATION_KEY = "nexcart_delivery_country";
const ALL_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Côte d'Ivoire", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Holy See", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman",
  "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
  "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "UAE", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

export function Header({
  cartCount,
  username,
  searchQuery = "",
  searchScope = "all",
  onSearchChange,
  onSearchScopeChange,
  onSearchSubmit,
  onClearSearch,
}) {
  const navigate = useNavigate();
  const [isScopeOpen, setIsScopeOpen] = useState(false);
  const scopeMenuRef = useRef(null);
  const bellRef = useRef(null);
  const locationRef = useRef(null);
  const toast = useToast();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [userId, setUserId] = useState(null);
  const wsClientRef = useRef(null);
  const [deliveryCountry, setDeliveryCountry] = useState(
    () => localStorage.getItem(LOCATION_KEY) || ""
  );
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [locationInput, setLocationInput] = useState("");

  const scopeOptions = [
    { value: "all", label: "All" },
    { value: "name", label: "Product Name" },
    { value: "description", label: "Description" },
    { value: "category", label: "Category" },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (scopeMenuRef.current && !scopeMenuRef.current.contains(event.target)) {
        setIsScopeOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setIsLocationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch user's saved country from profile on mount
  useEffect(() => {
    const loadCountry = async () => {
      const cached = localStorage.getItem(LOCATION_KEY);
      if (cached) { setDeliveryCountry(cached); return; }
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/profile`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        const country = data?.country || data?.shippingAddress?.country || "";
        if (country) {
          setDeliveryCountry(country);
          localStorage.setItem(LOCATION_KEY, country);
        }
      } catch (_) {}
    };
    loadCountry();
  }, []);

  const handleLocationSave = (country) => {
    const trimmed = country.trim();
    if (!trimmed) return;
    setDeliveryCountry(trimmed);
    localStorage.setItem(LOCATION_KEY, trimmed);
    setIsLocationOpen(false);
    setLocationInput("");
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
    setNotificationsError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications?limit=8`, { credentials: "include" });
      if (res.status === 401 || res.status === 403) {
        setAuthRequired(true);
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      if (!res.ok) {
        setNotificationsError("Unable to load notifications.");
        return;
      }
      const data = await res.json();
      setAuthRequired(false);
      setNotifications(Array.isArray(data.items) ? data.items : []);
      setUnreadCount(Number(data.unreadCount || 0));
    } catch (e) {
      setNotificationsError("Unable to load notifications.");
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: "include" });
      if (!res.ok) {
        setUserId(null);
        setAuthRequired(true);
        return;
      }
      const data = await res.json();
      setUserId(data?.userId ?? null);
      setAuthRequired(false);
    } catch {
      setUserId(null);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const connect = async () => {
      if (!userId) return;
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
          client.subscribe(`/topic/user-notifications/${userId}`, (message) => {
            try {
              const payload = JSON.parse(message.body);
              if (!payload?.id) return;
              setNotifications((prev) => {
                if (prev.some((item) => item.id === payload.id)) return prev;
                const next = [payload, ...prev];
                return next.slice(0, 8);
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
  }, [userId]);

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <Logo />
          <div className="header-location-wrap" ref={locationRef}>
            <button
              type="button"
              className="header-location"
              onClick={() => { setIsLocationOpen(v => !v); setLocationInput(""); }}
              aria-label="Change delivery location"
              title="Click to change delivery location"
            >
              <div className="location-icon-wrapper">
                <MapPin size={14} className="location-pin-icon" />
              </div>
              <div className="location-text-stack">
                <span className="location-label">Deliver to</span>
                <span className="location-value">{deliveryCountry || "Your location"}</span>
              </div>
              <svg className="location-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isLocationOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {isLocationOpen && (
              <div className="location-dropdown">
                <p className="location-dropdown-title">Choose your delivery location</p>
                <div className="location-input-row">
                  <input
                    type="text"
                    className="location-input"
                    value={locationInput}
                    onChange={e => setLocationInput(e.target.value)}
                    placeholder="Search countries…"
                    onKeyDown={e => { if (e.key === "Enter") handleLocationSave(locationInput); }}
                    autoFocus
                  />
                  <button type="button" className="location-save-btn" onClick={() => handleLocationSave(locationInput)}>Save</button>
                </div>
                <div className="location-quick-list">
                  {ALL_COUNTRIES.filter(c => c.toLowerCase().includes(locationInput.toLowerCase())).length > 0 ? (
                    ALL_COUNTRIES.filter(c => c.toLowerCase().includes(locationInput.toLowerCase())).map(c => (
                      <button
                        key={c}
                        type="button"
                        className={`location-quick-item${deliveryCountry === c ? " active" : ""}`}
                        onClick={() => handleLocationSave(c)}
                      >{c}</button>
                    ))
                  ) : (
                    <div className="location-no-results">No countries found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <form className="header-search" onSubmit={onSearchSubmit}>
          <div className="search-scope-wrapper" ref={scopeMenuRef}>
            <button
              type="button"
              className="search-scope"
              onClick={() => setIsScopeOpen(!isScopeOpen)}
              aria-label="Select search scope"
              aria-expanded={isScopeOpen}
            >
              {scopeOptions.find(opt => opt.value === searchScope)?.label || "All"}
            </button>
            <svg className="search-scope-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isScopeOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            
            {isScopeOpen && (
              <div className="dropdown-menu" style={{ top: 'calc(100% + 14px)', left: 0, zIndex: 1000, width: 'max-content', minWidth: '160px' }}>
                {scopeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      onSearchScopeChange?.(option.value);
                      setIsScopeOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder="Search products, brands and more"
            aria-label="Search products"
          />
          {searchQuery ? (
            <button type="button" className="search-clear" onClick={onClearSearch}>
              Clear
            </button>
          ) : null}
          <button type="submit" className="search-submit" aria-label="Search">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="search-submit-icon">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span className="search-text">Search</span>
          </button>
        </form>

        <div className="header-actions">
          <ThemeToggle />
          <div className="header-notifications" ref={bellRef}>
            <button
              type="button"
              className="header-icon-btn"
              onClick={() => {
                const nextOpen = !isNotificationsOpen;
                setIsNotificationsOpen(nextOpen);
                if (nextOpen) fetchNotifications();
              }}
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 ? <span className="header-notification-dot" /> : null}
            </button>
            {isNotificationsOpen ? (
              <div className="header-notification-panel">
                <div className="header-notification-header">
                  <span>Notifications</span>
                  {unreadCount > 0 ? (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await fetch(`${API_BASE_URL}/api/notifications/mark-all-read`, {
                            method: "POST",
                            credentials: "include",
                          });
                          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                          setUnreadCount(0);
                          toast.success("All notifications marked as read.");
                        } catch {
                          toast.error("Failed to mark notifications.");
                        }
                      }}
                    >
                      Mark all read
                    </button>
                  ) : null}
                </div>
                <div className="header-notification-list">
                  {isNotificationsLoading ? (
                    <div className="header-notification-empty">Loading...</div>
                  ) : authRequired ? (
                    <div className="header-notification-empty">
                      Please sign in to view notifications.
                      <button
                        type="button"
                        className="search-submit"
                        style={{ marginTop: "10px", width: "100%", justifyContent: "center" }}
                        onClick={() => navigate("/")}
                      >
                        Go to Login
                      </button>
                    </div>
                  ) : notificationsError ? (
                    <div className="header-notification-empty">{notificationsError}</div>
                  ) : notifications.length ? (
                    notifications.map((n) => (
                      <button
                        type="button"
                        key={n.id}
                        className={`header-notification-item ${n.read ? "is-read" : ""}`}
                        onClick={async () => {
                          if (!n.read) {
                            await fetch(`${API_BASE_URL}/api/notifications/${n.id}/read`, {
                              method: "PATCH",
                              credentials: "include",
                            });
                            setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
                            setUnreadCount((count) => Math.max(0, count - 1));
                          }
                          if (n.link) window.location.href = n.link;
                        }}
                      >
                        <div className="header-notification-title">{n.title}</div>
                        <div className="header-notification-msg">{n.message}</div>
                        <div className="header-notification-time">{formatTimeAgo(n.createdAt)}</div>
                      </button>
                    ))
                  ) : (
                    <div className="header-notification-empty">No new notifications</div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <CartIcon count={cartCount} />
          <ProfileDropdown username={username} />
        </div>
      </div>
    </header>
  );
}
