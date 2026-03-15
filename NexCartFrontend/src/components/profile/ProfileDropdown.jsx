import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useravatar from "../../assets/images/useravatar.png";
import "../../styles/styles.css";

export function ProfileDropdown({ username }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

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
      await fetch("http://localhost:9090/api/auth/logout", {
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
        className="profile-button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-label="Open profile menu"
      >
        <img
          src={useravatar}
          alt="User avatar"
          className="user-avatar"
          onError={(e) => {
            e.target.src = useravatar;
          }}
        />
        <span className="username">{username || "Guest"}</span>
        <svg className="profile-dropdown-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s, color 0.2s', color: isOpen ? 'var(--accent)' : 'var(--text-muted)' }}>
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
