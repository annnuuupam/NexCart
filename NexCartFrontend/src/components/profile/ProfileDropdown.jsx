import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useravatar from "../../assets/images/useravatar.png";
import "../../styles/styles.css";
import API_BASE_URL from '../../config/api';

export function ProfileDropdown({ username }) {
  const [isOpen, setIsOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(useravatar);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/profile`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
        }
      } catch (err) { }
    };
    fetchAvatar();
  }, [username]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setIsOpen(false);
      navigate("/", { replace: true });
    }
  };

  const goTo = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="profile-dropdown" ref={menuRef}>
      <button
        type="button"
        className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 min-w-[120px] max-w-[180px]"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-label="Open profile menu"
      >
        <img
          src={avatarUrl}
          alt="User avatar"
          className="h-8 w-8 shrink-0 rounded-full object-cover"
          onError={(e) => {
            e.target.src = useravatar;
          }}
        />
        <span className="truncate text-[14px] font-semibold text-slate-700 dark:text-slate-200 flex-1 text-left">{username || "Guest"}</span>
        <svg className="shrink-0 transition-transform duration-200" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: isOpen ? 'var(--accent)' : '#64748b' }}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>      {isOpen && (
        <div className="dropdown-menu">
          <button type="button" className="dropdown-item" onClick={() => goTo("/profile")}>Profile</button>
          <button type="button" className="dropdown-item" onClick={() => goTo("/orders")}>Orders</button>
          <button type="button" className="dropdown-item" onClick={() => goTo("/wishlist")}>Wishlist</button>
          <button type="button" className="dropdown-item" onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
}
